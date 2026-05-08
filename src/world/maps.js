// Map definitions. Each map has:
//   tiles: array of strings (one row per line). Char codes match TILE_TYPES.
//   spawn: { x, y } in tile coordinates (player start).
//   entities: array of { type, x, y, [args] }.
//
// Tile chars:
//   . = dirt        , = dirt variant   s = stone        m = mossy stone
//   c = cracked     b = blood floor    ~ = water (solid) V = void (solid)
//   # = wall stone  r = wall root      B = wall bone
//
// Entity types:
//   grub, spider, grace, flask, key, ember, gate, transition, prop:<name>
//
// "transition" is a trigger zone that loads another map.
// "gate" is a solid that opens once a flag is set.

const A1 = [
  '################################',
  '#.....,........................#',
  '#.,...........,...,.....,......#',
  '#.....,......,........,........#',
  '#.....,...,..........,.........#',
  '#.,..........,.........,......,#',
  '#.....,..............,.........#',
  '#..,.....mmmmmmmm....,.........#',
  '#........mssssssm....,.........#',
  '#..,.....msscssm....,.....,....#',
  '#........msscssm.....,.........#',
  '#.....,..msssssm.........,.....#',
  '#........mssscsm....,..........#',
  '#..,.....mmmmmmmm.,......,...,.#',
  '#.....,..........,.............#',
  '#.,...........,........,.....,.#',
  '#######rrrrrrrrr################',
];

const A1_KEYROOM = [
  '##############',
  '#............#',
  '#..,.....,...#',
  '#............#',
  '#....,.......#',
  '#............#',
  '#.....,......#',
  '#............#',
  '##rrrrrrrrrr##',
];

// Area 2 — wider, more pillars and props
const A2 = [
  '##################################',
  '#............,...,...............#',
  '#..s..s....,........s..s.........#',
  '#............,......,............#',
  '#.,........,.........s..s..,.....#',
  '#......,.s..............,........#',
  '#............,...................#',
  '#......,...........,...,.,.......#',
  '#.s.s..............s..s..........#',
  '#..,........mmmmmmmm......,......#',
  '#...........mssssssm.............#',
  '#......,....msccssm.....,........#',
  '#...........msssssm..............#',
  '#......s..s.mmmmmmmm....s..s.....#',
  '#............,...................#',
  '#..,...........,........,........#',
  '#.,......b.........bbb...........#',
  '#......bbbbb......bbbbb..........#',
  '#......bbbbb.......bbb...........#',
  '#.,..............................#',
  '#.....s..s....,........s..s......#',
  '#######BBBBBBBBBBBBBB#############',
];

// Antechamber — chamber between the Sunken Choir and the boss arena. A
// dormant rune-switch sits on a raised stone platform; pressing it opens the
// way into Bug's Hollow.
const ANTE = [
  '############################',
  '#..........................#',
  '#..,......................,#',
  '#............................'.slice(0, 28),
  '#..........mmmmmmm.........#',
  '#..........msssssm.........#',
  '#..........mscccsm.........#',
  '#..........mscccsm.........#',
  '#..........mscccsm.........#',
  '#..........msssssm.........#',
  '#..........mmmmmmm.........#',
  '#..........................#',
  '#..,......................,#',
  '#............,.............#',
  '#..........................#',
  '##rrrrrrrrrrrrrrrrrrrrrrrr##',
];

// Boss arena — 20 cols × 18 rows. Bone-wall ring, cracked stone interior,
// blood-stained center where the boss makes its lair.
const A3 = [
  '####################',
  '#BBBBBBBBBBBBBBBBBB#',
  '#BccccccccccccccccB#',
  '#BccssssssssssssccB#',
  '#BcsbbbbbbbbbbbbscB#',
  '#Bcsbcccccccccccbsc#',
  '#Bcsbcccbbbbbbcccbs#',
  '#Bcsbcccbbbbbbcccbs#',
  '#Bcsbcccbbbbbbcccbs#',
  '#Bcsbcccbbbbbbcccbs#',
  '#Bcsbcccccccccccbsc#',
  '#BcsbbbbbbbbbbbbscB#',
  '#BccssssssssssssccB#',
  '#BccccccccccccccccB#',
  '#BBBBBBBBBBBBBBBBBB#',
  '####################',
  '####################',
  '####################',
];

// Trim every map: ensure rectangular by padding rows to max width.
function rectify(rows) {
  let w = 0;
  for (const r of rows) if (r.length > w) w = r.length;
  return rows.map((r) => r.padEnd(w, '#'));
}

export const MAPS = {
  area1: {
    tiles: rectify(A1),
    spawn: { x: 12, y: 10 }, // near the central grace lantern
    entities: [
      { type: 'grace',  x: 13, y: 10, id: 'a1_grace' },
      { type: 'grub',   x: 5,  y: 4 },
      { type: 'grub',   x: 27, y: 4 },
      { type: 'grub',   x: 4,  y: 13 },
      { type: 'grub',   x: 27, y: 14 },
      { type: 'spider', x: 23, y: 5 },
      { type: 'spider', x: 6,  y: 14 },
      { type: 'flask',  x: 14, y: 10 },
      { type: 'prop:tombstone',         x: 3,  y: 5 },
      { type: 'prop:tombstone_cracked', x: 4,  y: 5 },
      { type: 'prop:tombstone',         x: 28, y: 12 },
      { type: 'prop:dead_tree',         x: 8,  y: 3 },
      { type: 'prop:dead_tree',         x: 22, y: 3 },
      { type: 'prop:dead_tree',         x: 6,  y: 11 },
      { type: 'prop:mushroom',          x: 16, y: 14 },
      { type: 'prop:mushroom',          x: 19, y: 14 },
      { type: 'prop:fungus_pod',        x: 24, y: 10 },
      { type: 'prop:fungus_pod',        x: 7,  y: 8 },
      { type: 'prop:bone_pile',         x: 11, y: 14 },
      { type: 'prop:root_tendril',      x: 9,  y: 16, decoration: true },
      { type: 'prop:root_tendril',      x: 13, y: 16, decoration: true },
      { type: 'prop:root_tendril',      x: 17, y: 16, decoration: true },
      { type: 'prop:root_tendril',      x: 21, y: 16, decoration: true },
      // exit south to area2 (when key is found)
      { type: 'gate', x: 15, y: 16, requires: 'bone_key', target: 'area2', toX: 16, toY: 1 },
      // side door north to keyroom
      { type: 'transition', x: 15, y: 0, target: 'area1_keyroom', toX: 7, toY: 7 },
    ],
  },

  area1_keyroom: {
    tiles: rectify(A1_KEYROOM),
    spawn: { x: 7, y: 7 },
    entities: [
      { type: 'spider', x: 4, y: 4 },
      { type: 'spider', x: 9, y: 4 },
      { type: 'key',    x: 7, y: 3 },
      { type: 'prop:web_decal',   x: 2, y: 2, decoration: true },
      { type: 'prop:web_decal',   x: 11, y: 2, decoration: true },
      { type: 'prop:bone_pile',   x: 7, y: 6 },
      { type: 'prop:blood_decal', x: 5, y: 5, decoration: true },
      { type: 'gate', x: 7, y: 8, requires: 'clear', target: 'area1', toX: 15, toY: 1 },
    ],
  },

  area2: {
    tiles: rectify(A2),
    spawn: { x: 16, y: 1 },
    entities: [
      { type: 'grace',  x: 16, y: 11, id: 'a2_grace' },
      { type: 'grub',   x: 5,  y: 4 },
      { type: 'grub',   x: 28, y: 4 },
      { type: 'grub',   x: 6,  y: 14 },
      { type: 'grub',   x: 27, y: 14 },
      { type: 'grub',   x: 14, y: 6 },
      { type: 'grub',   x: 18, y: 7 },
      { type: 'spider', x: 4,  y: 9 },
      { type: 'spider', x: 28, y: 9 },
      { type: 'spider', x: 9,  y: 18 },
      { type: 'spider', x: 24, y: 18 },
      { type: 'ember',  x: 8,  y: 17 },
      { type: 'flask',  x: 25, y: 11 },
      { type: 'prop:pillar',           x: 3,  y: 3 },
      { type: 'prop:pillar',           x: 30, y: 3 },
      { type: 'prop:pillar',           x: 3,  y: 18 },
      { type: 'prop:pillar',           x: 30, y: 18 },
      { type: 'prop:tombstone',        x: 6,  y: 6 },
      { type: 'prop:tombstone_cracked',x: 27, y: 6 },
      { type: 'prop:bone_pile',        x: 16, y: 4 },
      { type: 'prop:bone_pile',        x: 13, y: 18 },
      { type: 'prop:bone_pile',        x: 20, y: 18 },
      { type: 'prop:dead_tree',        x: 11, y: 3 },
      { type: 'prop:dead_tree',        x: 23, y: 3 },
      { type: 'prop:web_decal',        x: 4,  y: 2, decoration: true },
      { type: 'prop:web_decal',        x: 30, y: 2, decoration: true },
      { type: 'prop:fungus_pod',       x: 16, y: 16 },
      { type: 'prop:mushroom',         x: 12, y: 13 },
      { type: 'prop:mushroom',         x: 21, y: 13 },
      { type: 'prop:spike_trap',       x: 14, y: 18 },
      { type: 'prop:spike_trap',       x: 19, y: 18, hazard: true },
      { type: 'gate', x: 16, y: 21, requires: null, target: 'antechamber', toX: 13, toY: 1 },
    ],
  },

  antechamber: {
    tiles: rectify(ANTE),
    spawn: { x: 13, y: 1 },
    entities: [
      { type: 'switch',  x: 14, y: 7, id: 'boss_switch' },
      { type: 'spider',  x: 4,  y: 4 },
      { type: 'spider',  x: 23, y: 4 },
      { type: 'grub',    x: 6,  y: 12 },
      { type: 'grub',    x: 21, y: 12 },
      { type: 'prop:tombstone',         x: 3,  y: 3 },
      { type: 'prop:tombstone_cracked', x: 24, y: 3 },
      { type: 'prop:bone_pile',         x: 3,  y: 12 },
      { type: 'prop:bone_pile',         x: 24, y: 12 },
      { type: 'prop:fungus_pod',        x: 6,  y: 7 },
      { type: 'prop:fungus_pod',        x: 21, y: 7 },
      { type: 'prop:web_decal',         x: 2,  y: 1, decoration: true },
      { type: 'prop:web_decal',         x: 25, y: 1, decoration: true },
      { type: 'prop:blood_decal',       x: 14, y: 12, decoration: true },
      { type: 'prop:root_tendril',      x: 8,  y: 15, decoration: true },
      { type: 'prop:root_tendril',      x: 14, y: 15, decoration: true },
      { type: 'prop:root_tendril',      x: 19, y: 15, decoration: true },
      { type: 'gate', x: 14, y: 15, requires: 'boss_switch', target: 'boss', toX: 10, toY: 13 },
    ],
  },

  boss: {
    tiles: rectify(A3),
    spawn: { x: 10, y: 13 },
    entities: [
      { type: 'boss', x: 10, y: 8 },
    ],
    isBoss: true,
  },
};
