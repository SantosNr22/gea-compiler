#include "gea_runtime.h"
#include <cassert>
#include <cstdio>

template <typename F> void rejectsDetached(F operation) {
  bool rejected = false;
  try { operation(); } catch (const gea::Value&) { rejected = true; }
  assert(rejected);
}

int main() {
  for (std::size_t length : {0u, 32u, 1920u}) {
    auto sender = gea::makeRef<gea::ArrayBuffer>(length, std::uint8_t{42});
    auto alias = sender;
    auto view = gea::TypedArray<std::uint8_t>::fromBuffer(sender, 0, length);
    gea::DataView dataView(sender, 0, length);
    const auto* original = sender->data();
    auto moved = sender->detachBytes();
    assert(sender->detached() && alias->detached());
    assert(sender->size() == 0 && view.length() == 0 && view.byteLength() == 0);
    assert(view.byteOffset() == 0 && !view.hasElementAtIndex(0));
    view.setElementAtIndex(0, 7);
    rejectsDetached([&] { sender->detachBytes(); });
    rejectsDetached([&] { view.data(); });
    rejectsDetached([&] { view.fill(7, 0, length); });
    rejectsDetached([&] { dataView.byteLength(); });
    rejectsDetached([&] { dataView.getUint8(0); });
    auto receiver = gea::makeRef<gea::ArrayBuffer>(std::move(moved));
    assert(!receiver->detached() && receiver->size() == length);
    if (length > 64) assert(receiver->data() == original);
    for (auto byte : *receiver) assert(byte == 42);
  }
  std::puts("ArrayBuffer transfer: detached aliases, guarded views, zero-copy heap ownership passed");
}
