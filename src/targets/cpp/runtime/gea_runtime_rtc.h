// SPDX-License-Identifier: Apache-2.0
// Included inside gea::runtime::hostrtc, after the basic SDP adapters.
// Keep declared records native: optional/ref/union are representation wrappers,
// not reasons to send ICE credentials or channel data through a dynamic box.
template <typename V, typename Fn>
void present(const V& value, Fn&& fn) {
  if constexpr (std::is_same_v<V, gea::Undefined> || std::is_same_v<V, std::nullptr_t>) return;
  else if constexpr (requires { value.has_value(); *value; }) { if (value.has_value()) present(*value, fn); }
  else if constexpr (requires { V::arity; value.index(); }) {
    [&]<std::size_t... I>(std::index_sequence<I...>) {
      ((value.index() == I ? (present(value.template get<I>(), fn), 0) : 0), ...);
    }(std::make_index_sequence<V::arity>{});
  } else if constexpr (requires { value.operator->(); *value; }) { if (value) present(*value, fn); }
  else fn(value);
}
// Generated records may carry optional-field presence separately from storage.
// Reading an absent native string/bool/number would overwrite WebIDL defaults.
#define GEA_RTC_FIELD(object, field, ...) \
  do { \
    if constexpr (requires { object.field; }) { \
      bool hasField = true; \
      if constexpr (requires { object.gea_present_##field; }) hasField = object.gea_present_##field; \
      if (hasField) present(object.field, __VA_ARGS__); \
    } \
  } while (false)

template <typename T>
gea::Optional<T> optional(const std::optional<T>& value) { return value ? gea::Optional<T>(*value) : gea::Optional<T>(); }

template <typename Slot, typename T>
void assignNullable(Slot& slot, const std::optional<T>& value) {
  if (value) hostevent::assign(slot, *value);
  else hostevent::assign(slot, nullptr);
}
class CandidateSnapshot {
 public:
  explicit CandidateSnapshot(gea::host::RTCIceCandidate value) : value_(std::move(value)) {}
  template <typename Fields> operator gea::Ref<Fields>() const {
    auto result = gea::makeRef<Fields>();
    hostevent::assign(result->candidate, value_.candidate());
    assignNullable(result->sdpMid, value_.sdpMid());
    assignNullable(result->sdpMLineIndex, value_.sdpMLineIndex());
    assignNullable(result->usernameFragment, value_.usernameFragment());
    if constexpr (requires { result->gea_present_candidate; }) result->gea_present_candidate = true;
    if constexpr (requires { result->gea_present_sdpMid; }) result->gea_present_sdpMid = true;
    if constexpr (requires { result->gea_present_sdpMLineIndex; }) result->gea_present_sdpMLineIndex = true;
    if constexpr (requires { result->gea_present_usernameFragment; }) result->gea_present_usernameFragment = true;
    return result;
  }
 private:
  gea::host::RTCIceCandidate value_;
};
inline CandidateSnapshot candidateJson(const gea::host::RTCIceCandidate& value) { return CandidateSnapshot(value); }
template <typename Init>
gea::host::RTCIceCandidate createCandidate(const Init& init) {
  gea::host::RTCIceCandidateInit result;
  present(init, [&](const auto& fields) {
    GEA_RTC_FIELD(fields, candidate, [&](const auto& v) { result.candidate = v; });
    GEA_RTC_FIELD(fields, sdpMid, [&](const auto& v) { result.sdpMid = v; });
    GEA_RTC_FIELD(fields, sdpMLineIndex, [&](double v) {
      // WebIDL unsigned short conversion wraps, including negative numbers.
      const double truncated = std::isfinite(v) ? std::fmod(std::trunc(v), 65536.0) : 0;
      result.sdpMLineIndex = truncated < 0 ? truncated + 65536.0 : truncated;
    });
    GEA_RTC_FIELD(fields, usernameFragment, [&](const auto& v) { result.usernameFragment = v; });
    GEA_RTC_FIELD(fields, relayProtocol, [&](const auto& v) { result.relayProtocol = v; });
    GEA_RTC_FIELD(fields, url, [&](const auto& v) { result.url = v; });
  });
  return gea::host::RTCIceCandidate(std::move(result));
}
inline gea::host::RTCIceCandidate createCandidate() { return createCandidate(gea::Undefined{}); }

class DescriptionSnapshot {
 public:
  explicit DescriptionSnapshot(std::optional<gea::host::RTCSessionDescriptionObject> value) : value_(std::move(value)) {}
  operator gea::host::RTCSessionDescriptionObject() const {
    return value_.value_or(gea::host::RTCSessionDescriptionObject{});
  }
  template <typename Fields> operator gea::Ref<Fields>() const {
    if (!value_) return {};
    auto description = gea::makeRef<Fields>();
    assignDescription(*description, value_->type(), value_->sdp());
    return description;
  }

 private:
  std::optional<gea::host::RTCSessionDescriptionObject> value_;
};
inline DescriptionSnapshot localDescription(const gea::host::RTCPeerConnection& peer) { return DescriptionSnapshot(peer.localDescription()); }
inline DescriptionSnapshot remoteDescription(const gea::host::RTCPeerConnection& peer) { return DescriptionSnapshot(peer.remoteDescription()); }
inline DescriptionSnapshot descriptionJson(const gea::host::RTCSessionDescriptionObject& object) { return DescriptionSnapshot(object); }

template <typename Init>
gea::host::RTCSessionDescriptionObject createDescription(const Init& init) {
  gea::host::RTCSessionDescription result;
  present(init, [&](const auto& fields) {
    present(fields.type, [&](const auto& value) { result.type = value; });
    GEA_RTC_FIELD(fields, sdp, [&](const auto& value) { result.sdp = value; });
  });
  return gea::host::RTCSessionDescriptionObject(std::move(result));
}

template <typename Config>
gea::host::RTCPeerConnection createPeer(const Config& config) {
  gea::host::RTCConfiguration result;
  present(config, [&](const auto& fields) {
    GEA_RTC_FIELD(fields, iceTransportPolicy, [&](const auto& v) { result.iceTransportPolicy = v; });
    GEA_RTC_FIELD(fields, iceServers, [&](const auto& servers) {
      for (size_t i = 0; i < servers.size(); ++i) present(servers.at(i), [&](const auto& server) {
        gea::host::RTCIceServer native;
        present(server.urls, [&](const auto& urls) {
          if constexpr (std::is_same_v<std::decay_t<decltype(urls)>, std::string>) native.urls.push_back(urls);
          else for (size_t j = 0; j < urls.size(); ++j) native.urls.push_back(urls.at(j));
        });
        GEA_RTC_FIELD(server, username, [&](const auto& v) { native.username = v; });
        GEA_RTC_FIELD(server, credential, [&](const auto& v) { native.credential = v; });
        result.iceServers.push_back(std::move(native));
      });
    });
  });
  try { return gea::host::RTCPeerConnection(gea::host::rtc::create_handle(result)); }
  catch (const std::invalid_argument& error) { gea::host::throwRuntimeError("TypeError", error.what()); }
  catch (const std::exception& error) { gea::host::throwRuntimeError("Error", error.what()); }
}
inline gea::host::RTCPeerConnection createPeer() { return gea::host::RTCPeerConnection(gea::host::rtc::create_handle()); }

template <typename Init>
gea::host::RTCDataChannel createDataChannel(const gea::host::RTCPeerConnection& peer, const std::string& label, const Init& init) {
  gea::host::RTCDataChannelInit result;
  present(init, [&](const auto& fields) {
    GEA_RTC_FIELD(fields, ordered, [&](auto v) { result.ordered = v; });
    GEA_RTC_FIELD(fields, negotiated, [&](auto v) { result.negotiated = v; });
    GEA_RTC_FIELD(fields, protocol, [&](const auto& v) { result.protocol = v; });
    GEA_RTC_FIELD(fields, id, [&](auto v) { result.id = v; });
    GEA_RTC_FIELD(fields, maxRetransmits, [&](auto v) { result.maxRetransmits = v; });
    GEA_RTC_FIELD(fields, maxPacketLifeTime, [&](auto v) { result.maxPacketLifeTime = v; });
  });
  return peer.createDataChannel(label, result);
}
inline gea::host::RTCDataChannel createDataChannel(const gea::host::RTCPeerConnection& peer, const std::string& label) {
  return peer.createDataChannel(label);
}
template <typename Track, typename Init>
gea::host::RTCRtpTransceiver addTransceiver(const gea::host::RTCPeerConnection& peer, const Track& track, const Init& init) {
  gea::host::RTCRtpTransceiverInit options;
  present(init, [&](const auto& fields) {
    GEA_RTC_FIELD(fields, direction, [&](const auto& v) { options.direction = v; });
  });
  gea::host::RTCRtpTransceiver result;
  present(track, [&](const auto& v) { result = peer.addTransceiver(v, options); });
  return result;
}
template <typename Track>
gea::host::RTCRtpTransceiver addTransceiver(const gea::host::RTCPeerConnection& peer, const Track& track) {
  return addTransceiver(peer, track, gea::host::RTCRtpTransceiverInit{});
}
template <typename Track>
gea::Promise<void> replaceTrack(const gea::host::RTCRtpSender& sender, const Track& track) {
  gea::host::MediaStreamTrack result;
  present(track, [&](const auto& v) { result = v; });
  sender.replaceTrack(result);
  return gea::Promise<void>::settled_value();
}
inline void send(const gea::host::RTCDataChannel& channel, const std::string& bytes) { channel.send(bytes); }
template <size_t N> void send(const gea::host::RTCDataChannel& channel, const char (&bytes)[N]) {
  channel.send(std::string(bytes, N - 1));
}
inline void send(const gea::host::RTCDataChannel& channel, const gea::Ref<gea::ArrayBuffer>& bytes) {
  channel.send(std::vector<uint8_t>(bytes->begin(), bytes->end()));
}
template <typename Bytes>
void send(const gea::host::RTCDataChannel& channel, const Bytes& bytes) {
  if constexpr (requires { Bytes::arity; bytes.index(); }) {
    [&]<std::size_t... I>(std::index_sequence<I...>) {
      ((bytes.index() == I ? (send(channel, bytes.template get<I>()), 0) : 0), ...);
    }(std::make_index_sequence<Bytes::arity>{});
  } else {
    gea::detail::HostNumericArgument<uint8_t> data(bytes);
    channel.send(std::vector<uint8_t>(data.data(), data.data() + data.size()));
  }
}
template <typename R> void notify(const gea::CallableObject<R()>& handler) { handler.call(); }
template <typename R, typename E> void notify(const gea::CallableObject<R(E)>& handler) { handler.call(hostevent::makeEvent<E>()); }

#define GEA_RTC_VOID_HANDLER(Name, Owner, Slot) \
  template <typename H> void Name(const Owner& owner, const H& handler) { \
    auto& slot = Slot; slot = nullptr; \
    present(handler, [&](const auto& fn) { slot = [fn] { notify(fn); }; }); \
  }
GEA_RTC_VOID_HANDLER(setChannelOnOpen, gea::host::RTCDataChannel, gea::host::rtc::channel_callbacks(owner.nativeHandle).on_open)
GEA_RTC_VOID_HANDLER(setChannelOnClose, gea::host::RTCDataChannel, gea::host::rtc::channel_callbacks(owner.nativeHandle).on_close)
GEA_RTC_VOID_HANDLER(setChannelOnLow, gea::host::RTCDataChannel, gea::host::rtc::channel_callbacks(owner.nativeHandle).on_buffered_amount_low)
GEA_RTC_VOID_HANDLER(setPeerOnSignaling, gea::host::RTCPeerConnection, gea::host::rtc::callbackTable()[owner.nativeHandle].on_signaling_state_change)
GEA_RTC_VOID_HANDLER(setPeerOnNegotiation, gea::host::RTCPeerConnection, gea::host::rtc::callbackTable()[owner.nativeHandle].on_negotiation_needed)
#undef GEA_RTC_VOID_HANDLER

template <typename R, typename E>
void channelMessage(const gea::CallableObject<R(E)>& fn, const std::vector<uint8_t>& bytes, bool text) {
  E event = hostevent::makeEvent<E>();
  if (text) hostevent::assign(hostevent::eventFields(event).data, std::string(bytes.begin(), bytes.end()));
  else hostevent::assign(hostevent::eventFields(event).data, gea::makeRef<gea::ArrayBuffer>(bytes.begin(), bytes.end()));
  fn.call(event);
}
template <typename R>
void channelMessage(const gea::CallableObject<R()>& fn, const std::vector<uint8_t>&, bool) { fn.call(); }
template <typename H>
void setChannelOnMessage(const gea::host::RTCDataChannel& channel, const H& handler) {
  auto& slot = gea::host::rtc::channel_callbacks(channel.nativeHandle).on_message;
  slot = nullptr;
  present(handler, [&](const auto& fn) { slot = [fn](const auto& bytes, bool text) { channelMessage(fn, bytes, text); }; });
}
template <typename R, typename E>
void peerDataChannel(const gea::CallableObject<R(E)>& fn, gea::host::RTCDataChannel channel) {
  E event = hostevent::makeEvent<E>();
  hostevent::assign(hostevent::eventFields(event).channel, channel);
  fn.call(event);
}
template <typename R> void peerDataChannel(const gea::CallableObject<R()>& fn, gea::host::RTCDataChannel) { fn.call(); }
template <typename H>
void setPeerOnDataChannel(const gea::host::RTCPeerConnection& peer, const H& handler) {
  auto& slot = gea::host::rtc::callbackTable()[peer.nativeHandle].on_data_channel;
  slot = nullptr;
  present(handler, [&](const auto& fn) { slot = [fn](auto channel) { peerDataChannel(fn, channel); }; });
}
template <typename R, typename E>
void peerTrack(const gea::CallableObject<R(E)>& fn, const gea::host::RTCTrackEvent& track) {
  if constexpr (std::is_same_v<E, gea::host::RTCTrackEvent>) fn.call(track);
  else {
    E event = hostevent::makeEvent<E>();
    auto& fields = hostevent::eventFields(event);
    hostevent::assign(fields.track, track.track());
    hostevent::assign(fields.streams, track.streams());
    if constexpr (requires { fields.receiver; }) hostevent::assign(fields.receiver, track.receiver());
    if constexpr (requires { fields.transceiver; }) hostevent::assign(fields.transceiver, track.transceiver());
    fn.call(event);
  }
}
template <typename R>
void peerTrack(const gea::CallableObject<R()>& fn, const gea::host::RTCTrackEvent&) { fn.call(); }
template <typename H>
void setPeerOnTrack(const gea::host::RTCPeerConnection& peer, const H& handler) {
  auto& slot = gea::host::rtc::callbackTable()[peer.nativeHandle].on_track;
  slot = nullptr;
  present(handler, [&](const auto& fn) { slot = [fn](const auto& track) { peerTrack(fn, track); }; });
}

#undef GEA_RTC_FIELD
