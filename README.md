# Spotify Player Extension

A lightweight Chrome browser extension that puts a Spotify "now playing" widget in your toolbar. It lets you see the current track and control playback without switching to the Spotify tab or app.

![Spotify green](https://img.shields.io/badge/Spotify-1DB954?style=flat&logo=spotify&logoColor=white)

## Features

- **Connect with Spotify** via OAuth (implicit grant flow), no backend server required
- **Now playing view**: album art, track title, and artist.
- **Playback controls**: play/pause, next, previous.
- **Seekable timeline**: click or drag the playhead to jump to a position in the track.
- **Auto-refresh**: polls Spotify every couple of seconds to stay in sync with what's playing.
- **Contextual views**: shows a connect screen when signed out, and an "open Spotify and start playing" screen when nothing is currently playing.

## How it works

This is a Manifest V2 Chrome extension (`manifest.json`) with a popup UI (`popup.html` + `js/popup.js`) built with jQuery and Bootstrap.

1. Clicking the connect button starts `chrome.identity.launchWebAuthFlow` against Spotify's authorize endpoint, requesting the `user-read-currently-playing` and `user-modify-playback-state` scopes.
2. The returned access token is parsed out of the redirect URL and cached in `chrome.storage.local`, so you stay signed in between popup opens.
3. The popup polls the [Spotify Web API](https://developer.spotify.com/documentation/web-api) (`/me/player/currently-playing`, `/me/player/next`, `/me/player/previous`, `/me/player/play`, `/me/player/pause`, `/me/player/seek`) using the cached token to display and control playback.
4. If the token expires (HTTP 401), the extension drops back to the connect view so the user can re-authenticate.

## Requirements

- Google Chrome (or another Chromium-based browser that supports Manifest V2 extensions).
- An active Spotify account with an open, active playback session (playing from the Spotify app or web player) — the Spotify Web API only reports/controls playback on a device that's already active. Spotify Premium is required to use the playback control endpoints (play/pause/seek/skip).

## Installation (unpacked / developer mode)

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Pin the extension and click its icon to open the popup.
6. Click the Spotify button to connect your account, then start playing something in Spotify.

## Project structure

```
.
├── manifest.json         # Extension manifest (permissions, popup entry point)
├── popup.html            # Popup markup (loading / connect / player / empty states)
├── js/
│   └── popup.js          # App logic: auth, Spotify API calls, UI state, playhead dragging
├── style/                # Popup styling (base, connect screen, player screen)
├── img/                  # Icons and default artwork used by the popup
└── fonts/                # Open Sans font files
```

## Notes

This project was one of my early extensions, built while learning web development. It's a small, self-contained example of using the Spotify Web API and Chrome's `identity`/`storage` APIs from a browser extension.
