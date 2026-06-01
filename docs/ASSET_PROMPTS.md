# Placeholder Art Prompts — Robo Picto Style

The game generates **all** of its visuals procedurally, so it needs no image
files to run. These prompts are here for when you want to commission or
generate hand-drawn art (title splash, store page, marketing, optional texture
swaps) that matches the mascot exactly.

## Master style suffix

Append this to **every** prompt for consistency:

> *...in the style of a vintage comic-shop mascot sticker: thick bold black
> outlines, flat screen-print colors, limited palette of white, black, comic
> red (#e23446), navy blue (#1d2660), cornflower blue (#4f6dd6), cream
> (#f4ecd8) and pulpy gold (#ffd54a), minimal gradients, cel-shaded, vintage
> comic-book linework, friendly retro Nintendo-64-era mascot energy, sticker
> die-cut look, NOT realistic, NOT gritty, NOT photorealistic.*

---

## 1. Title / Loading splash
> A grinning skeleton astronaut in a white space suit zooming on a rounded
> cartoon spaceship over a stylized cartoon Boston skyline (Prudential Tower,
> the Zakim Bridge, Fenway's light towers), clutching a stack of vintage comic
> books, big hand-lettered logo reading "SPACE RUNNER BOSTON", starbursts and
> comic speed lines. *(style suffix)*

Drop-in: replace the CSS title treatment in `src/ui/TitleScreen.tsx`, or set as
a full-bleed background on `.overlay`.

## 2. Player ship (concept / hero render)
> A cute low-poly racing spaceship, rounded white body with red and blue
> accents, swept delta wings with red tips, a glowing engine, and a cockpit
> shaped like a skeleton astronaut's space helmet with a bony skull grinning
> through a navy visor, three-quarter hero view. *(style suffix)*

Reference for refining `src/game/ship/Ship.ts`.

## 3. Comic collectible covers (4 variants)
> A floating vintage comic book cover, bold title bar across the top, a circular
> character splash in the center, a price/grade star in the corner, aged paper
> edges — make four: a blue "Silver Age" sci-fi cover, a gold "Golden Age"
> hero cover, a red team "Mutant Squad" cover, and a navy "Fantastic Quartet"
> cover. Generic original characters only, no real trademarks. *(style suffix)*

Drop-in: bake to small textures and map onto the `COVER_GEO` faces in
`src/game/entities/Comic.ts`.

## 4. Obstacles (sprite sheet)
> Five cartoon hazards on a transparent background: a chubby grey Boston pigeon
> mid-flap, a yellow construction crane with a swinging load, a green flying
> MBTA trolley car with little red wings, a white comic-shop bag with a red
> "COMICS" band and a gold star, and a red-and-white striped traffic balloon.
> *(style suffix)*

## 5. Landmarks key art (for a map/legend)
> A cartoon illustrated map icon set of Boston landmarks: Fenway Park with the
> Green Monster, the Prudential Tower, the Zakim cable-stayed bridge with its
> inverted-Y towers, TD Garden arena, Logan Airport control tower, the gold-domed
> State House, and the blue Charles River. *(style suffix)*

## 6. HOLY GRAIL MODE burst
> An explosive comic-book starburst with hand-lettered "HOLY GRAIL!" text, gold
> and red rays, speed lines radiating outward, halftone dots. *(style suffix)*

---

## Audio

Audio is fully procedural (`src/game/audio/Audio.ts`). If you want recorded
audio instead, source/commission:

- **Music:** an upbeat **surf-rock instrumental** loop (reverb-drenched twangy
  guitar, walking bass, driving backbeat), ~115 BPM, seamless loop.
- **SFX:** comic page flip, cash-register ding, arcade boost whoosh, cartoon
  pop, checkpoint chime, crash, victory fanfare.

Wire recorded clips by swapping the `tone()`/`noise()` calls in the named SFX
methods for `AudioBufferSourceNode` playback of decoded files.
