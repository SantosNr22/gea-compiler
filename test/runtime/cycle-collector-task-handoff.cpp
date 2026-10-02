// Embedded startup and the event loop run on different OS tasks, but never
// mutate the Gea heap concurrently. Their candidate lists and allocation pools
// must belong to the same logical mutator across that handoff.
#define GEA_RUNTIME_SINGLE_THREADED 1
#include "gea_runtime.h"
#include <cassert>
#include <thread>

struct Node {
  static inline int live = 0;
  gea::Ref<Node> next;
  Node() { ++live; }
  ~Node() { --live; }
  friend void geaTraceRefs(const Node& node, gea::detail::RefVisitor& visitor) {
    gea::detail::traceRefs(node.next, visitor);
  }
};

int main() {
  gea::Ref<Node> app;
  std::thread bootstrap([&] {
    app = gea::makeRef<Node>();
    auto child = gea::makeRef<Node>();
    app->next = child;
    child->next = app;
    { auto temporary = app; }
  });
  bootstrap.join();
  std::thread runtime([&] {
    std::vector<gea::Ref<Node>> callbacks;
    for (int index = 0; index < 8; ++index) {
      auto callback = gea::makeRef<Node>();
      callback->next = app;
      callbacks.push_back(callback);
    }
    gea::collectCycles();
    assert(Node::live == 10);
    callbacks.clear();
    app = nullptr;
    gea::collectCycles();
    assert(Node::live == 0);
  });
  runtime.join();
}
