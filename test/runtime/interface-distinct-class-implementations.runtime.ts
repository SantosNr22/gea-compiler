interface Playback {
  play(): string
  stop(): void
}
interface VideoPlayback extends Playback {
  onPlaying(): string
}
class Video implements VideoPlayback {
  private stopped = false
  play(): string {
    return this.stopped ? 'video stopped' : 'video'
  }
  stop(): void {
    this.stopped = true
  }
  onPlaying(): string {
    return 'playing'
  }
}
class AudioPlayback implements Playback {
  private stopped = false
  play(): string {
    return this.stopped ? 'audio stopped' : 'audio'
  }
  stop(): void {
    this.stopped = true
  }
}
class Player {
  private video: VideoPlayback | null = null
  private audio: Playback | null = null
  attach(video: VideoPlayback, audio: Playback): void {
    this.video = video
    this.audio = audio
  }
  play(one: Playback | null): void {
    if (one) console.log(one.play())
  }
  run(): void {
    this.play(this.video)
    this.play(this.audio)
    for (const item of [this.video, this.audio]) item?.stop()
    this.play(this.video)
    this.play(this.audio)
  }
}
const player = new Player()
player.attach(new Video(), new AudioPlayback())
player.run()
//! expect: video
//! expect: audio
//! expect: video stopped
//! expect: audio stopped
