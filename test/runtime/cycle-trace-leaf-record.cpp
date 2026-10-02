// An emitted record the compiler proved acyclic and leaf-only carries
// `gea_traceLeaf` (`records.ts`'s `traceLeafStructsOf`), and a `Ref` to it is
// then a leaf of the cycle collector: its count dipping buffers no candidate,
// and a holder of only such refs is a leaf in turn.
//
// Everything that is not provably a leaf must stay traced: a self-referential
// record (no marker), and a record that is marked but whose physical fields
// still reach a traced edge (the runtime checks the claim). Cyclic garbage that
// merely HOLDS leaf records must still be collected, and the leaves with it.
#include "gea_runtime.h"
#include <cassert>

struct Leaf {
  static inline int live = 0;
  double value = 0;
  std::string name;
  static constexpr bool gea_traceLeaf = true;
  Leaf() { ++live; }
  ~Leaf() { --live; }
  friend auto geaTraceRefs(const Leaf&, gea::detail::RefVisitor&) -> std::false_type { return {}; }
};

struct Mid {
  static inline int live = 0;
  gea::Ref<Leaf> leaf;
  gea::Ref<gea::ArrayObject<gea::Ref<Leaf>>> leaves;
  static constexpr bool gea_traceLeaf = true;
  Mid() { ++live; }
  ~Mid() { --live; }
  friend auto geaTraceRefs(const Mid& value, gea::detail::RefVisitor& visitor)
      -> std::bool_constant<gea::detail::TraceEdges<gea::Ref<Leaf>>::supported ||
                            gea::detail::TraceEdges<gea::Ref<gea::ArrayObject<gea::Ref<Leaf>>>>::supported> {
    gea::detail::traceRefs(value.leaf, visitor);
    gea::detail::traceRefs(value.leaves, visitor);
    return {};
  }
};

// Self-referential: no marker, so it is traced.
struct Link {
  static inline int live = 0;
  gea::Ref<Link> next;
  Link() { ++live; }
  ~Link() { --live; }
  friend auto geaTraceRefs(const Link& value, gea::detail::RefVisitor& visitor) -> std::bool_constant<true> {
    gea::detail::traceRefs(value.next, visitor);
    return {};
  }
};

// Marked, but its fields still reach a traced edge: the claim is not honored.
struct Liar {
  gea::Ref<Link> link;
  static constexpr bool gea_traceLeaf = true;
  friend auto geaTraceRefs(const Liar& value, gea::detail::RefVisitor& visitor) -> std::bool_constant<gea::detail::TraceEdges<gea::Ref<Link>>::supported> {
    gea::detail::traceRefs(value.link, visitor);
    return {};
  }
};

// A cycle-capable holder of a leaf record.
struct Node {
  static inline int live = 0;
  gea::Ref<Node> peer;
  gea::Ref<Mid> payload;
  Node() { ++live; }
  ~Node() { --live; }
  friend auto geaTraceRefs(const Node& value, gea::detail::RefVisitor& visitor) -> std::bool_constant<true> {
    gea::detail::traceRefs(value.peer, visitor);
    gea::detail::traceRefs(value.payload, visitor);
    return {};
  }
};

static_assert(gea::detail::RefTargetIsLeaf<Leaf>::value);
static_assert(!gea::detail::TraceEdges<gea::Ref<Leaf>>::supported);
static_assert(gea::detail::RefTargetIsLeaf<Mid>::value);
static_assert(!gea::detail::TraceEdges<gea::Ref<Mid>>::supported);
static_assert(!gea::detail::TraceEdges<Mid>::supported);
static_assert(!gea::detail::RefTargetIsLeaf<Link>::value);
static_assert(gea::detail::TraceEdges<gea::Ref<Link>>::supported);
static_assert(!gea::detail::RefTargetIsLeaf<Liar>::value);
static_assert(gea::detail::TraceEdges<gea::Ref<Liar>>::supported);
static_assert(gea::detail::TraceEdges<gea::Ref<Node>>::supported);

static gea::Ref<Mid> makeMid() {
  auto mid = gea::makeRef<Mid>();
  mid->leaf = gea::makeRef<Leaf>();
  mid->leaves = gea::makeRef<gea::ArrayObject<gea::Ref<Leaf>>>();
  return mid;
}

static void testLeafDipBuffersNothing() {
  auto& state = gea::detail::cycleState();
  const auto before = gea::detail::bufferedDipCount(state);
  {
    auto mid = makeMid();
    {
      auto again = mid;
      auto leaf = mid->leaf;
    }  // both dips are on leaf targets
    assert(gea::detail::bufferedDipCount(state) == before);
  }
  assert(Mid::live == 0 && Leaf::live == 0);
  assert(gea::detail::bufferedDipCount(state) == before);
}

static void testTracedHolderStillBuffers() {
  auto& state = gea::detail::cycleState();
  const auto before = gea::detail::bufferedDipCount(state);
  auto head = gea::makeRef<Link>();
  head->next = gea::makeRef<Link>();
  {
    auto again = head->next;
  }  // a dip on a traced target
  assert(gea::detail::bufferedDipCount(state) == before + 1);
  head = {};
  assert(Link::live == 0);
}

static void testCyclicGarbageHoldingLeavesIsCollected() {
  auto a = gea::makeRef<Node>();
  auto b = gea::makeRef<Node>();
  a->peer = b;
  b->peer = a;
  a->payload = makeMid();
  b->payload = a->payload;
  assert(Node::live == 2 && Mid::live == 1 && Leaf::live == 1);
  a = {};
  b = {};
  assert(Node::live == 2);
  gea::detail::collectReferenceCycles(/*full=*/true);
  assert(Node::live == 0);
  assert(Mid::live == 0);
  assert(Leaf::live == 0);
}

static void testSelfReferentialRecordIsStillCollected() {
  auto head = gea::makeRef<Link>();
  auto tail = gea::makeRef<Link>();
  head->next = tail;
  tail->next = head;
  head = {};
  tail = {};
  assert(Link::live == 2);
  gea::detail::collectReferenceCycles(/*full=*/true);
  assert(Link::live == 0);
}

static void testLeafHeldByLiveCycleSurvivesCollection() {
  auto a = gea::makeRef<Node>();
  auto b = gea::makeRef<Node>();
  a->peer = b;
  b->peer = a;
  a->payload = makeMid();
  auto kept = a->payload;
  a = {};
  b = {};
  gea::detail::collectReferenceCycles(/*full=*/true);
  assert(Node::live == 0);
  assert(Mid::live == 1 && Leaf::live == 1);  // the outside handle keeps them
  kept = {};
  assert(Mid::live == 0 && Leaf::live == 0);
}

int main() {
  testLeafDipBuffersNothing();
  testTracedHolderStillBuffers();
  testCyclicGarbageHoldingLeavesIsCollected();
  testSelfReferentialRecordIsStillCollected();
  testLeafHeldByLiveCycleSurvivesCollection();
  return Node::live + Mid::live + Leaf::live + Link::live == 0 ? 0 : 1;
}
