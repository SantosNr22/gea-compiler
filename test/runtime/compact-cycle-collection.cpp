// Compact mode must preserve ownership, weak observers, exception recovery and
// automatic safepoints even though it omits generation and self-loop probes.
#define GEA_RUNTIME_COMPACT_CODE 1
#define main allocationCycleSafepointTests
#include "allocation-cycle-safepoint.cpp"
#undef main

int main() {
  if (allocationCycleSafepointTests() != 0) return 1;
  static_assert(!gea::detail::cycleGenerational);
  static_assert(gea::detail::TraceEdges<Node>::supported);
  assert(gea::detail::RefOperationsFor<Node>::table.holdsTracedEdge == nullptr);
  auto node = gea::makeRef<Node>();
  node->next = node;
  gea::WeakRef<Node> observer(node);
  gea::detail::collectReferenceCycles(false);
  assert(!observer.expired() && Node::live == 1);
  node = nullptr;
  gea::detail::collectReferenceCycles(false);
  assert(observer.expired() && Node::live == 0);
  assert(gea::detail::cycleState().deferred.empty());
  return 0;
}
