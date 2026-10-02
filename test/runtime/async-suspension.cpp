// `await` is a real suspension: `gea::Promise` is a coroutine return type,
// `co_await` resumes from exactly one Promise job, and `gea::AsyncGenerator`
// implements the AsyncGeneratorRequest queue. Nothing here may pump.
//
// Run with the argument `reentrant` it must ABORT: a blocking `.awaited()`
// entered from inside a Promise job is the nested pump the runtime refuses.
#include "gea_runtime.h"
#include <cassert>
#include <cstring>
#include <string>
#include <vector>

static std::vector<std::string> trace;
static void log(std::string line) { trace.push_back(std::move(line)); }

static void expectTrace(std::initializer_list<const char*> expected) {
  std::vector<std::string> wanted(expected.begin(), expected.end());
  if (trace != wanted) {
    std::fprintf(stderr, "trace mismatch\n  got:");
    for (const auto& line : trace) std::fprintf(stderr, " %s", line.c_str());
    std::fprintf(stderr, "\n  want:");
    for (const auto& line : wanted) std::fprintf(stderr, " %s", line.c_str());
    std::fprintf(stderr, "\n");
    std::abort();
  }
  trace.clear();
}

struct Thrown {
  int code;
};

// ---- ordering of two interleaved async functions -------------------------

static gea::Promise<void> worker(const char* name) {
  log(std::string(name) + "1");
  co_await gea::Promise<double>(1.0);
  log(std::string(name) + "2");
  co_await gea::awaitValue(2.0);
  log(std::string(name) + "3");
}

// ---- rejection propagation -----------------------------------------------

static gea::Promise<double> failing() {
  co_await gea::awaitValue();
  throw Thrown{7};
  co_return 0.0;
}

static gea::Promise<double> catching() {
  try {
    co_return co_await failing();
  } catch (const Thrown& thrown) {
    co_return static_cast<double>(thrown.code * 10);
  }
}

static gea::Promise<double> propagating() {
  double value = co_await failing();
  co_return value + 1;
}

// ---- adoption and a value computed across awaits -------------------------

static gea::Promise<double> adopting() { co_return gea::Promise<double>(41.0); }

static gea::Promise<double> summing() {
  double a = co_await adopting();
  double b = co_await gea::awaitValue(1.0);
  co_return a + b;
}

// ---- `T | Promise<T>` and a boxed value ---------------------------------

using MaybePromised = gea::TaggedUnion<double, gea::Promise<double>>;

static gea::Promise<double> fromUnion(MaybePromised plain, MaybePromised promised) {
  double a = co_await gea::awaitValue(plain);
  double b = co_await gea::awaitValue(promised);
  co_return MaybePromised::ofArm<1>(gea::Promise<double>(a + b));
}

static gea::Promise<gea::Value> fromBox(gea::Value boxed) { co_return co_await gea::detail::promiseResolveDynamic(boxed); }

// ---- async generator -----------------------------------------------------

struct FrameProbe {
  int* destroyed;
  ~FrameProbe() { ++*destroyed; }
};

static gea::AsyncGenerator<double, std::string> counter(int* destroyed) {
  FrameProbe probe{destroyed};
  log("g:start");
  co_yield co_await gea::awaitValue(1.0);
  log("g:after1");
  co_yield co_await gea::Promise<double>(2.0);
  log("g:after2");
  co_return co_await gea::awaitValue(std::string("end"));
}

static gea::AsyncGenerator<double, void, double> echo() {
  // A yield resumes with `YieldResumption`: the `.next(v)` argument, or a
  // `.return(v)` completion the body is expected to `co_return` itself
  // (the emitter renders that branch; this hand-written body never sees one).
  double received = (co_yield 0.0).next;
  for (;;) received = (co_yield received * 2).next;
}

static gea::AsyncGenerator<double> guarded(int* finallyRan) {
  struct Finally {
    int* ran;
    ~Finally() { ++*ran; }
  } guard{finallyRan};
  // What every emitted body does at a yield: a `.return()` delivered there
  // is a return completion the body performs itself (`YieldResumption`),
  // not an exception thrown through the frame.
  if ((co_yield 1.0).returned) co_return;
  if ((co_yield 2.0).returned) co_return;
}

template <typename Result>
static void record(const char* label, gea::Promise<Result> promise) {
  promise.observe(
      [label](const Result& result) {
        if (result.done) log(std::string(label) + ":done");
        else log(std::string(label) + ":" + std::to_string(static_cast<int>(result.value)));
      },
      [label](const std::exception_ptr&) { log(std::string(label) + ":rejected"); });
}

static gea::Promise<void> blockingInsideAJob() {
  co_await gea::awaitValue();
  gea::Promise<double> pending;
  pending.awaited();
}

int main(int argc, char** argv) {
  if (argc > 1 && std::strcmp(argv[1], "reentrant") == 0) {
    auto promise = blockingInsideAJob();
    gea::detail::drainPromiseJobs();
    return 0;
  }

  const auto& doubleStates = gea::detail::allocationTypeProfile<gea::detail::PromiseState<double>>();

  // Two async functions interleave one job per await, as in JavaScript.
  {
    auto a = worker("a");
    auto b = worker("b");
    expectTrace({"a1", "b1"});
    assert(!a.settled() && !b.settled());
    gea::detail::drainPromiseJobs();
    expectTrace({"a2", "b2", "a3", "b3"});
    assert(a.settled() && b.settled() && !a.rejected());
  }

  // Awaiting an ALREADY-settled promise still costs one tick, and one only.
  {
    gea::Promise<double> settled(5.0);
    bool resumed = false;
    auto body = [&]() -> gea::Promise<void> {
      double value = co_await settled;
      assert(value == 5.0);
      resumed = true;
    };
    auto running = body();
    assert(!resumed && gea::detail::promiseJobs().size() == 1);
    auto job = std::move(gea::detail::promiseJobs().front());
    gea::detail::promiseJobs().pop_front();
    job();
    assert(resumed && running.settled() && gea::detail::promiseJobs().empty());
  }

  // Rejections cross co_await as exceptions; an uncaught one rejects the caller.
  {
    auto caught = catching();
    auto propagated = propagating();
    gea::detail::drainPromiseJobs();
    assert(caught.settled() && !caught.rejected() && caught.value() == 70.0);
    assert(propagated.rejected());
    try {
      propagated.rethrow();
      assert(false);
    } catch (const Thrown& thrown) {
      assert(thrown.code == 7);
    }
  }

  // co_return of a Promise adopts it; values survive across suspensions.
  {
    auto total = summing();
    gea::detail::drainPromiseJobs();
    assert(total.value() == 42.0);
  }

  // A sum whose arms resolve alike is adopted by its live arm.
  {
    auto sum = fromUnion(MaybePromised::ofArm<0>(1.5), MaybePromised::ofArm<1>(gea::Promise<double>(2.5)));
    gea::detail::drainPromiseJobs();
    assert(sum.value() == 4.0);
    auto boxed = fromBox(gea::Value::box(gea::Value::Tag::Number, 3.0));
    assert(!boxed.settled());
    gea::detail::drainPromiseJobs();
    assert(boxed.value().tag() == gea::Value::Tag::Number);
  }

  // Async generator: three next() calls made before the body runs are queued
  // and settled in order; the body runs once, continuing through the queue.
  {
    int destroyed = 0;
    {
      auto generator = counter(&destroyed);
      assert(trace.empty());
      auto first = generator.next();
      auto second = generator.next();
      auto third = generator.next();
      auto fourth = generator.next();
      expectTrace({"g:start"});
      record("n1", first);
      record("n2", second);
      record("n3", third);
      record("n4", fourth);
      gea::detail::drainPromiseJobs();
      // A yield with requests already queued continues WITHOUT suspending
      // (27.6.3.8 step 11), so the body runs on before n1's reaction job.
      expectTrace({"g:after1", "n1:1", "g:after2", "n2:2", "n3:done", "n4:done"});
      assert(third.value().completion == "end" && fourth.value().completion.empty());
      assert(destroyed == 1);
      // A completed generator answers {done: true} at once.
      auto late = generator.next();
      record("late", late);
      gea::detail::drainPromiseJobs();
      expectTrace({"late:done"});
    }
    assert(destroyed == 1);
  }

  // next(v) delivers v as the value of the paused yield.
  {
    auto generator = echo();
    auto a = generator.next(100.0);  // the first next's value is dropped
    auto b = generator.next(3.0);
    auto c = generator.next(4.0);
    gea::detail::drainPromiseJobs();
    assert(a.value().value == 0.0 && b.value().value == 6.0 && c.value().value == 8.0);
  }

  // return_ at a paused yield runs finally, then settles {value, done: true};
  // a throw_ queued behind it rejects, a next behind that is done.
  {
    int finallyRan = 0;
    auto generator = guarded(&finallyRan);
    auto first = generator.next();
    gea::detail::drainPromiseJobs();
    assert(first.value().value == 1.0 && finallyRan == 0);
    auto closed = generator.return_();
    auto thrown = generator.throw_(std::make_exception_ptr(Thrown{3}));
    auto after = generator.next();
    record("ret", closed);
    record("thr", thrown);
    record("aft", after);
    gea::detail::drainPromiseJobs();
    assert(finallyRan == 1);
    expectTrace({"ret:done", "thr:rejected", "aft:done"});
  }

  // return_/throw_ on a generator that never started never run its body.
  {
    int finallyRan = 0;
    auto generator = guarded(&finallyRan);
    auto thrown = generator.throw_(std::make_exception_ptr(Thrown{4}));
    auto again = generator.next();
    record("t0", thrown);
    record("t1", again);
    gea::detail::drainPromiseJobs();
    expectTrace({"t0:rejected", "t1:done"});
    assert(finallyRan == 0);
  }

  // Dropping a generator suspended at a yield destroys its frame.
  {
    int destroyed = 0;
    {
      auto generator = counter(&destroyed);
      auto first = generator.next();
      gea::detail::drainPromiseJobs();
      expectTrace({"g:start"});
      assert(first.value().value == 1.0 && destroyed == 0);
    }
    assert(destroyed == 1);
  }

  // Every promise state and every frame is gone once the jobs have run.
  assert(gea::detail::promiseJobs().empty());
  assert(doubleStates.created == doubleStates.destroyed);
  assert(gea::detail::liveCoroutineFrames() == 0);
  std::puts("async-suspension: ok");
  return 0;
}
