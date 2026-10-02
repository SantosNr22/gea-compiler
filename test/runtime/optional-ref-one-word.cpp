// `gea::Optional<gea::Ref<T>>` is one word: "absent" is the address 1 in the
// handle itself, distinct from a present NULL handle (`T | null | undefined`)
// and from every object. The three states must stay three through copy, move,
// assignment, destruction and the cycle collector, and the sentinel must never
// reach a `Ref` operation (retain/release/trace would dereference it).
#include "gea_runtime.h"
#include <cassert>

struct Node {
  static inline int live = 0;
  gea::Optional<gea::Ref<Node>> next;
  Node() { ++live; }
  ~Node() { --live; }
  friend void geaTraceRefs(const Node& value, gea::detail::RefVisitor& visitor) { gea::detail::traceRefs(value.next, visitor); }
};

struct Leaf {
  static inline int live = 0;
  Leaf() { ++live; }
  ~Leaf() { --live; }
};

using Opt = gea::Optional<gea::Ref<Leaf>>;

static_assert(sizeof(Opt) == sizeof(void*));
static_assert(sizeof(gea::Optional<gea::Ref<Node>>) == sizeof(void*));
static_assert(gea::detail::TraceEdges<gea::Optional<gea::Ref<Node>>>::supported);

static void testThreeStates() {
  Opt absent;
  Opt presentNull = gea::Ref<Leaf>();
  Opt viaNullptr = nullptr;
  auto leaf = gea::makeRef<Leaf>();
  Opt present = leaf;
  assert(!absent.has_value());
  assert(presentNull.has_value() && !*presentNull);
  assert(viaNullptr.has_value() && !*viaNullptr);
  assert(present.has_value() && present->get() == leaf.get());
  // A const read of an absent value is a null handle, and does not make it present.
  const Opt& constAbsent = absent;
  assert(!*constAbsent);
  // A non-const read of an absent value must not flip it to present either.
  assert(!*absent);
  assert(!absent.has_value());
  assert(!absent->get());
  assert(!absent.has_value());
}

static void testCopyMoveAssign() {
  Leaf::live = 0;
  {
    auto leaf = gea::makeRef<Leaf>();
    Opt present = leaf;
    Opt absent;
    Opt presentNull = nullptr;
    Opt copyOfPresent = present;
    Opt copyOfAbsent = absent;
    Opt copyOfNull = presentNull;
    assert(copyOfPresent.has_value() && copyOfPresent->get() == leaf.get());
    assert(!copyOfAbsent.has_value());
    assert(copyOfNull.has_value() && !*copyOfNull);
    Opt moved = std::move(copyOfPresent);
    assert(moved.has_value() && moved->get() == leaf.get());
    assert(copyOfPresent.has_value() && !*copyOfPresent);  // moved-from: present, null
    Opt target;
    target = present;
    assert(target.has_value() && target->get() == leaf.get());
    target = absent;
    assert(!target.has_value());
    target = presentNull;
    assert(target.has_value() && !*target);
    target = leaf;
    target = target;  // self-assignment
    assert(target.has_value() && target->get() == leaf.get());
    target = *target;  // assignment from its own payload
    assert(target.has_value() && target->get() == leaf.get());
    target = nullptr;
    assert(target.has_value() && !*target);
    target = Opt();
    assert(!target.has_value());
    assert(Leaf::live == 1);
  }
  assert(Leaf::live == 0);
}

static void testReleaseOnOverwriteAndDestroy() {
  Leaf::live = 0;
  {
    Opt slot = gea::makeRef<Leaf>();
    assert(Leaf::live == 1);
    slot = gea::makeRef<Leaf>();
    assert(Leaf::live == 1);
    slot = Opt();
    assert(Leaf::live == 0);
    slot = gea::makeRef<Leaf>();
    assert(Leaf::live == 1);
  }
  assert(Leaf::live == 0);
}

static void testCycleThroughAnOptionalRef() {
  Node::live = 0;
  auto first = gea::makeRef<Node>();
  auto second = gea::makeRef<Node>();
  first->next = second;
  second->next = first;
  gea::WeakRef<Node> observer(first);
  first = nullptr;
  second = nullptr;
  gea::detail::collectReferenceCycles(false);
  assert(observer.expired() && Node::live == 0);
  // An absent link is not traced (the sentinel is not an object).
  auto lone = gea::makeRef<Node>();
  auto tail = gea::makeRef<Node>();
  lone->next = tail;
  assert(!tail->next.has_value());
  gea::detail::collectReferenceCycles(false);
  assert(Node::live == 2);
  lone = nullptr;
  tail = nullptr;
  gea::detail::collectReferenceCycles(false);
  assert(Node::live == 0);
  // A self-loop through a present link is reclaimed.
  auto self = gea::makeRef<Node>();
  self->next = self;
  self = nullptr;
  gea::detail::collectReferenceCycles(false);
  assert(Node::live == 0);
}

static void testContainers() {
  Leaf::live = 0;
  {
    std::vector<Opt> many(5);
    for (const Opt& element : many) assert(!element.has_value());
    many[2] = gea::makeRef<Leaf>();
    many[3] = nullptr;
    std::vector<Opt> copy = many;
    many.clear();
    assert(Leaf::live == 1);
    assert(!copy[0].has_value() && copy[2].has_value() && copy[3].has_value() && !*copy[3]);
  }
  assert(Leaf::live == 0);
}

int main() {
  testThreeStates();
  testCopyMoveAssign();
  testReleaseOnOverwriteAndDestroy();
  testCycleThroughAnOptionalRef();
  testContainers();
  return 0;
}
