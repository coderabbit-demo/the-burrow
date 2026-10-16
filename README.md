# THE BURROW

A dark, top-down Soulslike vignette starring the CodeRabbit rabbit. Two zones, a Grace-style checkpoint system, stamina combat, and a three-phase Bug boss called **The Devourer**.

All visuals are generated from code — no external image files.

## Run

```sh
cd the-burrow
npx serve .         # or: python3 -m http.server 8000
```

Open the served URL (e.g. `http://localhost:3000`) in Chrome or Safari.

## Controls

| Key | Action |
|---|---|
| `WASD` / Arrow keys | Move |
| `J` | Light attack |
| `K` | Heavy attack |
| `Shift` | Dodge-roll (i-frames) |
| `L` | Toggle lock-on |
| `Tab` | Cycle lock-on target |
| `F` | Drink Carrot Flask (heal) |
| `G` | Drink Two-Heart Potion (120 HP, capped at maximum) |
| `E` | Rest at Grace Lantern |
| `Enter` | Start (title screen) |

## The Run

1. **The Forsaken Warren** — wake at the first Grace. Slay grubs, find the **Bone Key** in the side chamber.
2. **The Sunken Choir** — broken pillars and bone piles. Find the optional **Ember of the Hollow** to widen your light. Pass through the gate to the boss.
3. **Bug's Hollow** — fight **The Devourer** through three phases. Don't get hit by the dive in phase 3.

Death drops your unspent runes at the kill spot — recover them on the next attempt.

## Tech

- Phaser 3 (via CDN, no build step).
- ES modules.
- Pixel sprites defined as 2D color-index arrays in `src/sprites/spriteData.js`, rendered to Phaser textures at boot via `src/sprites/spriteFactory.js`.

## Credits

Made for Juan @ CodeRabbit. The rabbit is theirs; the bug is ours.
