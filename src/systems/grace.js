// Grace bookkeeping. Stores the last lit Grace lantern so death respawns there.

export const GraceState = {
  lastMap: 'area1',
  lastGraceId: 'a1_grace',
  lastX: 0,
  lastY: 0,

  setActive(mapKey, id, x, y) {
    this.lastMap = mapKey;
    this.lastGraceId = id;
    this.lastX = x;
    this.lastY = y;
  },
};
