// The table-free number formatter (`GEA_CPP_COMPACT_NUMBER_FORMAT`, the
// Pebble build's) must print exactly what the host's own formatters do:
// `std::to_chars` shortest digits for ToString, `snprintf` "%.*e"/"%.*f" for
// toExponential/toFixed/toPrecision. Checked over hand-picked edges --
// powers of two (unequal gaps), subnormals, the largest double, ties -- and
// a few hundred thousand random bit patterns. Integer carriers, which the
// compact build spells by 16-bit long division, are checked against
// `std::to_string` the same way.
#define GEA_CPP_COMPACT_NUMBER_FORMAT 1
#define GEA_RUNTIME_COMPACT_CODE 1
#include "gea_runtime.h"

#include <charconv>
#include <cinttypes>
#include <cstdio>
#include <cstring>
#include <random>

namespace {

int failures = 0;

void expect(const std::string &got, const std::string &want, const char *what, double value, int precision = -1)
{
  if (got == want) return;
  if (++failures <= 20)
    std::fprintf(stderr, "%s(%.17g, %d): got \"%s\", want \"%s\"\n", what, value, precision, got.c_str(), want.c_str());
}

std::string printed(const char *format, int precision, double value)
{
  char buffer[512];
  std::snprintf(buffer, sizeof(buffer), format, precision, value);
  return buffer;
}

std::string shortestReference(double value)
{
  char buffer[64];
  const auto result = std::to_chars(buffer, buffer + sizeof(buffer), value, std::chars_format::general);
  return gea::host::detail::internal::toCharsToEcma(std::string(buffer, result.ptr));
}

void check(double value)
{
  if (!std::isfinite(value)) return;
  if (value != 0) {
    int k = 0;
    const std::string digits = gea::host::detail::internal::compactnumber::shortest(value, k);
    expect(gea::host::detail::internal::toCharsToEcma(std::string(value < 0 ? "-0." : "0.") + digits + "e" + std::to_string(k)),
           shortestReference(value), "shortest", value);
  }
  for (int precision : {0, 1, 2, 5, 16, 20}) {
    expect(gea::host::detail::internal::compactnumber::scientific(value, precision), printed("%.*e", precision, value), "%e", value,
           precision);
    if (std::fabs(value) < 1e25)
      expect(gea::host::detail::internal::compactnumber::fixed(value, precision), printed("%.*f", precision, value), "%f", value,
             precision);
  }
}

}  // namespace

int main()
{
  const double edges[] = {0.0, -0.0, 1.0, -1.0, 0.1, 0.2, 0.3, 1.0 / 3, 2.0 / 3, 0.5, 1.5, 2.5, 0.125, 0.375, 1e21, 1e-7, 123.456,
                          9.5, 99.5, 0.05, 0.005, 1.005, 5e-324, 1e-323, 2.2250738585072014e-308, 2.225073858507201e-308,
                          1.7976931348623157e308, 9007199254740993.0, 4.35, 1e23, 8.41e21, 5e-310, 1234567.0, 0.000001,
                          123456789012345680000.0};
  for (double value : edges) {
    check(value);
    check(-value);
  }
  for (int exponent = -1074; exponent <= 1023; ++exponent) check(std::ldexp(1.0, exponent));
  std::mt19937_64 random(20260924);
  for (int round = 0; round < 200000; ++round) {
    std::uint64_t bits = random();
    double value;
    std::memcpy(&value, &bits, sizeof(value));
    check(value);
  }
  std::uniform_real_distribution<double> ordinary(-1e6, 1e6);
  for (int round = 0; round < 100000; ++round) check(ordinary(random));
  for (int integer = -2000; integer <= 2000; ++integer) check(integer / 8.0);
  const long long integers[] = {0, 1, -1, 9, 10, -10, 65535, 65536, 4294967295LL, 4294967296LL, -4294967296LL, 9007199254740991LL,
                               -9007199254740991LL, 9223372036854775807LL, -9223372036854775807LL - 1};
  for (long long integer : integers) {
    const std::string got = gea::jsx::reactiveText(integer);
    if (got != std::to_string(integer) && ++failures <= 20)
      std::fprintf(stderr, "integer %lld: got \"%s\"\n", integer, got.c_str());
  }
  for (int round = 0; round < 100000; ++round) {
    const long long integer = static_cast<long long>(random());
    if (gea::jsx::reactiveText(integer) != std::to_string(integer) && ++failures <= 20)
      std::fprintf(stderr, "integer %lld mismatched\n", integer);
    if (gea::jsx::reactiveText(static_cast<int>(integer)) != std::to_string(static_cast<int>(integer)) && ++failures <= 20)
      std::fprintf(stderr, "int %d mismatched\n", static_cast<int>(integer));
  }
  if (failures) {
    std::fprintf(stderr, "compact number format: %d mismatches\n", failures);
    return 1;
  }
  std::printf("compact number format: matches to_chars and printf\n");
  return 0;
}
