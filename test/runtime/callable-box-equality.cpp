// `fn === boxed` where one side is a native callable and the other a
// `gea::Value`: answered on the callable, never by boxing it.
// `Value::strictEqualsCallable` must agree with what boxing both sides and
// `strictEquals` would say, mint no identity on an unminted callable, and
// treat two capture-free copies of one declaration as one function.
#include "gea_runtime.h"
#include <cassert>
#include <cstdio>

static constexpr char tagA = 0;
static constexpr char tagB = 0;

static double plain(void*, double x) { return x + 1; }
static double plainToo(void*, double x) { return x + 2; }

struct Env {
  gea::Ref<gea::ArrayObject<double>> held;
};
static double closureThunk(void* environment, double x) {
  alignas(void*) unsigned char slot[sizeof(void*)];
  auto* env = gea::unpackEnvironment<Env>(environment, slot);
  return x + static_cast<double>(env->held->length());
}

int main() {
  using Fn = gea::CallableObject<double(double)>;
  // Capture-free, identified at allocation as the emitter does: two copies of
  // one declaration compare equal through their declaration.
  Fn a = gea::identifyCallable<&tagA>(Fn{&plain, nullptr});
  Fn aAgain = gea::identifyCallable<&tagA>(Fn{&plain, nullptr});
  Fn b = gea::identifyCallable<&tagB>(Fn{&plainToo, nullptr});
  gea::Value boxedA = gea::Value::box(gea::Value::Tag::Function, a);
  assert(gea::Value::strictEqualsCallable(boxedA, a));
  assert(gea::Value::strictEqualsCallable(boxedA, aAgain));
  assert(!gea::Value::strictEqualsCallable(boxedA, b));
  assert(gea::Value::strictEquals(boxedA, gea::Value::box(gea::Value::Tag::Function, a)));
  // Not a function at all: unequal without reading the callable.
  assert(!gea::Value::strictEqualsCallable(gea::Value::box(gea::Value::Tag::Number, 1.0), a));
  assert(!gea::Value::strictEqualsCallable(gea::Value(), a));

  // Heap-environment closures: the identity lives in the environment block,
  // lazily. Comparing an UNMINTED closure against a box mints nothing and
  // answers false; a copy of the boxed closure answers true.
  Env env{gea::arrayOf<double>({1.0, 2.0})};
  Fn c = gea::identifyCallable<&tagA>(Fn{&closureThunk, gea::packEnvironment(env)});
  Fn d = gea::identifyCallable<&tagA>(Fn{&closureThunk, gea::packEnvironment(env)});
  gea::Value boxedC = gea::Value::box(gea::Value::Tag::Function, c);
  assert(d.identityHeader != nullptr && !d.identityHeader->identity);
  assert(!gea::Value::strictEqualsCallable(boxedC, d));
  assert(!d.identityHeader->identity);  // nothing was minted to answer
  Fn cCopy = c;
  assert(gea::Value::strictEqualsCallable(boxedC, cCopy));
  assert(!gea::Value::strictEqualsCallable(boxedC, a));
  // The shared identity carrier compares by the same anchor.
  assert(gea::Value::strictEqualsCallableIdentity(boxedC, c.functionObjectIdentity()));
  assert(!gea::Value::strictEqualsCallableIdentity(boxedC, d.functionObjectIdentity()));
  std::puts("callable-box-equality: ok");
  return 0;
}
