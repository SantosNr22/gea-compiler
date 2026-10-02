#include "gea/embedded.h"
#define GEA_HOST_DECLARED 1
#include "gea_runtime.h"
#include <cassert>

namespace gea::host {
std::string MediaStreamTrack::kind() const { return "audio"; }
std::string MediaStreamTrack::id() const { return "track-" + std::to_string(nativeHandle); }
std::string MediaStream::id() const { return "stream-" + std::to_string(nativeHandle); }
}
namespace gea::host::rtc {
RTCConfiguration captured;
bool failDescription = true;
void platform_create(uint32_t, const RTCConfiguration& c) { captured = c; }
void platform_create_channel(uint32_t, const std::string&, const RTCDataChannelInit&) {}
std::string platform_create_offer(uint32_t) {
  if (failDescription) throw std::runtime_error("RTC task allocation failed");
  return "v=0\r\n";
}
std::string platform_create_answer(uint32_t) { throw std::runtime_error("RTC answer failed"); }
}
struct Server { gea::TaggedUnion<std::string, gea::Ref<gea::ArrayObject<std::string>>> urls; gea::Optional<std::string> username, credential; };
struct Config { gea::Optional<gea::Ref<gea::ArrayObject<gea::Ref<Server>>>> iceServers; gea::Optional<std::string> iceTransportPolicy; };
struct PresenceConfig {
  gea::Ref<gea::ArrayObject<gea::Ref<Server>>> iceServers;
  std::string iceTransportPolicy;
  bool gea_present_iceServers = true;
  bool gea_present_iceTransportPolicy = false;
};
struct Init { gea::Optional<bool> ordered; gea::Optional<double> maxRetransmits; };
struct Direction { std::string direction; };
struct Message { gea::TaggedUnion<std::string, gea::Ref<gea::ArrayBuffer>> data; };
struct Description { std::string type; gea::Optional<std::string> sdp; };
struct CandidateInit {
  gea::Optional<std::string> candidate;
  gea::TaggedUnion<gea::Undefined, std::nullptr_t, std::string> sdpMid, usernameFragment;
  gea::TaggedUnion<gea::Undefined, std::nullptr_t, double> sdpMLineIndex;
};
struct CandidateEvent { gea::host::RTCIceCandidate candidate; };
int main() {
  namespace bridge = gea::runtime::hostrtc;
  auto cfg = gea::makeRef<Config>();
  auto servers = gea::makeRef<gea::ArrayObject<gea::Ref<Server>>>();
  auto server = gea::makeRef<Server>();
  server->urls = decltype(server->urls)::ofArm<0>(std::string("turn:relay.invalid"));
  server->username = "test"; server->credential = "secret";
  servers->push(server); cfg->iceServers = servers; cfg->iceTransportPolicy = "relay";
  auto pc = bridge::createPeer(gea::Optional<gea::Ref<Config>>(cfg));
  auto absentPolicy = gea::makeRef<PresenceConfig>();
  absentPolicy->iceServers = servers;
  auto defaultPc = bridge::createPeer(absentPolicy);
  assert(gea::host::rtc::captured.iceTransportPolicy == "all");
  defaultPc.close();
  gea::host::rtc::destroy_handle(defaultPc.nativeHandle);
  absentPolicy->gea_present_iceTransportPolicy = true;
  bool invalidPolicyCaught = false;
  try { bridge::createPeer(absentPolicy); }
  catch (const gea::Value& error) { invalidPolicyCaught = gea::host::instanceOfError(error, "TypeError"); }
  assert(invalidPolicyCaught);
  // A native transport failure must reach a compiled JS catch(Error), rather
  // than silently escaping it as a C++ exception and leaving Connecting stuck.
  gea::Promise<gea::Ref<Description>> offer = bridge::createOffer(pc);
  gea::Promise<gea::Ref<Description>> answer = bridge::createAnswer(pc);
  assert(!offer.settled() && !answer.settled());
  gea::host::rtc::runCallbacks();
  assert(offer.rejected() && answer.rejected());
  bool offerCaught = false, answerCaught = false;
  try { offer.rethrow(); }
  catch (const gea::Value& error) { offerCaught = gea::host::instanceOfError(error, "Error"); }
  try { answer.rethrow(); }
  catch (const gea::Value& error) { answerCaught = gea::host::instanceOfError(error, "Error"); }
  assert(offerCaught && answerCaught);
  gea::host::rtc::failDescription = false;
  gea::Promise<gea::Ref<Description>> readyOffer = bridge::createOffer(pc);
  assert(!readyOffer.settled());
  gea::host::rtc::runCallbacks();
  assert(readyOffer.settled() && !readyOffer.rejected());
  assert(readyOffer.value()->type == "offer" && (*readyOffer.value()->sdp).find("v=0") == 0);

  assert(gea::host::rtc::captured.iceServers[0].credential == "secret");
  assert(gea::host::rtc::captured.iceServers[0].urls[0] == "turn:relay.invalid");
  auto init = gea::makeRef<Init>(); init->ordered = false; init->maxRetransmits = 0.0;
  auto channel = bridge::createDataChannel(pc, "_lossy", init);
  assert(!channel.ordered() && channel.maxRetransmits() == 0);
  auto tr = bridge::addTransceiver(pc, std::string("audio"), Direction{"recvonly"});
  assert(tr.direction() == "recvonly");
  bool gotTrack = false;
  gea::CallableObject<void(gea::host::RTCTrackEvent)> onTrack{
    [](void* state, gea::host::RTCTrackEvent event) {
      assert(event.track().nativeHandle == 29 && event.streams().empty());
      assert(event.receiver().track()->nativeHandle == 29);
      assert(event.receiver().nativeHandle == event.transceiver().receiver().nativeHandle);
      *static_cast<bool*>(state) = true;
    }, &gotTrack
  };
  bridge::setPeerOnTrack(pc, onTrack);
  gea::host::rtc::enqueue_track(pc.nativeHandle, 29);
  gea::host::rtc::runCallbacks(); assert(gotTrack);
  bridge::setPeerOnTrack(pc, nullptr);
  auto missing = bridge::optional(tr.mid()); assert(!missing.has_value());
  bridge::setChannelOnOpen(channel, nullptr);
  bridge::setPeerOnNegotiation(pc, gea::Undefined{});
  bool received = false;
  gea::CallableObject<void(gea::Ref<Message>)> onMessage{
    [](void* state, gea::Ref<Message> event) {
      assert(event->data.index() == 1);
      const auto& bytes = event->data.template get<1>();
      assert(bytes->size() == 3 && (*bytes)[1] == 128);
      *static_cast<bool*>(state) = true;
    }, &received
  };
  bridge::setChannelOnMessage(channel, onMessage);
  gea::host::rtc::enqueue_channel_open(pc.nativeHandle, "_lossy", 1);
  const uint8_t bytes[] = {0, 128, 255};
  gea::host::rtc::enqueue_channel_message(pc.nativeHandle, 1, bytes, 3, false);
  gea::host::rtc::runCallbacks(); assert(received);
  gea::Ref<Description> before = bridge::localDescription(pc);
  assert(!before);
  pc.setLocalDescription("offer", "v=0\r\n");
  gea::Ref<Description> after = bridge::localDescription(pc);
  assert(after && after->type == "offer" && *after->sdp == "v=0\r\n");
  gea::host::RTCSessionDescriptionObject native = bridge::localDescription(pc);
  gea::host::RTCSessionDescriptionObject same = bridge::localDescription(pc);
  assert(native == same && native.type() == "offer");
  after->sdp = "changed";
  assert(native.sdp() == "v=0\r\n");
  const auto created = bridge::createDescription(after);
  after->sdp = "changed again";
  assert(created.sdp() == "changed");
  gea::Ref<Description> json = bridge::descriptionJson(created);
  json->sdp = "different";
  assert(created.sdp() == "changed");
  bridge::setRemoteDescription(pc, created);
  assert(pc.remoteDescription()->sdp() == "changed");
  pc.setLocalDescription("answer", "new sdp");
  gea::host::RTCSessionDescriptionObject replacement = bridge::localDescription(pc);
  assert(!(native == replacement) && native.type() == "offer" && replacement.type() == "answer");
  const auto noSdp = bridge::createDescription(Description{"rollback", {}});
  assert(noSdp.sdp().empty());
  bool rejected = false;
  try { bridge::createDescription(Description{"invalid", {}}); }
  catch (const std::invalid_argument&) { rejected = true; }
  assert(rejected);
  auto iceInit = gea::makeRef<CandidateInit>();
  iceInit->candidate = "candidate:1 1 udp 100 192.0.2.1 5000 typ host";
  iceInit->sdpMid = decltype(iceInit->sdpMid)::ofArm<2>(std::string("audio"));
  iceInit->sdpMLineIndex = decltype(iceInit->sdpMLineIndex)::ofArm<2>(-1.5);
  const auto ice = bridge::createCandidate(iceInit);
  assert(ice.sdpMLineIndex() == 65535 && ice.address() == "192.0.2.1");
  gea::Ref<CandidateInit> iceJson = bridge::candidateJson(ice);
  assert(iceJson->usernameFragment.index() == 1 && iceJson->sdpMid.template get<2>() == "audio");
  iceJson->candidate = "changed";
  assert(ice.candidate() != "changed");
  bool noMediaRejected = false;
  try { bridge::createCandidate(); } catch (const std::invalid_argument&) { noMediaRejected = true; }
  assert(noMediaRejected);
  int iceEvents = 0;
  gea::CallableObject<void(gea::Ref<CandidateEvent>)> onIce{
    [](void* state, gea::Ref<CandidateEvent> event) {
      auto& count = *static_cast<int*>(state);
      if (count == 0) {
        assert(event->candidate.protocol() == "udp" && event->candidate.port() == 5000);
      } else assert(event->candidate == nullptr);
      ++count;
    }, &iceEvents
  };
  gea::runtime::hostevent::setRtcOnIceCandidate(pc, onIce);
  gea::host::rtc::enqueue_ice_candidate(pc.nativeHandle, ice.candidate(), "audio", 0);
  gea::host::rtc::enqueue_ice_candidate(pc.nativeHandle, "", "", 0);
  gea::host::rtc::runCallbacks();
  assert(iceEvents == 2);
  pc.close(); gea::host::rtc::destroy_handle(pc.nativeHandle);
}
