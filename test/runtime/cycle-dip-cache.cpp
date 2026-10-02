// A dip (a strong count falling to a nonzero value on a traced type) goes into
// the dip cache -- one store into a direct-mapped table of block addresses --
// and the death it usually precedes takes the entry back with one load and one
// store (`bufferCycleDip`, `forgetDeadCandidate`). Only an entry another dip
// displaces, or one a safepoint flushes, reaches `CycleState::candidates`.
//
// What must hold, for a type reached through the operations table and for a
// final one alike:
//  - a buffered object that dies leaves nothing behind, and its block is free;
//  - a buffered object that is revived (more owners, more dips) stays one
//    entry and one bit, and dies cleanly later;
//  - an entry displaced into the buffer is still found when its object dies;
//  - garbage cycles are still collected, whether their dips sit in the cache,
//    the buffer, or both, by an explicit collection, the allocation safepoint
//    and the quiescent point;
//  - a destructor run BY a collection may dip a survivor, and that dip is an
//    ordinary cache entry afterwards.
// `DipCache::count` is the number of non-null slots throughout.
#include "gea_runtime.h"
#include <cassert>
#include <vector>

struct Node {
  static inline int live = 0;
  gea::Ref<Node> a;
  gea::Ref<Node> b;
  Node() { ++live; }
  ~Node() { --live; }
  friend void geaTraceRefs(const Node& value, gea::detail::RefVisitor& visitor) {
    gea::detail::traceRefs(value.a, visitor);
    gea::detail::traceRefs(value.b, visitor);
  }
};

// Final: its last release takes the direct path, not the operations table.
struct Leaf final {
  static inline int live = 0;
  gea::Ref<Leaf> a;
  Leaf() { ++live; }
  ~Leaf() { --live; }
  friend void geaTraceRefs(const Leaf& value, gea::detail::RefVisitor& visitor) { gea::detail::traceRefs(value.a, visitor); }
};

template <typename T>
static gea::detail::RefCounts* countsOf(const gea::Ref<T>& ref) {
  return gea::detail::refCountsOf(ref.get());
}

static bool buffered(gea::detail::RefCounts* counts) { return (counts->weak & gea::detail::cycleBuffered) != 0; }

static std::size_t occupied() {
  std::size_t n = 0;
  for (auto* slot : gea::detail::dipCache().slots) n += slot != nullptr;
  return n;
}

static bool cached(gea::detail::RefCounts* counts) {
  return gea::detail::dipCache().slots[gea::detail::dipCacheSlot(counts)] == counts;
}

static void quiet() {
  gea::collectCycles();
  assert(gea::detail::dipCache().count == 0 && occupied() == 0);
}

template <typename T>
static void testDeadBufferedCandidate() {
  quiet();
  auto& cache = gea::detail::dipCache();
  auto& state = gea::detail::cycleState();
  const auto candidates = state.candidates.size();
  {
    auto holder = gea::makeRef<T>();
    gea::detail::RefCounts* childCounts;
    {
      auto child = gea::makeRef<T>();
      childCounts = countsOf(child);
      holder->a = child;
    }  // child dips to 1
    assert(buffered(childCounts) && cached(childCounts) && cache.count == 1);
    assert(state.candidates.size() == candidates);  // not in the buffer: the cache absorbed it
    holder = {};  // holder dies, then child
    assert(T::live == 0);
    assert(cache.count == 0 && occupied() == 0);
  }
  assert(state.candidates.size() == candidates);
}

template <typename T>
static void testRevivedCandidate() {
  quiet();
  auto& cache = gea::detail::dipCache();
  auto holder = gea::makeRef<T>();
  gea::Ref<T> second;
  {
    auto child = gea::makeRef<T>();
    holder->a = child;
    second = child;  // strong 3 -> after the local goes, 2
  }
  auto* counts = countsOf(holder->a);
  assert(buffered(counts) && cache.count == 1);
  { auto again = holder->a; }  // dips again: the bit is set, so no second entry
  { auto again = second; }
  assert(cache.count == 1 && occupied() == 1);
  holder = {};  // one owner fewer; the child is still held by `second`
  assert(T::live == 1 && cache.count == 1 && buffered(counts));
  second = {};  // the last owner goes: the entry goes with it
  assert(T::live == 0 && cache.count == 0 && occupied() == 0);

  // A revived entry that a safepoint already moved to the buffer is still removed at death.
  auto& state = gea::detail::cycleState();
  auto parent = gea::makeRef<T>();
  gea::Ref<T> keep;
  {
    auto child = gea::makeRef<T>();
    parent->a = child;
    keep = child;
  }
  assert(cache.count == 1);
  gea::detail::flushDipCache(state);
  assert(cache.count == 0 && state.candidates.back().object == keep.get());
  const auto before = state.candidates.size();
  parent = {};
  keep = {};
  assert(T::live == 0);
  assert(state.candidates.size() == before - 1);  // found through the buffer's own hint
}

template <typename T>
static bool inCache(gea::detail::RefCounts* counts) {
  for (auto* slot : gea::detail::dipCache().slots) {
    if (gea::detail::dipEntryIs(slot, counts)) return true;
  }
  return false;
}

template <typename T>
static void testDisplacedEntryIsStillFound() {
  quiet();
  auto& cache = gea::detail::dipCache();
  auto& state = gea::detail::cycleState();
  // Three live objects whose blocks hash to one two-slot set.
  std::vector<gea::Ref<T>> pool;
  gea::Ref<T> a, b, c;
  for (int i = 0; i < 20000 && !c; ++i) {
    pool.push_back(gea::makeRef<T>());
    std::vector<std::size_t> same;
    for (std::size_t j = 0; j + 1 < pool.size(); ++j) {
      if (gea::detail::dipCacheSet(countsOf(pool[j])) == gea::detail::dipCacheSet(countsOf(pool.back()))) same.push_back(j);
    }
    if (same.size() >= 2) {
      a = pool[same[0]];
      b = pool[same[1]];
      c = pool.back();
    }
  }
  assert(a && b && c);
  auto* aCounts = countsOf(a);
  auto* bCounts = countsOf(b);
  auto* cCounts = countsOf(c);
  { auto t = a; }
  { auto t = b; }
  assert(inCache<T>(aCounts) && inCache<T>(bCounts) && cache.count == 2);
  const auto before = state.candidates.size();
  { auto t = c; }  // the set is full: one of the two goes to the buffer
  assert(inCache<T>(cCounts) && buffered(aCounts) && buffered(bCounts) && buffered(cCounts));
  assert(cache.count == 2 && state.candidates.size() == before + 1);
  auto* displaced = state.candidates.back().counts;
  assert((displaced == aCounts || displaced == bCounts) && !inCache<T>(displaced));
  // The displaced object dies while the buffer holds its entry: the hint finds it.
  auto* const displacedObject = (displaced == aCounts ? a : b).get();
  for (auto& handle : pool) {
    if (handle.get() == displacedObject) handle = {};
  }
  (displaced == aCounts ? a : b) = {};
  assert(state.candidates.size() == before);
  for (auto& handle : pool) handle = {};
  a = {};
  b = {};
  c = {};
  assert(cache.count == 0 && occupied() == 0);
  pool.clear();
  assert(T::live == 0);
}

template <typename T>
static void testCyclesAreStillCollected() {
  quiet();
  for (int i = 0; i < 100; ++i) {
    auto x = gea::makeRef<T>();
    auto y = gea::makeRef<T>();
    x->a = y;
    y->a = x;
  }
  assert(T::live <= 200);  // the default threshold may already have collected some
  quiet();  // an explicit collection flushes the cache first
  assert(T::live == 0);

  // The allocation safepoint counts the cache toward the threshold.
  gea::configureAutomaticCycleCollection(std::chrono::milliseconds(0), 0, 8);
  const auto collections = gea::detail::cycleState().collections;
  for (int i = 0; i < 100; ++i) {
    auto x = gea::makeRef<T>();
    auto y = gea::makeRef<T>();
    x->a = y;
    y->a = x;
  }
  assert(gea::detail::cycleState().collections > collections);
  assert(T::live < 100);  // collected as it went, not all at the end
  gea::configureAutomaticCycleCollection(std::chrono::milliseconds(0), 0, 64);
  quiet();
  assert(T::live == 0);

  // While no collection could be due the quiescent point only AGES the cache:
  // an entry that has lived through a second quiescent point is a survivor and
  // becomes a candidate, one that has not stays where its death will find it.
  {
    auto x = gea::makeRef<T>();
    auto y = gea::makeRef<T>();
    x->a = y;
    y->a = x;
  }
  assert(gea::detail::dipCache().count > 0);
  gea::collectCyclesAtQuiescence();
  assert(gea::detail::dipCache().count > 0);
  gea::collectCyclesAtQuiescence();
  assert(gea::detail::dipCache().count == 0);
  quiet();
  assert(T::live == 0);

  // A death between the two points leaves nothing behind, aged or not.
  {
    auto holder = gea::makeRef<T>();
    {
      auto child = gea::makeRef<T>();
      holder->a = child;
    }
    assert(gea::detail::dipCache().count == 1);
    gea::collectCyclesAtQuiescence();
    assert(gea::detail::dipCache().count == 1 && occupied() == 1);
  }
  assert(T::live == 0 && gea::detail::dipCache().count == 0 && occupied() == 0);

  // When a collection could follow (a quarter of the threshold buffered or
  // cached) the quiescent point examines everything alive in the cache at once.
  gea::configureAutomaticCycleCollection(std::chrono::milliseconds(0), 0, 8);
  {
    auto x = gea::makeRef<T>();
    auto y = gea::makeRef<T>();
    x->a = y;
    y->a = x;
  }
  assert(gea::detail::dipCache().count > 0);
  gea::collectCyclesAtQuiescence();
  assert(gea::detail::dipCache().count == 0);
  gea::configureAutomaticCycleCollection(std::chrono::milliseconds(0), 0, 64);
  quiet();
  assert(T::live == 0);
}

// A destructor the collector runs drops a survivor's second owner: that dip
// happens while the collection owns the buffer, and lands in the cache.
static void testDestroyDuringCollection() {
  quiet();
  auto& cache = gea::detail::dipCache();
  auto survivor = gea::makeRef<Node>();
  auto* survivorCounts = countsOf(survivor);
  {
    auto x = gea::makeRef<Node>();
    auto y = gea::makeRef<Node>();
    x->a = y;
    y->a = x;
    x->b = survivor;  // released by ~Node while the cycle is torn down
  }
  assert(Node::live == 3);
  gea::detail::collectReferenceCycles(/*full=*/true);
  assert(Node::live == 1);
  assert(survivorCounts->strong == 1);
  // The survivor's strong count fell 2 -> 1 inside a destructor run by the collection.
  assert(buffered(survivorCounts) && cached(survivorCounts) && cache.count == 1 && occupied() == 1);
  survivor = {};
  assert(Node::live == 0 && cache.count == 0 && occupied() == 0);
}

// An object that dies while a collection owns the buffer, with its dip still in the cache.
static void testDeathInsideDestructorOfCollection() {
  quiet();
  auto& cache = gea::detail::dipCache();
  gea::Ref<Node> outside;
  {
    auto x = gea::makeRef<Node>();
    auto y = gea::makeRef<Node>();
    auto shared = gea::makeRef<Node>();
    x->a = y;
    y->a = x;
    x->b = shared;
    y->b = shared;  // two edges from the garbage, plus the local
    outside = shared;
  }
  // shared: strong 4 (outside + two edges + the local, now gone) -> 3; dipped, cached.
  assert(cache.count >= 1);
  gea::collectCycles();
  assert(Node::live == 1);  // only `outside`'s object survives
  assert(cache.count == occupied());
  outside = {};
  assert(Node::live == 0 && cache.count == 0 && occupied() == 0);
}

int main() {
  testDeadBufferedCandidate<Node>();
  testDeadBufferedCandidate<Leaf>();
  testRevivedCandidate<Node>();
  testRevivedCandidate<Leaf>();
  testDisplacedEntryIsStillFound<Node>();
  testDisplacedEntryIsStillFound<Leaf>();
  testCyclesAreStillCollected<Node>();
  testCyclesAreStillCollected<Leaf>();
  testDestroyDuringCollection();
  testDeathInsideDestructorOfCollection();
  quiet();
  assert(Node::live == 0 && Leaf::live == 0);
  assert(gea::detail::allocationProfile().forgottenCandidates >= 6);
  return 0;
}
