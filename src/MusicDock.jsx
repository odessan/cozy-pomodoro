import { useState } from 'react'
import { detectEmbed } from './detectEmbed.js'
import YouTubePlayer from './YouTubePlayer.jsx'

export default function MusicDock() {
  const [input, setInput] = useState('')
  const [embed, setEmbed] = useState(null)
  const [error, setError] = useState('')

  const load = (e) => {
    e.preventDefault()
    const result = detectEmbed(input)
    if (!result) {
      setError("hmm, couldn't read that — paste a Spotify or YouTube link")
      return
    }
    setError('')
    setEmbed(result)
  }

  const clear = () => {
    setEmbed(null)
    setInput('')
    setError('')
  }

  return (
    <aside className="dock">
      {!embed && (
        <form className="dock-form" onSubmit={load}>
          <p className="dock-title">🎧 bring your own vibe</p>
          <div className="dock-row">
            <input
              className="dock-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="paste a Spotify or YouTube link"
              aria-label="playlist link"
            />
            <button className="btn btn-primary" type="submit">
              play
            </button>
          </div>
          {error && <p className="dock-error">{error}</p>}
        </form>
      )}

      {embed && (
        <div className="player">
          <button className="embed-close" onClick={clear} title="change playlist">
            ✕
          </button>
          {embed.service === 'youtube' ? (
            <YouTubePlayer videoId={embed.videoId} listId={embed.listId} />
          ) : (
            <>
              <iframe
                title="music"
                className="spotify-embed"
                src={embed.embedSrc}
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
              <p className="spotify-note">
                psst — log into Spotify Premium in this browser for full tracks, otherwise you'll hear
                30-sec previews.
              </p>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
