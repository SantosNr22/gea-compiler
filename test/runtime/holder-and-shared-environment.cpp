// Two compiler-made cycles, and the runtime forms that remove them.
//
// (a) A method installed on its own holder (`CallableObject::bindHolder`)
//     binds the holder weakly: the holder dies on its last release, with no
//     cycle collection, even though its own member holds a handle to it. The
//     weak handle dies inside the holder's destructor, which is exactly the
//     case `Ref::releaseLast`'s weak pin exists for -- unpinned, the block
//     would be freed twice (ASan reports it). A member copied out and called
//     after its holder died raises instead of answering a dead object.
// (b) A recursion group's shared environment (`gea::shareEnvironment`): two
//     members over one block, each with its own identity slot, rebuilt from
//     inside a member with the same identity, and the block freed on the last
//     release of any member -- no cell holds a member, so nothing cycles.
#include "gea_runtime.h"
#include <cassert>

struct Holder {
  gea::CallableObject<int()> method;
  int value = 0;
  friend void geaTraceRefs(const Holder& holder, gea::detail::RefVisitor& visitor) { gea::detail::traceRefs(holder.method, visitor); }
};

static int readValue(void*, gea::Ref<Holder> self) { return self->value; }

static void holderBindingIsWeak() {
  auto& holders = gea::detail::allocationTypeProfile<Holder>();
  const auto destroyedBefore = holders.destroyed;
  gea::CallableObject<int()> escaped;
  {
    gea::Ref<Holder> holder = gea::makeRef<Holder>();
    holder->value = 42;
    const gea::CallableObject<int(gea::Ref<Holder>)> source{&readValue, nullptr};
    holder->method = gea::CallableObject<int()>::bindHolder(source, holder);
    assert(holder->method.call() == 42);
    escaped = holder->method;
  }
  // Freed by the release above, not by a collection: nothing else held it.
  assert(holders.destroyed == destroyedBefore + 1);
  bool raised = false;
  try {
    (void)escaped.call();
  } catch (...) {
    raised = true;
  }
  assert(raised);
}

struct Group {
  double base;
  double scale;
  gea::SharedEnvironmentAnchor gea_anchor;
  gea::EnvironmentIdentityHeader gea_identity_0;
  gea::EnvironmentIdentityHeader gea_identity_1;
  friend void geaTraceRefs(const Group& group, gea::detail::RefVisitor& visitor) {
    gea::detail::traceRefs(group.gea_identity_0.identity, visitor);
    gea::detail::traceRefs(group.gea_identity_1.identity, visitor);
  }
};

using Unary = gea::CallableObject<double(double)>;
static double second(void* environment, double x);
// The first member names the second by rebuilding it from its own environment.
static double first(void* environment, double x) {
  auto* group = static_cast<Group*>(environment);
  if (x <= 0) return group->base;
  Unary sibling{&second, gea::sharedEnvironmentMember(group, &Group::gea_identity_1)};
  return sibling.call(x - 1);
}
static double second(void* environment, double x) {
  auto* group = static_cast<Group*>(environment);
  Unary sibling{&first, gea::sharedEnvironmentMember(group, &Group::gea_identity_0)};
  return group->scale * sibling.call(x - 1);
}

static void sharedEnvironmentMembers() {
  using Block = gea::HeapEnvironmentBlock<Group>;
  auto& blocks = gea::detail::allocationTypeProfile<Block>();
  const auto createdBefore = blocks.created;
  const auto destroyedBefore = blocks.destroyed;
  {
    auto shared = gea::shareEnvironment(Group{1.0, 3.0, {}, {}, {}});
    Unary a{&first, gea::sharedEnvironmentMember(shared, &Group::gea_identity_0)};
    Unary b{&second, gea::sharedEnvironmentMember(shared, &Group::gea_identity_1)};
    assert(blocks.created == createdBefore + 1);
    // first(4) = second(3) = 3 * first(2) = 3 * second(1) = 9 * first(0) = 9
    assert(a.call(4) == 9.0);
    assert(b.call(1) == 3.0);
    // Distinct function objects, each stable across rebuilds.
    Unary aAgain{&first, gea::sharedEnvironmentMember(&shared.block->captured, &Group::gea_identity_0)};
    assert(a == aAgain);
    assert(!(a == b));
    shared = {};
    Unary kept = b;
    a = {};
    b = {};
    aAgain = {};
    assert(blocks.destroyed == destroyedBefore);
    assert(kept.call(1) == 3.0);
  }
  assert(blocks.destroyed == destroyedBefore + 1);
}

// (c) The in-place forms: a known capture-free function bound to its holder, and
//     an adapter over a known source, allocate nothing of their own. The holder
//     owns itself through the bound member -- a self edge -- and dies at the
//     candidate filter after its last outside release, with no collection.
static int readValueKnown(void*, gea::Ref<Holder> self) { return self->value; }
static double widenedCall(void*, double x) { return x + 1; }

static void inPlaceFormsAllocateNothing() {
  auto& holders = gea::detail::allocationTypeProfile<Holder>();
  const auto holdersDestroyed = holders.destroyed;
  const auto collectionsBefore = gea::detail::allocationProfile().collections;
  {
    gea::Ref<Holder> holder = gea::makeRef<Holder>();
    holder->value = 7;
    const gea::CallableObject<int(gea::Ref<Holder>)> source{&readValueKnown, nullptr};
    const auto createdBefore = gea::detail::allocationProfile().created;
    holder->method = gea::CallableObject<int()>::bindHolderInPlace<&readValueKnown>(source, holder);
    // The holder is the bound member's environment: no wrapper cell.
    assert(gea::detail::allocationProfile().created == createdBefore);
    assert(holder->method.call() == 7);
  }
  // The candidate filter that follows the release finds only self edges left.
  gea::detail::filterBufferedCandidates(gea::detail::cycleState());
  assert(holders.destroyed == holdersDestroyed + 1);
  assert(gea::detail::allocationProfile().collections == collectionsBefore);

  const gea::CallableObject<double(double)> source{&widenedCall, nullptr};
  const auto createdBefore = gea::detail::allocationProfile().created;
  const auto adapted = gea::CallableObject<double(void*, double)>::adaptSourceInPlace<&widenedCall>(
      source, +[](void* environment, void*, double x) -> double { return widenedCall(environment, x) * 2; });
  assert(gea::detail::allocationProfile().created == createdBefore);
  assert(adapted.call(nullptr, 2.0) == 6.0);
}

int main() {
  holderBindingIsWeak();
  inPlaceFormsAllocateNothing();
  sharedEnvironmentMembers();
  return 0;
}
