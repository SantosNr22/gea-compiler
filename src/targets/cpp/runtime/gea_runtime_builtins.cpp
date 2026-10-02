// SPDX-License-Identifier: Apache-2.0
// Compile exactly once with the same host prelude and build-wide declaration
// mode as every consumer. The owner must not use an independent runtime ABI.
#ifndef GEA_CPP_SHARED_RUNTIME_BUILTINS
#error "runtime builtin storage requires build-wide GEA_CPP_SHARED_RUNTIME_BUILTINS"
#endif
#ifndef GEA_RUNTIME_H
#include "gea_runtime.h"
#endif

// The host builtin function values (`gea::host::Math::floor`, `Date.now`,
// `String.fromCharCode`) used to be defined here, once, so that a
// multi-unit build did not initialize a copy per unit. They are now
// `inline constexpr gea::HostFunction` constants with no storage to own
// (gea_runtime.h), and the one carrier each builds on first use is a
// function-local static every unit already shares. The unit stays so builds
// that compile it keep building.
