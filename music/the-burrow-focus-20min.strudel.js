/*
The Burrow Focus
20 minute Strudel sketch for calm background focus.

Use:
1. Paste this into https://strudel.cc/
2. Press play.
3. Export audio from the Strudel export tab if you want a file.

Timing:
72 bpm with 4 beats per cycle gives 18 cycles per minute.
The arrangement below is 360 cycles, so it runs for 20 minutes before looping.
*/

setcpm(72 / 4)

const inhale = "<Am9 Cmaj7 G6 Fmaj7>"
const lantern = "<Fmaj7 Cmaj7 G6 Am9>"
const moss = "<Dm9 Fmaj7 Cmaj7 G6>"
const dawn = "<Am9 Em7 Fmaj7 Cmaj7>"

const padInhale = inhale.voicings("lefthand").note()
  .sound("gm_tremolo_strings:0")
  .attack(6)
  .release(10)
  .gain(0.38)
  .lpf(sine.slow(48).range(700, 1700))
  .room(0.82)
  .delay(0.18)

const padLantern = lantern.voicings("lefthand").note()
  .sound("gm_tremolo_strings:1")
  .attack(7)
  .release(12)
  .gain(0.32)
  .lpf(sine.slow(56).range(550, 1500))
  .room(0.88)
  .delay(0.22)

const padMoss = moss.voicings("lefthand").note()
  .sound("gm_voice_oohs")
  .attack(8)
  .release(12)
  .gain(0.24)
  .lpf(sine.slow(64).range(500, 1250))
  .room(0.9)
  .delay(0.2)

const padDawn = dawn.voicings("lefthand").note()
  .sound("gm_tremolo_strings:2")
  .attack(6)
  .release(11)
  .gain(0.3)
  .lpf(sine.slow(72).range(650, 1550))
  .room(0.86)
  .delay(0.25)

const felt = note("<[e5 b4 c5] [d5 a4 b4] [c5 g4 a4] [b4 d5 g4]>/2")
  .sound("triangle")
  .attack(0.08)
  .release(1.8)
  .gain(0.16)
  .pan(sine.slow(12).range(0.25, 0.75))
  .room(0.72)
  .delay(0.33)

const answeringFelt = note("<[a4 c5 e5] [g4 b4 d5] [f4 a4 c5] [g4 b4 e5]>/2")
  .sound("sine")
  .attack(0.12)
  .release(2.2)
  .gain(0.11)
  .pan(sine.slow(16).range(0.72, 0.28))
  .room(0.78)
  .delay(0.42)

const lowBreath = note("<a1 e2 f2 g2>/4")
  .sound("sine")
  .attack(5)
  .release(9)
  .gain(0.28)
  .lpf(260)
  .room(0.5)

const pulse = note("<a2 ~ e3 ~ f2 ~ g2 ~>/2")
  .sound("triangle")
  .attack(0.6)
  .release(2.5)
  .gain(0.08)
  .lpf(520)
  .room(0.68)

const water = note("<e6 ~ b5 ~ a5 ~ g5 ~>/4")
  .sound("sine")
  .attack(0.03)
  .release(2.6)
  .gain(0.075)
  .pan(perlin.slow(10))
  .room(0.9)
  .delay(0.55)

const transitionBloom = note("<e5 b5 a5 g5>/8")
  .sound("gm_voice_oohs")
  .attack(4)
  .release(7)
  .gain(0.2)
  .lpf(sine.slow(8).range(600, 2200))
  .room(0.95)
  .delay(0.38)
  .mask("<0!22 1!2 0!46 1!2 0!46 1!2 0!34 1!2 0!46 1!2 0!34 1!2 0!46 1!2 0!34 1!2 0!22 1!2 0!12>")

const sectionDust = note("<a6 ~ e6 ~ c6 ~ b5 ~>/8")
  .sound("sine")
  .attack(0.04)
  .release(3)
  .gain(0.06)
  .pan(sine.slow(7).range(0.15, 0.85))
  .room(0.92)
  .delay(0.6)
  .mask("<0!24 0!40 1!8 0!40 1!8 0!36 0!40 1!8 0!28 1!8 0!40 1!8 0!30 1!6 0!18 1!6 0!12>")

harmony$: arrange(
  [24, padInhale.gain(0.22)],
  [48, padInhale],
  [48, padLantern],
  [36, padMoss],
  [48, padDawn],
  [36, padMoss.gain(0.2)],
  [48, padLantern.gain(0.3)],
  [36, padInhale.gain(0.28)],
  [24, padDawn.gain(0.22)],
  [12, padInhale.gain(0.16)]
)

bass$: arrange(
  [12, silence],
  [60, lowBreath.gain(0.2)],
  [48, lowBreath],
  [36, lowBreath.gain(0.24)],
  [48, lowBreath.gain(0.26)],
  [36, silence],
  [48, lowBreath.gain(0.22)],
  [36, lowBreath.gain(0.18)],
  [24, lowBreath.gain(0.14)],
  [12, silence]
)

melody$: arrange(
  [36, silence],
  [36, felt.gain(0.1)],
  [48, felt],
  [36, answeringFelt.gain(0.08)],
  [48, felt.gain(0.13)],
  [36, silence],
  [48, answeringFelt],
  [36, felt.gain(0.09)],
  [24, answeringFelt.gain(0.06)],
  [12, silence]
)

motion$: arrange(
  [72, silence],
  [48, pulse],
  [36, pulse.gain(0.05)],
  [48, pulse.gain(0.07)],
  [36, silence],
  [48, pulse.gain(0.06)],
  [36, silence],
  [24, pulse.gain(0.04)],
  [12, silence]
)

texture$: arrange(
  [48, silence],
  [72, water.gain(0.045)],
  [36, water.gain(0.055)],
  [48, water.gain(0.05)],
  [36, silence],
  [48, water.gain(0.05)],
  [36, water.gain(0.04)],
  [24, sectionDust],
  [12, silence]
)

transition$: transitionBloom

all(x => x.slow(1).room(0.85))
