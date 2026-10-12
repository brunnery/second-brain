/* ================================================================
   CARDIO MACHINES + WORKOUT LIBRARY
   MET values: 2024 Adult Compendium of Physical Activities
   (stair ergometer 9.3, rowing ergometer by watts, elliptical 5–9).
   Walking/running calories use the ACSM metabolic equations instead.
   ================================================================ */

export const CARDIO_TYPES = {
  stairmaster: { name: "Stairmaster", short: "Stairs", color: "#ff7a45", met: { easy: 6.5, moderate: 9.3, hard: 11 }, fields: ["level", "floors"], lowImpact: true },
  rower: { name: "Rower (Erg)", short: "Erg", color: "#7cc4ff", met: { easy: 5, moderate: 7.5, hard: 11 }, fields: ["distance", "watts"], lowImpact: true },
  bike: { name: "Bike", short: "Bike", color: "#ffc94a", met: { easy: 5.5, moderate: 7, hard: 10 }, fields: ["distance", "watts", "rpm"], lowImpact: true },
  airBike: { name: "Air bike", short: "Air bike", color: "#ff5f8f", met: { easy: 6, moderate: 8.5, hard: 12 }, fields: ["calories", "watts"], lowImpact: true },
  inclineWalk: { name: "Incline walk", short: "Incline", color: "#63d98f", met: { easy: 5, moderate: 7, hard: 9 }, fields: ["speed", "incline"], lowImpact: true },
  run: { name: "Run", short: "Run", color: "#b9a3ff", met: { easy: 8, moderate: 10, hard: 12.5 }, fields: ["distance", "incline"], lowImpact: false },
  elliptical: { name: "Elliptical", short: "Elliptical", color: "#56d6d0", met: { easy: 5, moderate: 6.5, hard: 9 }, fields: ["distance", "level"], lowImpact: true },
  walk: { name: "Walk outside", short: "Walk", color: "#a39e90", met: { easy: 3, moderate: 3.8, hard: 4.8 }, fields: ["distance"], lowImpact: true },
  swim: { name: "Swim", short: "Swim", color: "#4fc3f7", met: { easy: 6, moderate: 8, hard: 10 }, fields: ["distance"], lowImpact: true },
  other: { name: "Other", short: "Other", color: "#6f6a5f", met: { easy: 4, moderate: 6, hard: 8 }, fields: [], lowImpact: true },
};

export const ALL_PREF_TYPES = ["stairmaster", "rower", "bike", "airBike", "inclineWalk", "run", "elliptical", "walk", "swim"];

export const INTENTS = {
  z2: { name: "Zone 2", hint: "Easy, conversational (RPE 3–4). Builds the aerobic base, barely affects recovery.", intensity: "easy" },
  tempo: { name: "Tempo", hint: "Comfortably hard (RPE 6–7). Raises the threshold.", intensity: "moderate" },
  interval: { name: "Intervals", hint: "Hard repeats (RPE 8–9) with recoveries. Big fitness gains in little time.", intensity: "hard" },
  sprint: { name: "Sprints", hint: "Short all-out efforts. Power and conditioning, very time-efficient.", intensity: "hard" },
  recovery: { name: "Recovery", hint: "Very easy movement to loosen up (RPE 2).", intensity: "easy" },
};

const s = (label, sec, effort) => ({ label, sec, effort }); // effort: easy|moderate|hard|max|rest
const repeat = (n, parts) => Array.from({ length: n }, (_, i) => parts.map((p) => ({ ...p, label: `${p.label} ${i + 1}/${n}` }))).flat();

/* Each workout: id, type, intent, name, minutes, how (setting tip), steps (for the interval player) */
export const CARDIO_WORKOUTS = [
  /* ----- Stairmaster ----- */
  { id: "stairs-z2-30", type: "stairmaster", intent: "z2", name: "Steady climb", minutes: 30, how: "Level where you can still talk, no leaning on the rails.", steps: [s("Warm-up", 180, "easy"), s("Steady climb", 1440, "moderate"), s("Cool-down", 180, "easy")] },
  { id: "stairs-z2-40", type: "stairmaster", intent: "z2", name: "Long steady climb", minutes: 40, how: "Hands off the rails, upright posture, nose breathing.", steps: [s("Warm-up", 180, "easy"), s("Steady climb", 2040, "moderate"), s("Cool-down", 180, "easy")] },
  { id: "stairs-pyramid", type: "stairmaster", intent: "interval", name: "Level pyramid", minutes: 25, how: "Go up 2 levels every 2 min, then back down.", steps: [s("Warm-up", 180, "easy"), ...repeat(5, [s("Climb harder", 120, "hard"), s("Easier", 60, "moderate")]), s("Cool-down", 300, "easy")] },
  { id: "stairs-intervals", type: "stairmaster", intent: "interval", name: "3 min on / 2 min easy", minutes: 28, how: "Hard = level +3 above your steady level.", steps: [s("Warm-up", 180, "easy"), ...repeat(5, [s("Hard", 180, "hard"), s("Easy", 120, "easy")]), s("Cool-down", 60, "easy")] },
  { id: "stairs-tempo", type: "stairmaster", intent: "tempo", name: "Tempo climb", minutes: 25, how: "20 min at a level that is hard but sustainable.", steps: [s("Warm-up", 180, "easy"), s("Tempo", 1200, "hard"), s("Cool-down", 120, "easy")] },

  /* ----- Rower ----- */
  { id: "erg-z2-30", type: "rower", intent: "z2", name: "Steady row", minutes: 30, how: "Rate 18–22 spm, split you could hold for an hour. Legs-body-arms.", steps: [s("Warm-up", 180, "easy"), s("Steady row @ 20 spm", 1440, "moderate"), s("Cool-down", 180, "easy")] },
  { id: "erg-500s", type: "rower", intent: "interval", name: "6 × 500 m", minutes: 26, how: "Each 500 m at ~2k-race pace + 3 s. 1:30 easy paddle between.", steps: [s("Warm-up", 300, "easy"), ...repeat(6, [s("500 m hard", 110, "hard"), s("Easy paddle", 90, "rest")]), s("Cool-down", 120, "easy")] },
  { id: "erg-pyramid", type: "rower", intent: "interval", name: "Pyramid 1-2-3-4-3-2-1", minutes: 28, how: "Minutes hard at rate 26–28, half as long easy in between.", steps: [s("Warm-up", 240, "easy"), s("1 min hard", 60, "hard"), s("Easy", 30, "rest"), s("2 min hard", 120, "hard"), s("Easy", 60, "rest"), s("3 min hard", 180, "hard"), s("Easy", 90, "rest"), s("4 min hard", 240, "hard"), s("Easy", 120, "rest"), s("3 min hard", 180, "hard"), s("Easy", 90, "rest"), s("2 min hard", 120, "hard"), s("Easy", 60, "rest"), s("1 min hard", 60, "hard"), s("Cool-down", 240, "easy")] },
  { id: "erg-sprints", type: "rower", intent: "sprint", name: "10 × 30 s sprints", minutes: 18, how: "All-out 30 s at high rate, 60 s very easy.", steps: [s("Warm-up", 240, "easy"), ...repeat(10, [s("Sprint", 30, "max"), s("Easy", 60, "rest")]), s("Cool-down", 180, "easy")] },
  { id: "erg-tempo", type: "rower", intent: "tempo", name: "3 × 6 min threshold", minutes: 28, how: "Rate 24, split ~5 s slower than 2k pace. 2 min easy between.", steps: [s("Warm-up", 240, "easy"), ...repeat(3, [s("Threshold", 360, "hard"), s("Easy", 120, "rest")]), s("Cool-down", 120, "easy")] },

  /* ----- Bike ----- */
  { id: "bike-z2-30", type: "bike", intent: "z2", name: "Zone 2 spin", minutes: 30, how: "85–95 rpm, you can breathe through the nose.", steps: [s("Warm-up", 180, "easy"), s("Zone 2", 1440, "moderate"), s("Cool-down", 180, "easy")] },
  { id: "bike-z2-45", type: "bike", intent: "z2", name: "Long Zone 2 ride", minutes: 45, how: "Podcast ride. Same easy effort the whole time.", steps: [s("Warm-up", 300, "easy"), s("Zone 2", 2100, "moderate"), s("Cool-down", 300, "easy")] },
  { id: "bike-4x4", type: "bike", intent: "interval", name: "Norwegian 4×4", minutes: 32, how: "4 min at ~90 % max HR, 3 min easy spin. The classic VO₂max session.", steps: [s("Warm-up", 300, "easy"), ...repeat(4, [s("4 min hard", 240, "hard"), s("3 min easy", 180, "rest")]), s("Cool-down", 120, "easy")] },
  { id: "bike-tempo", type: "bike", intent: "tempo", name: "2 × 10 min sweet spot", minutes: 30, how: "Effort ~7/10, steady cadence 85–90.", steps: [s("Warm-up", 300, "easy"), s("Sweet spot", 600, "hard"), s("Easy", 180, "rest"), s("Sweet spot", 600, "hard"), s("Cool-down", 120, "easy")] },
  { id: "bike-30-30", type: "bike", intent: "interval", name: "30/30s", minutes: 25, how: "2 × 8 rounds of 30 s hard / 30 s easy, 3 min between blocks.", steps: [s("Warm-up", 300, "easy"), ...repeat(8, [s("Hard", 30, "hard"), s("Easy", 30, "rest")]), s("Block break", 180, "easy"), ...repeat(8, [s("Hard", 30, "hard"), s("Easy", 30, "rest")]), s("Cool-down", 60, "easy")] },
  { id: "bike-recovery", type: "bike", intent: "recovery", name: "Recovery spin", minutes: 20, how: "Very light, high cadence. Flushes the legs.", steps: [s("Easy spin", 1200, "easy")] },

  /* ----- Air bike ----- */
  { id: "air-tabata", type: "airBike", intent: "sprint", name: "Tabata 2 blocks", minutes: 16, how: "8 × 20 s max / 10 s off, twice, 3 min easy between.", steps: [s("Warm-up", 240, "easy"), ...repeat(8, [s("Max", 20, "max"), s("Off", 10, "rest")]), s("Easy", 180, "easy"), ...repeat(8, [s("Max", 20, "max"), s("Off", 10, "rest")]), s("Cool-down", 60, "easy")] },
  { id: "air-15-45", type: "airBike", intent: "sprint", name: "10 × 15 s / 45 s", minutes: 18, how: "Arms and legs all-out for 15 s, crawl for 45 s.", steps: [s("Warm-up", 240, "easy"), ...repeat(10, [s("All-out", 15, "max"), s("Easy", 45, "rest")]), s("Cool-down", 120, "easy")] },
  { id: "air-1min", type: "airBike", intent: "interval", name: "8 × 1 min hard", minutes: 22, how: "Hard but repeatable minutes, 1 min easy.", steps: [s("Warm-up", 240, "easy"), ...repeat(8, [s("Hard", 60, "hard"), s("Easy", 60, "rest")]), s("Cool-down", 120, "easy")] },
  { id: "air-z2", type: "airBike", intent: "z2", name: "Easy air bike", minutes: 25, how: "Smooth and easy, arms and legs together.", steps: [s("Warm-up", 120, "easy"), s("Steady", 1260, "moderate"), s("Cool-down", 120, "easy")] },

  /* ----- Incline walk ----- */
  { id: "incline-12-3-30", type: "inclineWalk", intent: "z2", name: "12-3-30", minutes: 30, how: "Incline 12 %, 3 mph (≈ 4.8 km/h), 30 min. Don't hold the rails.", steps: [s("Walk 12 % @ 4.8 km/h", 1800, "moderate")] },
  { id: "incline-45", type: "inclineWalk", intent: "z2", name: "Long incline walk", minutes: 45, how: "8–10 % incline, 5–5.5 km/h. Great on rest days.", steps: [s("Warm-up flat", 180, "easy"), s("Incline walk", 2340, "moderate"), s("Cool-down", 180, "easy")] },
  { id: "incline-hills", type: "inclineWalk", intent: "tempo", name: "Hill ladder", minutes: 30, how: "Every 3 min: +2 % up to 14 %, then back down.", steps: [s("Warm-up", 180, "easy"), ...repeat(8, [s("Climb +2 %", 180, "hard")]), s("Cool-down", 180, "easy")] },
  { id: "incline-recovery", type: "inclineWalk", intent: "recovery", name: "Easy incline walk", minutes: 20, how: "5 % incline, chatting pace.", steps: [s("Easy walk", 1200, "easy")] },

  /* ----- Run ----- */
  { id: "run-easy", type: "run", intent: "z2", name: "Easy run", minutes: 30, how: "Conversational pace — you could speak full sentences.", steps: [s("Easy run", 1800, "moderate")] },
  { id: "run-long", type: "run", intent: "z2", name: "Long easy run", minutes: 50, how: "Same easy pace, longer. Fuel if over 75 min.", steps: [s("Easy run", 3000, "moderate")] },
  { id: "run-tempo", type: "run", intent: "tempo", name: "20 min tempo", minutes: 35, how: "Comfortably hard — pace you could hold ~1 hour.", steps: [s("Warm-up jog", 600, "easy"), s("Tempo", 1200, "hard"), s("Cool-down jog", 300, "easy")] },
  { id: "run-intervals", type: "run", intent: "interval", name: "6 × 3 min", minutes: 38, how: "3 min at 5k pace, 2 min jog.", steps: [s("Warm-up jog", 600, "easy"), ...repeat(6, [s("5k pace", 180, "hard"), s("Jog", 120, "rest")]), s("Cool-down jog", 300, "easy")] },
  { id: "run-strides", type: "run", intent: "sprint", name: "Easy + 8 strides", minutes: 30, how: "25 min easy, then 8 × 20 s fast relaxed strides.", steps: [s("Easy run", 1500, "moderate"), ...repeat(8, [s("Stride", 20, "max"), s("Walk back", 40, "rest")])] },

  /* ----- Elliptical / walk / swim ----- */
  { id: "ell-z2", type: "elliptical", intent: "z2", name: "Elliptical steady", minutes: 30, how: "Moderate resistance, steady cadence.", steps: [s("Steady", 1800, "moderate")] },
  { id: "ell-intervals", type: "elliptical", intent: "interval", name: "1 min hard / 1 min easy", minutes: 24, how: "Raise resistance on the hard minutes.", steps: [s("Warm-up", 180, "easy"), ...repeat(9, [s("Hard", 60, "hard"), s("Easy", 60, "rest")]), s("Cool-down", 180, "easy")] },
  { id: "walk-outdoor", type: "walk", intent: "recovery", name: "Outdoor walk", minutes: 45, how: "Easy walk, ideally after a meal.", steps: [s("Walk", 2700, "easy")] },
  { id: "swim-easy", type: "swim", intent: "z2", name: "Easy swim", minutes: 30, how: "Relaxed laps, any stroke.", steps: [s("Swim", 1800, "moderate")] },
];

export const workoutById = (id) => CARDIO_WORKOUTS.find((w) => w.id === id) || null;
