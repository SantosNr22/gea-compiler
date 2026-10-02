// SPDX-License-Identifier: Apache-2.0
#pragma once

#ifdef ESP_PLATFORM
#include "sdkconfig.h"
#endif

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <limits>

namespace gea::runtime::audio {
namespace detail {

// Exact for the binary64 arithmetic in:
//   x = input || 0; x = clamp(x, -1, 1);
//   Math.round(x * (x < 0 ? 32768 : 32767))
// A float multiplication can round a value just below a half-integer onto
// that half-integer. Work from the Float32 significand instead, using only
// 32-bit integer operations; Math.round's negative ties go toward +infinity.
inline std::int32_t pcm16FromClampedBits(std::uint32_t bits) {
  const auto magnitude = bits & 0x7fffffffU;
  if (magnitude < 0x37800000U) return 0; // Less than 2^-16.
  if (magnitude >= 0x3f800000U) return bits >> 31 ? -32768 : 32767;
  const auto mantissa = (magnitude & 0x7fffffU) | 0x800000U;
  const auto shift = 135U - (magnitude >> 23);
  const auto half = 1U << (shift - 1);
  if (bits >> 31) return -static_cast<std::int32_t>((mantissa + half - 1) >> shift);
  const auto biased = mantissa + half;
  const auto rounded = biased >> shift;
  const auto remainder = biased & ((1U << shift) - 1);
  // floor((m + half)/2^shift - m/2^(shift+15)): the integer part
  // decreases exactly when remainder * 32768 < m. No 39-bit product needed.
  return static_cast<std::int32_t>(rounded - (remainder < ((mantissa + 32767U) >> 15)));
}

inline std::int16_t pcm16Sample(float value) {
  std::uint32_t bits;
  std::memcpy(&bits, &value, sizeof(bits));
  if ((bits & 0x7fffffffU) > 0x7f800000U) return 0; // input || 0 for NaN.
  return static_cast<std::int16_t>(pcm16FromClampedBits(bits));
}

#if defined(__XTENSA__) && defined(CONFIG_IDF_TARGET_ESP32S3) && CONFIG_IDF_TARGET_ESP32S3
// PIE operates on integers, not vectors of floating-point values. IEEE-754
// magnitudes have integer ordering, allowing real SIMD NaN sanitization and
// clamping before exact scalar quantization; VUNZIP packs eight Int16 results.
// The compiler does not allocate PIE Q registers; all are caller-saved.
inline void pcm16EightS3(const float* source, std::int16_t* destination) {
  alignas(16) static constexpr std::uint32_t constants[][4] = {
      {0x7fffffffU, 0x7fffffffU, 0x7fffffffU, 0x7fffffffU},
      {0x3f800000U, 0x3f800000U, 0x3f800000U, 0x3f800000U},
      {0x7f800000U, 0x7f800000U, 0x7f800000U, 0x7f800000U},
      {0xffffffffU, 0xffffffffU, 0xffffffffU, 0xffffffffU},
      {0x80000000U, 0x80000000U, 0x80000000U, 0x80000000U}};
  alignas(16) std::uint32_t clamped[8];
  alignas(16) std::int32_t quantized[8];
  const auto* input = source;
  const auto* table = constants[0];
  auto* output = clamped;
  asm volatile(
      "ee.vld.128.ip q2, %[table], 16\n"
      "ee.vld.128.ip q3, %[table], 16\n"
      "ee.vld.128.ip q4, %[table], 16\n"
      "ee.vld.128.ip q5, %[table], 16\n"
      "ee.vld.128.ip q6, %[table], 16\n"
      ".rept 2\n"
      "ee.vld.128.ip q0, %[input], 16\n"
      "ee.andq q1, q0, q2\n"
      "ee.vcmp.gt.s32 q7, q1, q4\n"
      "ee.xorq q7, q7, q5\n"
      "ee.vmin.s32 q1, q1, q3\n"
      "ee.andq q1, q1, q7\n"
      "ee.andq q0, q0, q6\n"
      "ee.orq q0, q0, q1\n"
      "ee.vst.128.ip q0, %[output], 16\n"
      ".endr\n"
      : [input] "+&a"(input), [table] "+&a"(table), [output] "+&a"(output)
      : : "memory");
  for (std::size_t i = 0; i < 8; ++i) quantized[i] = pcm16FromClampedBits(clamped[i]);
  alignas(16) std::int16_t packed[8];
  auto* packedOutput = (reinterpret_cast<std::uintptr_t>(destination) & 15) ? packed : destination;
  const auto* integers = quantized;
  asm volatile(
      "ee.vld.128.ip q0, %[integers], 16\n"
      "ee.vld.128.ip q1, %[integers], 16\n"
      "ee.vunzip.16 q0, q1\n"
      "ee.vst.128.ip q0, %[output], 16\n"
      : [integers] "+&a"(integers), [output] "+&a"(packedOutput)
      : : "memory");
  if (reinterpret_cast<std::uintptr_t>(destination) & 15) std::memcpy(destination, packed, sizeof(packed));
}
#endif
} // namespace detail

// Admitted bulk lowering supplies non-shared, non-overlapping typed-array
// ranges with checked bounds. Element-aligned offsets and all lengths work;
// SIMD loads never read beyond the requested range. No allocations or boxing.
inline void float32ToPcm16(const float* source, std::int16_t* destination, std::size_t count) {
  static_assert(sizeof(float) == sizeof(std::uint32_t) && std::numeric_limits<float>::is_iec559);
#if defined(__XTENSA__) && defined(CONFIG_IDF_TARGET_ESP32S3) && CONFIG_IDF_TARGET_ESP32S3
  while (count && (reinterpret_cast<std::uintptr_t>(source) & 15)) {
    *destination++ = detail::pcm16Sample(*source++);
    --count;
  }
  while (count >= 8) {
    detail::pcm16EightS3(source, destination);
    source += 8;
    destination += 8;
    count -= 8;
  }
#endif
  while (count--) *destination++ = detail::pcm16Sample(*source++);
}
} // namespace gea::runtime::audio
