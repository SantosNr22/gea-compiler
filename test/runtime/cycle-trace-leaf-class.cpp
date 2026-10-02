// An emitted class carries `gea_traceLeaf` only when `records.ts`'s
// `leafEligibleClassesOf` proved it: nothing derives from it, its fields reach
// only leaves, and its method state is one the collector can do without. These
// structs have the shape that emission produces, and the test pins what the
// runtime does with them:
//   - a leaf class is no candidate when a handle to it dips, and a cyclic
//     holder of it is still collected, the leaf with it;
//   - a base class (no marker) stays traced, so a cycle through a handle typed
//     at the base but holding a subclass with edges is still collected;
//   - a class that is marked but whose physical storage still reaches a traced
//     edge (a per-instance method state the emitter did not exempt) is not a
//     leaf: the runtime checks the claim;
//   - a class on a type cycle carries no marker and its garbage is collected.
#include "gea_runtime.h"
#include <cassert>

// A root nothing derives from: its method state is a static member, traced by nobody.
struct LeafClass final {
  static inline int live = 0;
  static inline gea::Ref<gea::NativeClassMethodState> gea_method_state;
  double id = 0;
  std::string name;
  gea::Ref<gea::ArrayObject<std::string>> tags;
  static constexpr bool gea_traceLeaf = true;
  LeafClass() { ++live; }
  ~LeafClass() { --live; }
  friend auto geaTraceRefs(const LeafClass& value, gea::detail::RefVisitor& visitor)
      -> std::bool_constant<gea::detail::TraceEdges<gea::Ref<gea::ArrayObject<std::string>>>::supported> {
    gea::detail::traceRefs(value.tags, visitor);
    return {};
  }
};

// A hierarchy the program evaluates once: the root's per-instance state handle is not traced.
struct Animal {
  static inline int live = 0;
  gea::Ref<gea::NativeClassMethodState> gea_method_state;
  std::string name;
  Animal() { ++live; }
  virtual ~Animal() { --live; }
  friend auto geaTraceRefs(const Animal& value, gea::detail::RefVisitor& visitor)
      -> std::bool_constant<false> {
    (void)value;
    (void)visitor;
    return {};
  }
};
struct Dog final : Animal {
  double legs = 4;
  static constexpr bool gea_traceLeaf = true;
  friend auto geaTraceRefs(const Dog& value, gea::detail::RefVisitor& visitor)
      -> std::bool_constant<gea::detail::TraceEdges<Animal>::supported> {
    gea::detail::traceRefs(static_cast<const Animal&>(value), visitor);
    return {};
  }
};

// A hierarchy whose state handle IS traced: the derived struct is marked, the claim is false.
struct Plant {
  gea::Ref<gea::NativeClassMethodState> gea_method_state;
  virtual ~Plant() = default;
  friend auto geaTraceRefs(const Plant& value, gea::detail::RefVisitor& visitor) -> std::bool_constant<true> {
    gea::detail::traceRefs(value.gea_method_state, visitor);
    return {};
  }
};
struct Fern final : Plant {
  double fronds = 3;
  static constexpr bool gea_traceLeaf = true;
  friend auto geaTraceRefs(const Fern& value, gea::detail::RefVisitor& visitor)
      -> std::bool_constant<gea::detail::TraceEdges<Plant>::supported> {
    gea::detail::traceRefs(static_cast<const Plant&>(value), visitor);
    return {};
  }
};

// A base with a subclass that has edges: a handle typed at the base must keep tracing.
struct Vehicle {
  static inline int live = 0;
  double wheels = 0;
  Vehicle() { ++live; }
  virtual ~Vehicle() { --live; }
  friend auto geaTraceRefs(const Vehicle&, gea::detail::RefVisitor&) -> std::false_type { return {}; }
};
struct Truck final : Vehicle {
  gea::Ref<Vehicle> trailer;
  friend auto geaTraceRefs(const Truck& value, gea::detail::RefVisitor& visitor) -> std::bool_constant<true> {
    gea::detail::traceRefs(value.trailer, visitor);
    return {};
  }
};

// A class on a type cycle: no marker.
struct Cell final {
  static inline int live = 0;
  gea::Ref<Cell> next;
  Cell() { ++live; }
  ~Cell() { --live; }
  friend auto geaTraceRefs(const Cell& value, gea::detail::RefVisitor& visitor) -> std::bool_constant<true> {
    gea::detail::traceRefs(value.next, visitor);
    return {};
  }
};

// A cycle-capable holder of a leaf class.
struct Holder final {
  static inline int live = 0;
  gea::Ref<Holder> peer;
  gea::Ref<LeafClass> payload;
  Holder() { ++live; }
  ~Holder() { --live; }
  friend auto geaTraceRefs(const Holder& value, gea::detail::RefVisitor& visitor) -> std::bool_constant<true> {
    gea::detail::traceRefs(value.peer, visitor);
    gea::detail::traceRefs(value.payload, visitor);
    return {};
  }
};

static_assert(gea::detail::RefTargetIsLeaf<LeafClass>::value);
static_assert(gea::detail::RefTargetIsLeaf<Dog>::value);
static_assert(!gea::detail::TraceEdges<gea::Ref<Dog>>::supported);
static_assert(!gea::detail::RefTargetIsLeaf<Animal>::value);
static_assert(gea::detail::TraceEdges<gea::Ref<Animal>>::supported);
static_assert(!gea::detail::RefTargetIsLeaf<Fern>::value);
static_assert(gea::detail::TraceEdges<gea::Ref<Fern>>::supported);
static_assert(!gea::detail::RefTargetIsLeaf<Vehicle>::value);
static_assert(gea::detail::TraceEdges<gea::Ref<Vehicle>>::supported);
static_assert(!gea::detail::RefTargetIsLeaf<Cell>::value);
static_assert(gea::detail::TraceEdges<gea::Ref<Cell>>::supported);
static_assert(gea::detail::TraceEdges<gea::Ref<Holder>>::supported);

static void testLeafClassDipBuffersNothing() {
  auto& state = gea::detail::cycleState();
  const auto before = gea::detail::bufferedDipCount(state);
  {
    auto leaf = gea::makeRef<LeafClass>();
    leaf->tags = gea::makeRef<gea::ArrayObject<std::string>>();
    {
      auto again = leaf;
      auto tags = leaf->tags;
    }
    assert(gea::detail::bufferedDipCount(state) == before);
    auto dog = gea::makeRef<Dog>();
    {
      auto again = dog;
    }
    assert(gea::detail::bufferedDipCount(state) == before);
  }
  assert(LeafClass::live == 0 && Animal::live == 0);
}

static void testCyclicHolderOfLeafClassIsCollected() {
  auto a = gea::makeRef<Holder>();
  auto b = gea::makeRef<Holder>();
  a->peer = b;
  b->peer = a;
  a->payload = gea::makeRef<LeafClass>();
  b->payload = a->payload;
  assert(Holder::live == 2 && LeafClass::live == 1);
  a = {};
  b = {};
  gea::detail::collectReferenceCycles(/*full=*/true);
  assert(Holder::live == 0);
  assert(LeafClass::live == 0);
}

static void testLeafHeldByLiveCycleSurvives() {
  auto a = gea::makeRef<Holder>();
  auto b = gea::makeRef<Holder>();
  a->peer = b;
  b->peer = a;
  a->payload = gea::makeRef<LeafClass>();
  auto kept = a->payload;
  a = {};
  b = {};
  gea::detail::collectReferenceCycles(/*full=*/true);
  assert(Holder::live == 0);
  assert(LeafClass::live == 1);
  kept = {};
  assert(LeafClass::live == 0);
}

static void testBaseTypedHandleHoldingSubclassWithEdgesStillCollected() {
  // truck -> trailer (a Truck, typed at the base) -> trailer back to the first truck.
  auto first = gea::makeRef<Truck>();
  auto second = gea::makeRef<Truck>();
  first->trailer = gea::Ref<Vehicle>(second);
  second->trailer = gea::Ref<Vehicle>(first);
  assert(Vehicle::live == 2);
  first = {};
  second = {};
  gea::detail::collectReferenceCycles(/*full=*/true);
  assert(Vehicle::live == 0);
}

static void testTypeCycleIsStillCollected() {
  auto head = gea::makeRef<Cell>();
  auto tail = gea::makeRef<Cell>();
  head->next = tail;
  tail->next = head;
  head = {};
  tail = {};
  assert(Cell::live == 2);
  gea::detail::collectReferenceCycles(/*full=*/true);
  assert(Cell::live == 0);
}

int main() {
  testLeafClassDipBuffersNothing();
  testCyclicHolderOfLeafClassIsCollected();
  testLeafHeldByLiveCycleSurvives();
  testBaseTypedHandleHoldingSubclassWithEdgesStillCollected();
  testTypeCycleIsStillCollected();
  return Holder::live + LeafClass::live + Animal::live + Vehicle::live + Cell::live == 0 ? 0 : 1;
}
