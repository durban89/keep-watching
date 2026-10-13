# KeepWatching

Enjoy a cleaner, uninterrupted viewing experience on video sites.

A browser extension built with [WXT](https://wxt.dev) + React + TypeScript +
Tailwind CSS v4 that skips video ads, hides banner/overlay ads and silences the
player while an ad is playing.

## Features

- Skip video ads: clicks the skip button as soon as it appears and fast-forwards
  unskippable pre-roll / mid-roll ads
- Hide banner ads: masthead, sidebar, in-feed and in-player overlay ads
- Mute during ads: silences the player while an ad plays, then restores
- `MutationObserver` + polling for dynamically injected ads (SPA friendly)
- Global on/off switch and per-feature toggles
- Block statistics and toolbar badge
- Works on watch pages, Shorts, home feed, search and channel pages
- Stack: MV3, WXT 0.21, React 19, Vite 8, Tailwind v4

## Requirements

- Node.js 20+
- pnpm

## Development

```sh
pnpm install
pnpm dev
```

The browser opens automatically with the extension loaded and supports HMR.

```sh
pnpm dev:firefox   # Firefox
```

## Build

```sh
pnpm build         # build for Chrome
pnpm build:firefox

pnpm zip           # package for release
```

Output goes to `.output/`; the unpacked extension lives in `.output/chrome-mv3/`
(load it via `chrome://extensions` → enable Developer mode → Load unpacked).

## Project Structure

```plaintext
entrypoints/       # entrypoints (background / content / popup / options)
components/        # React components
hooks/             # React hooks
utils/             # storage and settings
public/icon/       # icons
```

Ad handling happens in the content script (`entrypoints/content.ts`): a small
style sheet hides ad containers on the page while a timer and a
`MutationObserver` detect `.ad-showing`, click skip buttons and fast-forward
the player. Settings are storage-backed in `utils/settings.ts` and shared by the
popup, options page and background script.

## Notes

This project is for educational/demo purposes. Video sites change their ad
markup regularly; the selectors in `entrypoints/content.ts` cover common cases
and can be extended as needed.

## License

Licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE)
(AGPL-3.0-or-later).

Copyright (C) 2026 Daniel Zhang

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version. It is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.
