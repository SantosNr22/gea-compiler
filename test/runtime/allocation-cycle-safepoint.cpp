#include "gea_runtime.h"
#include <array>
#include <cassert>

struct Echo;
struct Node {
  static inline int live = 0;
  gea::Ref<Node> next;
  gea::Ref<Echo> echo;
  int value = 42;
  Node() { ++live; }
  ~Node() { --live; }
  friend void geaTraceRefs(const Node& node, gea::detail::RefVisitor& visitor);
};
// The other half of a garbage cycle. A self-loop is reclaimed at the release
// that leaves only its own edges and never reaches the collector these tests
// drive, so each fixture cycle runs through one of these instead -- outside
// `Node::live`, so every count below still counts only nodes.
struct Echo {
  gea::Ref<Node> back;
  friend void geaTraceRefs(const Echo& echo, gea::detail::RefVisitor& visitor) { gea::detail::traceRefs(echo.back, visitor); }
};
void geaTraceRefs(const Node& node, gea::detail::RefVisitor& visitor) {
  gea::detail::traceRefs(node.next, visitor);
  gea::detail::traceRefs(node.echo, visitor);
}
static void cycle(const gea::Ref<Node>& node) {
  node->echo = gea::makeRef<Echo>();
  node->echo->back = node;
}

struct Holder {
  gea::Ref<Node> node;
  explicit Holder(gea::Ref<Node> node_) : node(std::move(node_)) {
    // A nested allocation must not collect the argument moved into this
    // not-yet-published object. Its strong count is still an external root.
    for (int i = 0; i < 128; ++i) {
      auto nested = gea::makeRef<Node>();
      cycle(nested);
      assert(node->value == 42);
    }
  }
  friend void geaTraceRefs(const Holder& holder, gea::detail::RefVisitor& visitor) {
    gea::detail::traceRefs(holder.node, visitor);
  }
};

struct Terminal {
  static inline int live = 0;
  Terminal() { ++live; }
  ~Terminal() { --live; }
  friend std::false_type geaTraceRefs(const Terminal&, gea::detail::RefVisitor&) { return {}; }
};
static_assert(!gea::detail::TraceEdges<Terminal>::supported);
static_assert(gea::detail::TraceEdges<Node>::supported);

struct FanNode {
  static inline int live = 0;
  static inline bool failTrace = false;
  static inline int traceBudget = -1;
  std::array<gea::Ref<FanNode>, 3> edges;
  gea::Ref<Terminal> terminal;
  FanNode() { ++live; }
  ~FanNode() { --live; }
  friend void geaTraceRefs(const FanNode& node, gea::detail::RefVisitor& visitor) {
    if (failTrace) throw std::bad_alloc();
    if (traceBudget == 0) throw std::bad_alloc();
    if (traceBudget > 0) --traceBudget;
    for (const auto& edge : node.edges) gea::detail::traceRefs(edge, visitor);
    gea::detail::traceRefs(node.terminal, visitor);
  }
};

static void testReusableCycleGraph() {
  // Repeatedly grow, clear and reuse the identity table and adjacency storage.
  // Duplicate edges must count twice, while one external root keeps the entire
  // ring alive. A failed discovery must preserve pins for the next collection.
  for (const int count : {12000, 1000, 7, 16000}) {
    gea::Ref<FanNode> root;
    gea::Ref<Terminal> retainedTerminal;
    {
      gea::CycleCollectionDeferral deferred;
      std::vector<gea::Ref<FanNode>> nodes;
      for (int i = 0; i < count; ++i) nodes.push_back(gea::makeRef<FanNode>());
      for (int i = 0; i < count; ++i) {
        nodes[i]->terminal = gea::makeRef<Terminal>();
        nodes[i]->edges[0] = nodes[(i + 1) % count];
        nodes[i]->edges[1] = nodes[(i + 1) % count];
        nodes[i]->edges[2] = nodes[(i + 5) % count];
      }
      root = nodes[0];
      if (count == 7) retainedTerminal = nodes[0]->terminal;
    }
    FanNode::failTrace = true;
    try {
      gea::collectCycles();
      assert(false);
    } catch (const std::bad_alloc&) {}
    assert(!gea::detail::cycleState().collecting && FanNode::live == count);
    FanNode::failTrace = false;
    // Discovery temporarily indexes weak-count words. Preserve multiple weak
    // observers and restore every visited word when a later tracer fails.
    gea::WeakRef<FanNode> firstObserver(root), secondObserver(root);
    const auto weakCount = gea::detail::refCountsOf(root.get())->weak;
    FanNode::traceBudget = count / 2;
    try {
      gea::collectCycles();
      assert(false);
    } catch (const std::bad_alloc&) {}
    assert(gea::detail::refCountsOf(root.get())->weak == weakCount);
    assert(!firstObserver.expired() && !secondObserver.expired());
    FanNode::traceBudget = -1;
    gea::collectCycles();
    // A successful collection also marks every surviving node `cycleMature`
    // (see `collectReferenceCycles`'s generational trial deletion): the only
    // bit this full pass adds to a live root beyond clearing `cycleBuffered`.
    const auto generation = gea::detail::cycleGenerational ? gea::detail::cycleMature : 0;
    assert(gea::detail::refCountsOf(root.get())->weak == ((weakCount & ~gea::detail::cycleBuffered) | generation));
    assert(FanNode::live == count && Terminal::live == count);
    gea::WeakRef<FanNode> weak(root);
    root = nullptr;
    gea::collectCycles();
    assert(FanNode::live == 0 && Terminal::live == (retainedTerminal ? 1 : 0) && weak.expired());
    assert(firstObserver.expired() && secondObserver.expired());
    gea::WeakRef<Terminal> weakTerminal(retainedTerminal);
    retainedTerminal = nullptr;
    assert(Terminal::live == 0 && weakTerminal.expired());
  }
}

static void testAutomaticCollectionPolicy() {
  using namespace std::chrono;
  auto& state = gea::detail::cycleState();
  gea::configureAutomaticCycleCollection(hours(1), 1024 * 1024, 4096);
  auto root = gea::makeRef<Node>();
  cycle(root);
  gea::WeakRef<Node> weak(root);
  const auto collections = state.collections;
  for (int frame = 0; frame < 100; ++frame) {
    { auto temporary = root; }
    gea::collectCyclesIfNeeded();
  }
  assert(state.collections == collections && Node::live == 1);
  root = nullptr;
  gea::collectCyclesIfNeeded();
  assert(!weak.expired());
  state.lastCollection -= hours(1);
  gea::collectCyclesIfNeeded();
  assert(weak.expired() && Node::live == 0);

  gea::configureAutomaticCycleCollection(hours(1), 256, 4096);
  {
    gea::CycleCollectionDeferral deferred;
    for (int i = 0; i < 64; ++i) {
      auto node = gea::makeRef<Node>();
      cycle(node);
    }
    gea::collectCyclesIfNeeded();
    assert(Node::live == 64);
  }
  gea::collectCyclesIfNeeded();
  assert(Node::live == 0 && state.allocationPressure == 0);

  gea::configureAutomaticCycleCollection(hours(1), 1024 * 1024, 3);
  for (int i = 0; i < 3; ++i) {
    auto node = gea::makeRef<Node>();
    cycle(node);
  }
  gea::collectCyclesIfNeeded();
  assert(Node::live == 0);
  {
    auto node = gea::makeRef<Node>();
    { auto temporary = node; }
    gea::WeakRef<Node> observer(node);
    node = nullptr;
    assert(Node::live == 0 && observer.expired());
  }
  root = gea::makeRef<Node>();
  cycle(root);
  root = nullptr;
  gea::collectCycles();
  assert(Node::live == 0);
  gea::configureAutomaticCycleCollection(milliseconds(0), 0, 64);
}

static void testAdaptiveCollectionPolicy() {
  using namespace std::chrono;
  auto& state = gea::detail::cycleState();
  gea::configureAutomaticCycleCollection(milliseconds(100), 4096, 4096, milliseconds(800));
  auto root = gea::makeRef<Node>();
  cycle(root);
  for (int i = 0; i < 5; ++i) {
    { auto alias = root; }
    state.lastCollection -= seconds(1);
    gea::collectCyclesIfNeeded();
    assert(state.currentInterval == milliseconds(std::min(800, 200 << i)));
  }
  const auto before = state.collections;
  { auto alias = root; }
  gea::collectCyclesIfNeeded();
  assert(state.collections == before);
  // Pressure bypasses the longest backoff, and real garbage resets it.
  root = nullptr;
  state.allocationPressure = 4096;
  gea::collectCyclesIfNeeded();
  assert(Node::live == 0 && state.collections == before + 1);
  assert(state.currentInterval == milliseconds(100));
  gea::configureAutomaticCycleCollection(milliseconds(0), 0, 64);
}

int main() {
  testAutomaticCollectionPolicy();
  testAdaptiveCollectionPolicy();
  testReusableCycleGraph();
  {
    using Payload = std::vector<gea::Ref<Node>>;
    auto value = gea::Value::box(gea::Value::Tag::Object, Payload{gea::makeRef<Node>()});
    gea::collectCycles();
    const auto queued = gea::detail::cycleState().candidates.size();
    const auto cached = gea::detail::dipCache().count;
    const auto* address = &value.as<Payload>();
    for (int i = 0; i < 1000; ++i) {
      assert(&value.as<Payload>() == address);
      assert(value.as<Payload>()[0]->value == 42);
    }
    assert(gea::detail::cycleState().candidates.size() == queued && gea::detail::dipCache().count == cached);
  }
  gea::collectCycles();
  assert(Node::live == 0);
  auto rooted = gea::makeRef<Node>();
  cycle(rooted);
  gea::WeakRef<Node> weakRoot(rooted);
  {
    gea::CycleCollectionDeferral outer;
    for (int i = 0; i < 80; ++i) {
      auto garbage = gea::makeRef<Node>();
      cycle(garbage);
    }
    // A dip waits in the dip cache; the threshold counts it there, and a
    // safepoint (deferred here) is what moves it to the buffer.
    assert(gea::detail::bufferedDipCount(gea::detail::cycleState()) >= 64 && Node::live >= 81);
    gea::detail::flushDipCache(gea::detail::cycleState());
    const auto queued = gea::detail::cycleState().candidates.size();
    assert(queued >= 64);
    {
      gea::CycleCollectionDeferral inner;
      for (int i = 0; i < 80; ++i) {
        auto garbage = gea::makeRef<Node>();
        cycle(garbage);
      }
      gea::collectCyclesIfNeeded();
      gea::detail::flushDipCache(gea::detail::cycleState());
      assert(gea::detail::cycleState().candidates.size() > queued);
      assert(Node::live >= 161 && !weakRoot.expired());
    }
    gea::collectCyclesIfNeeded();
    assert(Node::live >= 161 && !weakRoot.expired());
  }
  assert(gea::detail::cycleState().deferDepth == 0);
  gea::collectCyclesIfNeeded();
  assert(Node::live == 1 && !weakRoot.expired());

  {
    gea::CycleCollectionDeferral deferred;
    for (int i = 0; i < 80; ++i) {
      auto garbage = gea::makeRef<Node>();
      cycle(garbage);
    }
    // An explicit collection is a deliberate escape hatch even while pressure
    // safepoints are deferred.
    gea::collectCycles();
    assert(Node::live == 1 && !weakRoot.expired());
  }

  try {
    gea::CycleCollectionDeferral outer;
    gea::CycleCollectionDeferral inner;
    for (int i = 0; i < 80; ++i) {
      auto garbage = gea::makeRef<Node>();
      cycle(garbage);
    }
    throw 1;
  } catch (int) {
  }
  assert(gea::detail::cycleState().deferDepth == 0);
  gea::collectCyclesIfNeeded();
  assert(Node::live == 1 && !weakRoot.expired());

  for (int i = 0; i < 10000; ++i) {
    auto garbage = gea::makeRef<Node>();
    cycle(garbage);
    assert(rooted->value == 42 && !weakRoot.expired());
    // Pressure must be bounded even with no generated function call.
    assert(Node::live < 70);
  }
  auto holder = gea::makeRef<Holder>(std::move(rooted));
  assert(!rooted && holder->node->value == 42 && !weakRoot.expired());
  holder = nullptr;
  gea::collectCycles();
  assert(weakRoot.expired() && Node::live == 0);
  return 0;
}
