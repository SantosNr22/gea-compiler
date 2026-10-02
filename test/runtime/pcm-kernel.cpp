// SPDX-License-Identifier: Apache-2.0
#include "../../src/targets/cpp/runtime/gea_pcm.h"
#include <array>
#include <bit>
#include <cmath>
#include <cstdio>
#include <cstdlib>

static std::size_t cases = 0;

static std::int16_t reference(float input) {
  double value = input;
  if (std::isnan(value)) value = 0;
  if (value > 1) value = 1;
  if (value < -1) value = -1;
  return static_cast<std::int16_t>(std::floor(value * (value < 0 ? 32768 : 32767) + 0.5));
}

static void check(const float* input, std::int16_t* output, std::size_t count) {
  gea::runtime::audio::float32ToPcm16(input, output, count);
  for (std::size_t i = 0; i < count; ++i) {
    ++cases;
    const auto expected = reference(input[i]);
    if (output[i] != expected) {
      std::printf("PCM mismatch bits=%08x actual=%d expected=%d index=%zu\n",
                  unsigned(std::bit_cast<std::uint32_t>(input[i])), int(output[i]), int(expected), i);
      std::abort();
    }
  }
}

int main() {
  alignas(16) std::array<float, 144> input{};
  alignas(16) std::array<std::int16_t, 160> output{};
  std::uint32_t random = 0xc09a84f1;
  for (unsigned batch = 0; batch < 16384; ++batch) {
    for (auto& sample : input) {
      random ^= random << 13; random ^= random >> 17; random ^= random << 5;
      sample = std::bit_cast<float>(random);
    }
    check(input.data(), output.data(), input.size());
  }
  // Every output rounding boundary and its adjacent Float32 values, including
  // negative ties, is more useful here than random normalized audio alone.
  for (int integer = -32768; integer < 32768; ++integer) {
    const float middle = static_cast<float>((integer + 0.5) / (integer < 0 ? 32768.0 : 32767.0));
    input[0] = std::nextafter(middle, -INFINITY);
    input[1] = middle;
    input[2] = std::nextafter(middle, INFINITY);
    check(input.data(), output.data(), 3);
  }
  constexpr std::uint32_t edges[] = {
      0, 0x80000000, 1, 0x80000001, 0x007fffff, 0x807fffff,
      0x377fffff, 0x37800000, 0x37800001, 0xb77fffff, 0xb7800000, 0xb7800001,
      0x3f7fffff, 0x3f800000, 0x3f800001, 0xbf7fffff, 0xbf800000, 0xbf800001,
      0x7f800000, 0xff800000, 0x7f800001, 0xff800001, 0x7fc00000, 0xffffffff};
  for (std::size_t i = 0; i < input.size(); ++i) input[i] = std::bit_cast<float>(edges[i % std::size(edges)]);
  for (std::size_t inOffset = 0; inOffset < 4; ++inOffset) {
    for (std::size_t outOffset = 0; outOffset < 8; ++outOffset) {
      for (std::size_t count = 0; count <= 128; ++count) {
        output.fill(12345);
        check(input.data() + inOffset, output.data() + outOffset, count);
        for (std::size_t i = 0; i < output.size(); ++i) {
          if ((i < outOffset || i >= outOffset + count) && output[i] != 12345) std::abort();
        }
      }
    }
  }
  std::printf("PCM differential: %zu samples, boundary/NaN/infinity/offset cases passed\n", cases);
}
