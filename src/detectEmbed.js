// Parses a pasted Spotify/YouTube URL.
//   Spotify -> { service:'spotify', embedSrc }         (plain compact iframe)
//   YouTube -> { service:'youtube', videoId, listId }  (fed to the IFrame API, video hidden)
// Returns null if it isn't a link we recognise.

export function detectEmbed(raw) {
  if (!raw) return null
  let url
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, '')

  // --- Spotify: open.spotify.com/{type}/{id} -> /embed/{type}/{id}
  if (host === 'open.spotify.com') {
    const m = url.pathname.match(
      /\/(?:intl-[a-z]+\/)?(track|album|playlist|artist|show|episode)\/([A-Za-z0-9]+)/,
    )
    if (m) {
      return { service: 'spotify', embedSrc: `https://open.spotify.com/embed/${m[1]}/${m[2]}` }
    }
    return null
  }

  // --- YouTube: return the raw ids so the IFrame API can play audio with the video hidden
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const listId = url.searchParams.get('list')
    const v = url.searchParams.get('v')
    if (url.pathname === '/playlist' && listId) {
      return { service: 'youtube', videoId: null, listId }
    }
    if (url.pathname === '/watch' && v) {
      return { service: 'youtube', videoId: v, listId: listId || null }
    }
    return null
  }

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    if (id) {
      return { service: 'youtube', videoId: id, listId: url.searchParams.get('list') || null }
    }
    return null
  }

  return null
}
