#include "gea_runtime.h"
#include <cassert>
#include <thread>
#include <atomic>

struct CounterTag {};
struct RootTag {};
struct CycleTag {};
struct CycleNode {
  static inline std::atomic<int> live{0};
  gea::Ref<CycleNode> next;
  CycleNode() { ++live; }
  ~CycleNode() { --live; }
  friend void geaTraceRefs(const CycleNode& node, gea::detail::RefVisitor& visitor) {
    gea::detail::traceRefs(node.next, visitor);
  }
};

int main() {
  using namespace gea::detail;
  auto& root = realmSlot<RootTag, int>();
  root = 41;
  int rootJobs = 0;
  queuePromiseJob([&] { ++rootJobs; });
  std::thread rootHandoff([&] {
    assert((&realmSlot<RootTag, int>() == &root));
    assert((realmSlot<RootTag, int>() == 41));
    drainPromiseJobs();
  });
  rootHandoff.join();
  assert(rootJobs == 1);

  std::atomic<int> ready{0};
  auto run = [&](int number) {
    RuntimeRealm realm;
    {
      RuntimeRealmScope scope(realm);
      assert((&realmSlot<RootTag, int>() != &root));
      assert((realmSlot<CounterTag, int>() == 0));
      realmSlot<CounterTag, int>() = number;
      auto global = gea::runtime::globalThis();

      auto ownSymbol = gea::symbolFor("worker");
      assert(ownSymbol.id() >= static_cast<unsigned>(WellKnownSymbol::Count));
      auto& cycle = realmSlot<CycleTag, gea::Ref<CycleNode>>();
      cycle = gea::makeRef<CycleNode>();
      cycle->next = gea::makeRef<CycleNode>();
      cycle->next->next = cycle;
      int jobs = 0;
      queuePromiseJob([&] { jobs += number; });
      ++ready;
      while (ready.load() < 2) std::this_thread::yield();
      drainPromiseJobs();
      assert(jobs == number);
      assert((realmSlot<CounterTag, int>() == number));
      assert(gea::runtime::globalThis().get() == global.get());
      for (int i = 0; i < 1000; ++i) {
        auto array = gea::makeRef<gea::ArrayBuffer>(64, std::uint8_t{0});
        assert(array->size() == 64);
      }
    }
    realm.clear();
    {
      RuntimeRealmScope scope(realm);
      assert((realmSlot<CounterTag, int>() == 0));
      assert(promiseJobs().empty());
    }
  };
  std::thread first(run, 11), second(run, 23);
  first.join();
  second.join();
  assert(CycleNode::live == 0);
  assert(root == 41);
  assert(rootJobs == 1);
}
