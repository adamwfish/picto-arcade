# 🚀 ROBO PICTO SPACE RUNNER: BOSTON

> *An old-school comic-shop mascot somehow got his own Nintendo 64 racing game.*

A retro **comic-book spaceship racer** set over a stylized 3D recreation of
Boston. The Robo Picto Skeleton Astronaut has stolen a stack of rare comics —
race through a cartoon Boston collecting books, dodging pigeons and trolleys,
and triggering **HOLY GRAIL MODE** to blast toward the finish.

Built with **Three.js + React + TypeScript + Vite**, rendered entirely in the
mascot's screen-print aesthetic: thick black outlines, flat cel-shaded colors,
and a tight white / black / red / blue / cream / gold palette. No photoreal
satellite imagery — every building, road, river, and tree is hand-built,
low-poly, outlined geometry.

---

## ✨ Features

- **Stylized 3D Boston** — geo-referenced from real lat/lng. Recognizable
  landmarks: Fenway Park, Prudential Tower, Boston Common, TD Garden, the
  Zakim Bridge, Logan Airport, and the State House dome, plus the Charles
  River, the harbor, and a real-ish road grid — all redrawn as cartoon
  geometry.
- **Comic / screen-print art** via `MeshToonMaterial` (hard 2–3 step cel
  bands) + inverted-hull black outlines on every mesh.
- **Mascot spaceship** with a skeleton-astronaut **helmet cockpit**, white
  body, red + blue accents, swept wings, and a boost flame.
- **Arcade flight** — easy, forgiving handling (Star Fox / F-Zero feel),
  third-person chase cam with speed-reactive FOV.
- **Vintage comic collectibles** (Silver Age, Golden Age, "Mutant Squad",
  "Fantastic Quartet" — generic, copyright-safe) that fill the
  **"Power of the Collection"** meter.
- **HOLY GRAIL MODE** — when the meter is full, hit boost for a speed surge,
  comic speed lines, a starburst, double score, and obstacle-smashing.
- **Five obstacle types** — flying pigeons, construction cranes, flying MBTA
  trolleys, floating comic-shop bags, and cartoon traffic balloons.
- **Four game modes** — Story, Time Trial, Comic Hunt, Endless Flight.
- **Comic UI** — Bangers/Cinzel/Press Start 2P fonts, speech-bubble HUD
  panels, halftone menus, animated countdown, starburst pops.
- **Fully procedural audio** — Web Audio SFX (page flips, cash-register
  dings, boosts, cartoon pops) + a looping surf-rock instrumental. No audio
  files.
- **Polish** — comic loading screen, animated title, pause menu, restart,
  score multipliers, and a **local leaderboard** (saved to `localStorage`).

---

## 🎮 Controls

| Action            | Keys                          |
| ----------------- | ----------------------------- |
| Steer left/right  | `A` / `D` or `←` / `→`        |
| Throttle up/down  | `W` / `S`                     |
| Climb / dive      | `↑` / `↓`                     |
| Boost / Holy Grail| `Space`                       |
| Brake             | `Shift`                       |
| Pause             | `P` or `Esc`                  |
| Mute              | `M`                           |

On touch devices an on-screen D-pad + BOOST/BRAKE buttons appear automatically.

---

## 🏁 Game Modes

| Mode             | Goal |
| ---------------- | ---- |
| **Story Mode**   | Race the full Boston tour (Fenway → Logan) through gold gates, grabbing comics and beating rival ships before time runs out. |
| **Time Trial**   | Same route, no rivals — just the clock. Set your fastest completion. |
| **Comic Hunt**   | 90 seconds to collect as many rare books as possible. Build streaks for big multipliers. |
| **Endless Flight** | Free-roam the whole cartoon city. No clock, no finish line. |

---

## 🛠️ Tech Stack

- **[Three.js](https://threejs.org/)** — 3D rendering (`MeshToonMaterial`,
  inverted-hull outlines, low-poly procedural geometry).
- **React 18 + TypeScript** — UI shell (menus, HUD, overlays).
- **Vite 5** — dev server + production bundler.

The Three.js engine and the React UI are decoupled: the engine owns the render
loop and exposes a mutable `hud` snapshot + phase/result callbacks; React reads
the HUD on its own animation frame so the component tree never thrashes.

---

## 🚀 Getting Started

Requires **Node 18+** (developed on Node 22).

```bash
# install dependencies
npm install

# run the dev server (hot reload) — http://localhost:5173
npm run dev

# type-check + production build → dist/
npm run build

# preview the production build locally
npm run preview
```

---

## 📦 Deployment

The build is a fully static bundle in `dist/` (`base: './'`, so it works from
any sub-path). See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for one-liners
covering GitHub Pages, Netlify, Vercel, Cloudflare Pages, and plain static
hosting.

---

## 🗂️ Project Structure

```
.
├── index.html                 # Vite entry (loads /src/main.tsx)
├── public/favicon.svg         # Mascot helmet favicon
├── src/
│   ├── main.tsx               # React bootstrap
│   ├── App.tsx                # Phase orchestrator: wires engine ↔ UI
│   ├── styles/global.css      # Comic / screen-print UI skin
│   ├── game/
│   │   ├── Game.ts            # Core engine: scene, loop, modes, collisions
│   │   ├── constants.ts       # Palette, scale, flight/camera/grail tuning
│   │   ├── types.ts           # Shared types
│   │   ├── data/boston.ts     # Real lat/lng → game-grid projection + route
│   │   ├── world/             # World builders (toon materials, outlines)
│   │   │   ├── materials.ts   #   toon() + inverted-hull outline()
│   │   │   ├── geo.ts         #   ribbon/polygon geometry + seeded RNG
│   │   │   ├── World.ts       #   assembles sky, ground, districts, etc.
│   │   │   ├── water.ts       #   Charles River + harbor
│   │   │   ├── roads.ts       #   illustrated road strokes
│   │   │   ├── trees.ts       #   cartoon tree blobs
│   │   │   └── landmarks.ts   #   Fenway, Pru, Zakim, Logan, ...
│   │   ├── ship/Ship.ts       # Mascot spaceship (skull-helmet cockpit)
│   │   ├── entities/
│   │   │   ├── Comic.ts       #   collectible comic books
│   │   │   └── Obstacle.ts    #   pigeon/crane/trolley/bag/balloon
│   │   ├── systems/
│   │   │   ├── Input.ts       #   keyboard + injected touch keys
│   │   │   ├── ChaseCamera.ts #   third-person chase rig
│   │   │   └── spawn.ts       #   route-based comic/obstacle placement
│   │   └── audio/Audio.ts     # Procedural Web Audio SFX + surf-rock loop
│   ├── state/leaderboard.ts   # localStorage high scores
│   └── ui/                    # React overlays (Title, HUD, Results, ...)
├── docs/
│   ├── ASSET_PROMPTS.md       # Image-gen prompts in the mascot style
│   └── DEPLOYMENT.md          # Hosting instructions
└── legacy/space-crossing.html # The original single-file "Space Crossing" game
```

---

## 🎨 Art Direction

Everything obeys the mascot logo style guide:

- **Thick black outlines** — inverted-hull outline mesh on every object
  (`src/game/world/materials.ts → outlined()`).
- **Flat cel colors** — `MeshToonMaterial` driven by a 2–3 step gradient ramp;
  no smooth gradients.
- **Tight palette** — defined once in `src/game/constants.ts → PALETTE`.
- **Bold, readable silhouettes** — landmarks are reduced to their most
  recognizable shape (the Zakim's inverted-Y towers, Fenway's Green Monster,
  the State House dome).

To add a landmark: add an entry to `LANDMARKS` in `data/boston.ts` (with real
lat/lng) and a builder in `world/landmarks.ts`.

---

## 🖼️ Asset Generation Pipeline

The game ships with **zero binary art/audio assets** — all geometry, textures,
and sound are generated procedurally at runtime, which keeps loads instant and
holds 60 FPS without heavy textures.

If you want to add hand-drawn cover art, splash screens, or a real mascot
render, **[docs/ASSET_PROMPTS.md](docs/ASSET_PROMPTS.md)** contains ready-to-use
image-generation prompts tuned to the Robo Picto aesthetic, plus where each
asset would drop in.

---

## ⚖️ Legal / Copyright

All comic collectibles use **generic, original cover art** ("Silver Age",
"Mutant Squad", etc.) to avoid trademark/copyright issues. Boston landmarks are
stylized cartoon parodies built from public geographic coordinates; **no Google
Maps imagery is streamed or stored** — coordinates are used purely as
geographic reference, as intended by the brief.

---

## 🕹️ Bonus: the original arcade game

The repository's original single-file game, **Picto's Space Crossing** (a
Frogger-style arcade hopper that established this mascot palette + procedural
SFX engine), is preserved at [`legacy/space-crossing.html`](legacy/space-crossing.html).
Open it directly in any browser.
