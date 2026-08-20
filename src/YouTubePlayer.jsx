import { useEffect, useRef, useState } from 'react'

// ponytail: audio-only needs the official IFrame API — there's no attribute to
// hide just the video on a plain embed. We render the embed iframe ourselves
// (a playlist-only YT.Player built from playerVars never initialises its src),
// then attach the API to that existing iframe for volume/play control. The
// iframe stays on-screen as a clipped 1px sliver — fully off-screen media gets
// throttled/paused. tabIndex=-1 keeps it out of the tab order, otherwise Space
// lands inside the iframe and YouTube's own player eats it as pause.

let apiPromise
function loadYT() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  apiPromise =
    apiPromise ||
    new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev && prev()
        resolve(window.YT)
      }
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script')
        s.id = 'yt-iframe-api'
        s.src = 'https://www.youtube.com/iframe_api'
        s.onerror = () => reject(new Error('iframe_api blocked'))
        document.body.appendChild(s)
      }
    })
  return apiPromise
}

const DEFAULT_VOLUME = 70

// A playlist plays via the /videoseries endpoint; a single video (optionally
// inside a playlist) via /embed/<id>. enablejsapi=1 lets us attach the API.
export function buildSrc(videoId, listId) {
  const p = new URLSearchParams({ enablejsapi: '1', autoplay: '1', playsinline: '1' })
  if (videoId) {
    if (listId) p.set('list', listId)
    // a lone video would go silent mid-session; YT's loop needs the id repeated
    else p.set('loop', '1'), p.set('playlist', videoId)
    return `https://www.youtube.com/embed/${videoId}?${p}`
  }
  p.set('list', listId)
  return `https://www.youtube.com/embed/videoseries?${p}`
}

export default function YouTubePlayer({ videoId, listId }) {
  const iframeRef = useRef(null)
  const playerRef = useRef(null)
  const userPaused = useRef(false)
  const nudges = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [title, setTitle] = useState('loading…')
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    let player
    let cancelled = false
    loadYT().then(
      (YT) => {
        if (cancelled || !iframeRef.current) return
        const S = YT.PlayerState
        const pushTitle = (t) => t && setTitle(t)
        player = new YT.Player(iframeRef.current, {
          events: {
            onReady: (e) => {
              e.target.setVolume(DEFAULT_VOLUME)
              pushTitle(e.target.getVideoData().title)
            },
            onStateChange: (e) => {
              if (e.data === S.PLAYING) nudges.current = 0
              // ponytail: YouTube pauses itself after a long idle stretch ("continue
              // watching?") and that prompt is invisible inside the 1px frame — nudge
              // it back unless the user pressed pause. Capped at 3 so an unplayable
              // video can't loop; a pause from OS media keys gets overridden too.
              if (e.data === S.PAUSED && !userPaused.current && nudges.current < 3) {
                nudges.current++
                e.target.playVideo()
                return
              }
              setPlaying(e.data === S.PLAYING || e.data === S.BUFFERING)
              pushTitle(e.target.getVideoData().title)
            },
            onError: () => setTitle("can't play this one — try another link"),
          },
        })
        playerRef.current = player
      },
      () => setTitle('youtube is blocked in this browser'),
    )
    return () => {
      cancelled = true
      if (player && player.destroy) player.destroy()
      playerRef.current = null
    }
  }, [videoId, listId])

  const togglePlay = () => {
    const p = playerRef.current
    if (!p) return
    const live = p.getPlayerState() === window.YT.PlayerState.PLAYING
    userPaused.current = live // only a real click may leave it paused
    live ? p.pauseVideo() : p.playVideo()
  }

  const changeVolume = (v) => {
    const p = playerRef.current
    setVolume(v)
    if (!p) return
    p.setVolume(v)
    if (v === 0) {
      p.mute()
      setMuted(true)
    } else if (muted) {
      p.unMute()
      setMuted(false)
    }
  }

  const toggleMute = () => {
    const p = playerRef.current
    if (!p) return
    if (muted || volume === 0) {
      p.unMute()
      const restored = volume === 0 ? DEFAULT_VOLUME : volume
      p.setVolume(restored)
      setVolume(restored)
      setMuted(false)
    } else {
      p.mute()
      setMuted(true)
    }
  }

  const volIcon = muted || volume === 0 ? '🔇' : volume < 50 ? '🔈' : '🔊'

  return (
    <div className="yt">
      <div className="yt-hidden" aria-hidden="true">
        <iframe
          ref={iframeRef}
          tabIndex="-1"
          title="music"
          src={buildSrc(videoId, listId)}
          width="356"
          height="200"
          frameBorder="0"
          allow="autoplay; encrypted-media"
        />
      </div>

      <div className="yt-top">
        <span className="yt-badge">▶ youtube</span>
        <span className="yt-title" title={title}>
          {title}
        </span>
      </div>

      <div className="yt-bottom">
        <div className="yt-transport">
          {listId && (
            <button className="yt-btn" onClick={() => playerRef.current?.previousVideo()} title="previous">
              ⏮
            </button>
          )}
          <button className="yt-btn yt-play" onClick={togglePlay} title={playing ? 'pause' : 'play'}>
            {playing ? '⏸' : '▶'}
          </button>
          {listId && (
            <button className="yt-btn" onClick={() => playerRef.current?.nextVideo()} title="next">
              ⏭
            </button>
          )}
        </div>

        <div className="yt-volume">
          <button className="yt-btn yt-mute" onClick={toggleMute} title={muted ? 'unmute' : 'mute'}>
            {volIcon}
          </button>
          <input
            className="yt-slider"
            type="range"
            min="0"
            max="100"
            value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            aria-label="volume"
          />
        </div>
      </div>
    </div>
  )
}
