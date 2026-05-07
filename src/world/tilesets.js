// Tile metadata. Tiles themselves are pixel-defined in src/sprites/spriteData.js
// under TILES. Here we just declare which tiles are walkable vs solid.

export const TILE_TYPES = {
  '.': { key: 'tile_dirt',          solid: false },
  ',': { key: 'tile_dirt2',         solid: false },
  's': { key: 'tile_stone',         solid: false },
  'm': { key: 'tile_mossy_stone',   solid: false },
  'c': { key: 'tile_cracked_stone', solid: false },
  'b': { key: 'tile_blood_floor',   solid: false },
  '~': { key: 'tile_water',         solid: true  },
  'V': { key: 'tile_void',          solid: true  },
  '#': { key: 'tile_wall_stone',    solid: true  },
  'r': { key: 'tile_wall_root',     solid: true  },
  'B': { key: 'tile_wall_bone',     solid: true  },
};

export const SOLID_CHARS = new Set(
  Object.entries(TILE_TYPES).filter(([, v]) => v.solid).map(([k]) => k)
);
