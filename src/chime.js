// A soft two-note chime via Web Audio — no audio file to bundle.
// Called on phase end; the timer was started by a click, so audio is unlocked.

let ctx
export function playChime() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    // gentle bell: two notes, soft attack, long decay
    ;[
      { f: 660, t: 0 },
      { f: 880, t: 0.18 },
    ].forEach(({ f, t }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.0001, now + t)
      gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 1.6)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + t)
      osc.stop(now + t + 1.7)
    })
  } catch {
    // no audio available — visual state change still fires
  }
}
