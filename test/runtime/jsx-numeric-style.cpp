#include "gea_runtime.h"
#include <cassert>
#include <limits>

struct NumericStyle {
  int writes = 0;
  double opacity = 0;
  bool setNumberProperty(const std::string& property, double value) {
    if (property != "opacity") return false;
    ++writes;
    opacity = value;
    return true;
  }
};

struct NumericNode {
  int handle;
  NumericStyle numeric;
  int id() const { return handle; }
  NumericStyle& style() { return numeric; }
};

int main() {
  auto& document = gea::jsx::detail::JsxDocument::instance();
  NumericNode node{document.createElement("img")};
  for (int alpha = 0; alpha <= 255; ++alpha) {
    const double value = alpha / 255.0;
    gea::jsx::styleProperty(node, "style", "opacity", value);
    assert(node.numeric.opacity == value);
  }
  assert(node.numeric.writes == 256);
  assert(document.at(node.id()).style.empty());

  // Unsupported numeric properties and string-valued declarations still use
  // the existing CSS text contract, including exact non-finite spellings.
  gea::jsx::styleProperty(node, "style", "custom", 1.25);
  assert(document.at(node.id()).style.at("custom") == "1.25");
  gea::jsx::styleProperty(node, "style", "opacity", std::string("0.5"));
  assert(document.at(node.id()).style.at("opacity") == "0.5");
  gea::jsx::styleProperty(node, "style", "opacity", std::numeric_limits<double>::infinity());
  assert(document.at(node.id()).style.at("opacity") == "Infinity");
  assert(node.numeric.writes == 256);

  auto plain = gea::jsx::create<gea::NativeHandle<gea_native_protocol_Element_v1>>("div");
  gea::jsx::styleProperty(plain, "style", "opacity", 0.25);
  assert(document.at(plain.id()).style.at("opacity") == "0.25");
}
