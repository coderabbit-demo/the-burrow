# THE BURROW — Docs

Player-facing documentation built with [Mintlify](https://mintlify.com).

## Preview locally

```sh
cd docs
npx mintlify@latest dev
# opens http://localhost:3000
```

If you'd rather install globally:

```sh
npm i -g mintlify
mintlify dev
```

## Structure

- `docs.json` — site config (theme, navigation, colors).
- `introduction.mdx`, `quickstart.mdx`, `controls.mdx` — getting started.
- `mechanics/` — combat, stamina, dodge-roll, lock-on, grace, runes & death.
- `world/` — the five zones from spawn to boss.
- `enemies/` — bestiary and the Devourer's three-phase fight.
- `items/` — flask, key, ember, rune shard, lantern, the boss drop.

## Publishing

This folder is ready for [Mintlify's hosted platform](https://dashboard.mintlify.com).
Connect the GitHub repo, point it at `docs/`, and the site auto-rebuilds on push.
