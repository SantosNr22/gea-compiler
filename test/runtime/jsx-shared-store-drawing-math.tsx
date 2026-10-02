//! compile-only
//! emitted-has: gea_present_orbitPhase
import { Component, Store } from '@geastack/core'

// A shared store carries the drawing math (orbit, sonar, ripple, leaf fades) and
// four components read it reactively, calling its methods once per list row and
// per style member. The compile must stay linear in the number of call sites.

class AgentStore extends Store {
  phase = 'idle'
  message = 'Ready when you are.'
  level = 0
  position = 0
  motion = 0
  orbitPhase = 0
  sonarPhase = 0
  rings = [0, 1, 2]
  stars = [0, 1, 2, 3, 4, 5, 6, 7]
  leaves = [0, 1, 2, 3, 4, 5]
  lastFrame = 0
  cells = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  segments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  sideSegments = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

  get notice(): string {
    return this.phase === 'error' || this.phase === 'reconnecting' ? this.message : ''
  }

  get active(): boolean {
    return this.phase !== 'idle' && this.phase !== 'error'
  }

  get speaking(): boolean {
    return this.phase === 'speaking'
  }

  glow(index: number): number {
    const forward = this.position <= 8
    const head = Math.round(forward ? this.position : 16 - this.position)
    const behind = (head - index) * (forward ? 1 : -1)

    // Keep the scanner head at full brightness.
    if (index === head) {
      return 1
    }

    return behind > 0 ? Math.max(0.06, 0.55 - behind * 0.16) : 0.06
  }

  voiceGlow(segment: number, scale: number): number {
    const distance = Math.abs(segment - 8.5)
    const reach = this.level * 9 * scale
    // Fade the outer lamps over a 2.5-segment edge.
    const edge = Math.max(0, Math.min(1, (reach - distance + 1.25) / 2.5))
    const brightness = edge * edge * (3 - 2 * edge)

    return Math.round((0.025 + brightness * Math.min(0.975, this.level * 3)) * 255) / 255
  }

  orbitX(index: number, trail: number = 0): number {
    const direction = index % 2 === 0 ? 1 : -1
    const angle = this.orbitPhase * direction + (Math.floor(index / 2) * Math.PI) / 2 - trail * direction

    return Math.round(160 + Math.cos(angle) * (index % 2 === 0 ? 136 : 95) - 3)
  }

  orbitY(index: number, trail: number = 0): number {
    const direction = index % 2 === 0 ? 1 : -1
    const angle = this.orbitPhase * direction + (Math.floor(index / 2) * Math.PI) / 2 - trail * direction

    return Math.round(116 + Math.sin(angle) * (index % 2 === 0 ? 85 : 56) - 3)
  }

  starOpacity(index: number): number {
    return Math.round((0.5 + Math.sin(this.motion * 1.2 + index * 1.9) * 0.2 + this.level * 0.3) * 255) / 255
  }

  sonarSize(index: number): number {
    return Math.round(28 + ((this.sonarPhase + index / 3) % 1) * 180)
  }

  sonarX(index: number): number {
    return Math.round(112 + Math.cos(this.sonarPhase * Math.PI * 2 - index * 0.07) * 96)
  }

  sonarY(index: number): number {
    return Math.round(112 + Math.sin(this.sonarPhase * Math.PI * 2 - index * 0.07) * 96)
  }

  echoHeight(index: number): number {
    const envelope = Math.max(0, 1 - Math.abs(index - 4) / 5)
    const ripple = 0.55 + Math.sin(this.motion * 12 + index * 0.9) * 0.45

    return Math.round(4 + this.level * envelope * (24 + ripple * 58))
  }

  leafOpacity(index: number): number {
    // Stagger complete leaves: fade in, linger, fade out, then leave an empty
    // branch before the next leaf appears. Geometry never changes with speech.
    const age = (this.motion + 8 - index * 1.1) % 8
    const edge = Math.max(0, Math.min(1, age / 1.2, (6 - age) / 1.8))
    const fade = edge * edge * (3 - 2 * edge)

    return Math.round(fade * 255) / 255
  }
}

const agent = new AgentStore()

class Echo extends Component {
  template(): JSX.Element {
    return (
      <view class="character echo">
        <view class="title">ECHO</view>
        <view class={agent.notice ? 'instrument compact' : 'instrument'}>
          <view class="sonar-field">
            <view class="sonar-axis horizontal-axis" />
            <view class="sonar-axis vertical-axis" />
            <view class="sonar-rim" />
            {agent.sideSegments.map((segment) => (
              <view
                key={segment}
                class="sonar-sweep"
                style={{
                  left: agent.sonarX(segment - 4),
                  top: agent.sonarY(segment - 4),
                  opacity: (14 - segment) / 10
                }}
              />
            ))}
            {agent.rings.map((ring) => (
              <view
                key={ring}
                class="sonar-ring"
                style={{
                  width: agent.sonarSize(ring),
                  height: agent.sonarSize(ring),
                  left: 116 - agent.sonarSize(ring) / 2,
                  top: 116 - agent.sonarSize(ring) / 2,
                  opacity: 1 - (agent.sonarSize(ring) - 28) / 210
                }}
              />
            ))}
            {agent.cells.map((cell) => (
              <view
                key={cell}
                class="echo-wave"
                style={{
                  left: 67 + cell * 11,
                  height: agent.echoHeight(cell),
                  top: 116 - agent.echoHeight(cell) / 2,
                  opacity: agent.speaking ? 0.85 : 0
                }}
              />
            ))}
            <view
              class="sonar-core"
              style={{
                width: 12,
                height: 12,
                left: 110,
                top: 110,
                opacity: agent.speaking ? 0 : 0.85
              }}
            />
          </view>
        </view>
      </view>
    )
  }
}

class Flora extends Component {
  template(): JSX.Element {
    return (
      <view class="character flora">
        <view class="title">FLORA</view>
        <view class={agent.notice ? 'instrument compact' : 'instrument'}>
          <view class="garden-field">
            <view class="plant-stem" />
            {agent.leaves.map((leaf) => (
              <view
                key={leaf}
                class={leaf % 2 === 0 ? 'plant-leaf left-leaf' : 'plant-leaf right-leaf'}
                style={{
                  top: 140 - Math.floor(leaf / 2) * 46,
                  opacity: agent.leafOpacity(leaf)
                }}
              />
            ))}
            <view class="plant-seed" />
            <view class="garden-soil" />
          </view>
        </view>
      </view>
    )
  }
}

class Kitt extends Component {
  template(): JSX.Element {
    return (
      <view class="character kitt">
        <view class="title">KITT</view>
        <view class={agent.notice ? 'instrument compact' : 'instrument'}>
          <view class="voicebox" style={{ display: agent.speaking ? 'flex' : 'none' }}>
            <view class="voice-column">
              {agent.sideSegments.map((segment) => (
                <view key={segment} class="voice-segment" style={{ opacity: agent.voiceGlow(segment, 0.62) }} />
              ))}
            </view>
            <view class="voice-column center-column">
              {agent.segments.map((segment) => (
                <view key={segment} class="voice-segment" style={{ opacity: agent.voiceGlow(segment, 1) }} />
              ))}
            </view>
            <view class="voice-column">
              {agent.sideSegments.map((segment) => (
                <view key={segment} class="voice-segment" style={{ opacity: agent.voiceGlow(segment, 0.62) }} />
              ))}
            </view>
          </view>
          <view class="scanner" style={{ display: agent.speaking ? 'none' : 'flex' }}>
            {agent.cells.map((cell) => (
              <view key={cell} class="cell" style={{ opacity: agent.glow(cell) }} />
            ))}
          </view>
        </view>
      </view>
    )
  }
}

class Nova extends Component {
  template(): JSX.Element {
    return (
      <view class="character nova">
        <view class="title">NOVA</view>
        <view class={agent.notice ? 'instrument compact' : 'instrument'}>
          <view class="orbital-field">
            <view class="orbit-track outer-track" />
            <view class="orbit-track inner-track" />
            {agent.stars.map((star) => (
              <view key={star}>
                <view
                  class="orbit-star star-wake"
                  style={{
                    left: agent.orbitX(star, 0.14),
                    top: agent.orbitY(star, 0.14),
                    opacity: agent.starOpacity(star) * 0.15
                  }}
                />
                <view
                  class="orbit-star star-trail"
                  style={{
                    left: agent.orbitX(star, 0.07),
                    top: agent.orbitY(star, 0.07),
                    opacity: agent.starOpacity(star) * 0.35
                  }}
                />
                <view
                  class="orbit-star"
                  style={{
                    left: agent.orbitX(star),
                    top: agent.orbitY(star),
                    opacity: agent.starOpacity(star)
                  }}
                />
              </view>
            ))}
            <view
              class="nova-halo"
              style={{
                width: 64 + agent.level * 66,
                height: 64 + agent.level * 66,
                left: 128 - agent.level * 33,
                top: 82 - agent.level * 33,
                opacity: 0.25 + agent.level * 0.55
              }}
            />
            <view class="nova-corona" style={{ opacity: 0.15 + agent.level * 0.35 }} />
            <view class="nova-core" style={{ opacity: 0.65 + agent.level * 0.35 }} />
          </view>
        </view>
      </view>
    )
  }
}

const tree = (
  <view>
    <Echo />
    <Flora />
    <Kitt />
    <Nova />
  </view>
)
void tree
