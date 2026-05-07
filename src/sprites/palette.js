// 16-color indexed palette. Index 0 is transparent.
// In sprite strings, each character is one palette index (hex 0..f).
export const PALETTE = [
  null,        // 0 transparent
  '#0b0a10',   // 1 deepest shadow
  '#1a1722',   // 2 ground shadow
  '#2b2436',   // 3 stone dark
  '#3d3450',   // 4 stone mid
  '#5a4a6b',   // 5 stone light / cloth
  '#7d6b8a',   // 6 highlight cloth
  '#a89bb0',   // 7 rabbit fur mid
  '#d8cfd9',   // 8 rabbit fur light / bone
  '#241a1a',   // 9 dried blood
  '#7a1f24',   // a boss carapace / blood
  '#c1474d',   // b wound / boss eye
  '#2a3f2a',   // c sickly moss
  '#5a7a3a',   // d corrupted growth
  '#c9a449',   // e rune gold
  '#f0d76a',   // f flame highlight
];

export const PALETTE_INT = PALETTE.map((c) => {
  if (c == null) return null;
  return parseInt(c.slice(1), 16);
});
