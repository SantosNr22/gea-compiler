#include "gea_runtime.h"
#include <cassert>
#include <utility>

// A shared literal occupies different positions in different native layouts.
// Instantiating many layouts must not multiply the TLS allocation per task.
inline constexpr char sharedKey[] = "shared";

template <unsigned Identity>
struct CacheRecord {
  bool present[2] = {false, false};
  gea::NativeIndexAttributes attributes;

  void gea_ownFieldKeys(std::vector<gea::PropertyKey>& keys) const {
    gea_eachOwnField(*this, [&](std::string_view name, const bool& held, const gea::NativeIndexAttributes&) {
      if (held) keys.push_back(gea::PropertyKey::string(std::string(name)));
      return false;
    });
  }

  bool gea_ownFieldDescriptor(const gea::PropertyKey& key, gea::PropertyDescriptor& descriptor) const {
    if (key.isSymbol()) return false;
    bool found = false;
    gea_eachOwnField(*this, [&](std::string_view name, const bool& held, const gea::NativeIndexAttributes&) {
      if (held && name == key.text()) {
        descriptor.hasEnumerable = true;
        descriptor.enumerable = true;
        found = true;
      }
      return found;
    });
    return found;
  }

  template <typename Visit>
  static bool gea_eachOwnField(const CacheRecord& self, Visit&& visit) {
    if constexpr (Identity % 2 == 0) {
      if (visit(sharedKey, self.present[0], self.attributes)) return true;
      return visit("other", self.present[1], self.attributes);
    } else {
      if (visit("other", self.present[0], self.attributes)) return true;
      return visit(sharedKey, self.present[1], self.attributes);
    }
  }
};

template <unsigned Identity>
void checkLayout() {
  auto record = gea::makeRef<CacheRecord<Identity>>();
  gea::detail::noteNativeDeclaredKeyCreated(record, sharedKey);
  const auto& layout = gea::detail::nativeLayoutInfoOf(*record);
  const auto& hints = gea::detail::nativeDeclaredKeyPositionHints();
  const auto& hint = hints[(reinterpret_cast<std::uintptr_t>(sharedKey) * 0x9E3779B97F4A7C15ull) >> 56];
  assert(hint.data == sharedKey);
  assert(hint.position == layout.position(sharedKey));
  assert(hint.position == Identity % 2);
  record->present[1 - Identity % 2] = true;
  record->present[Identity % 2] = true;
  gea::detail::noteNativeDeclaredKeyCreated(record, sharedKey);
  assert((gea::nativeDynamicKeys(record) == std::vector<std::string>{"other", "shared"}));
}

template <unsigned... Identities>
void checkLayouts(std::integer_sequence<unsigned, Identities...>) {
  (checkLayout<Identities>(), ...);
}

int main() {
  checkLayouts(std::make_integer_sequence<unsigned, 64>{});
  // Repeat after every cache slot has been reused by other record layouts.
  checkLayouts(std::make_integer_sequence<unsigned, 64>{});
}
