import { addDays, dayIdx, today } from "../../lib/dates.js";

/* ================================================================
   EVENING ROUTINES — accepted versions, kept 1:1 from the old app.
   Do not change exercises, order or timings without asking.
   ================================================================ */

export const ROUTINES = {
  back: {
    id: "back", name: "Back Mobility", color: "var(--mobility)",
    tagline: "Anti-kyphosis · gentle, back-only · no sweating",
    exercises: [
      { name: "Thoracic Extension", desc: "Foam roller across the thoracic spine, hands behind head, gently extend over the roller.", sec: 60, img: "/routines/thoracic-extension.png" },
      { name: "Cat–Cow", desc: "On all fours, slowly alternate between rounding and arching the back, in sync with your breathing.", sec: 45, img: "/routines/cat-cow.png" },
      { name: "Sphinx Hold", desc: "Lie face down, prop up on the forearms, let the chest lift and the upper back settle into extension. Relax and breathe.", sec: 45, img: "/routines/sphinx.png" },
      { name: "Thread the Needle Left", desc: "On all fours, slide one arm under the body, shoulder toward the floor. Gentle thoracic rotation.", sec: 30, img: "/routines/thread-needle.png" },
      { name: "Thread the Needle Right", desc: "Switch sides. Rotate from the upper back, hips stay still.", sec: 30, img: "/routines/thread-needle.png" },
      { name: "Wall Angels", desc: "Back and arms against a wall, slowly slide the arms up and down. Keep the lower back close to the wall.", sec: 45, img: "/routines/wall-angels.png" },
      { name: "Glute Bridge", desc: "On your back, feet planted, lift the hips, hold 2s at the top.", sec: 60, img: "/routines/glute-bridge.png" },
      { name: "Superman", desc: "Face down, lift arms and legs slightly, gaze down. Slow, controlled reps.", sec: 60, img: "/routines/superman.png" },
      { name: "Child's Pose", desc: "To finish: hips back to heels, arms extended, breathe deeply into your back.", sec: 45, img: "/routines/childs-pose.png" },
    ],
  },
  core: {
    id: "core", name: "Core & Stability", color: "var(--cardio)",
    tagline: "Direct ab work · short and focused · no planks",
    exercises: [
      { name: "Heel Taps", desc: "Shoulders slightly lifted, alternately tap each heel. Small, controlled motion.", sec: 45, img: "/routines/heel-taps.png" },
      { name: "Reverse Crunches", desc: "On your back, knees bent. Curl the hips off the floor toward the chest, lower slowly — no swinging.", sec: 45, img: "/routines/reverse-crunch.png" },
      { name: "Diamond Sit-ups", desc: "Soles together, knees out. Curl up smoothly, exhale on the way up.", sec: 45, img: "/routines/diamond-situps.png" },
      { name: "Bicycle Crunches", desc: "Elbow toward the opposite knee, alternate sides slowly. Rotate from the ribs, don't pull on the neck.", sec: 45, img: "/routines/bicycle-crunch.png" },
      { name: "Russian Twists", desc: "Lean back on the sit bones, rotate the torso side to side, controlled. Feet down makes it easier.", sec: 45, img: "/routines/russian-twist.png" },
      { name: "V-Hold", desc: "Balance on the sit bones, legs and torso form a V. Hold while the form stays clean.", sec: 30, img: "/routines/v-hold.png" },
    ],
  },
  mobility: {
    id: "mobility", name: "Stretching", color: "var(--money)",
    tagline: "Bottom-up flexibility — feet to back",
    exercises: [
      { name: "Toe / Plantar Stretch", desc: "Kneel with toes tucked under, sit back gently onto your heels.", sec: 30, img: "/routines/toe-stretch.png" },
      { name: "Calf Stretch at Wall", desc: "Lunge toward the wall, back leg straight, heel down. Switch sides halfway.", sec: 45, img: "/routines/calf-wall.png" },
      { name: "Hamstring Left", desc: "Leg straight and propped up, hinge forward with a flat back.", sec: 30, img: "/routines/hamstring.png" },
      { name: "Hamstring Right", desc: "Switch sides. Feel it in the thigh, not the lower back.", sec: 30, img: "/routines/hamstring.png" },
      { name: "Quad Stretch Left", desc: "Standing, pull the foot toward the glutes, knees together, pelvis tucked.", sec: 30, img: "/routines/quad-stretch.png" },
      { name: "Quad Stretch Right", desc: "Switch sides. Hold a wall for balance if needed.", sec: 30, img: "/routines/quad-stretch.png" },
      { name: "Butterfly", desc: "Seated, soles together, knees sink toward the floor, back tall.", sec: 45, img: "/routines/butterfly.png" },
      { name: "Figure-4 Glute Left", desc: "On your back, ankle over opposite knee, pull the thigh toward you.", sec: 30, img: "/routines/figure-four.png" },
      { name: "Figure-4 Glute Right", desc: "Switch sides. Head and shoulders relaxed on the floor.", sec: 30, img: "/routines/figure-four.png" },
      { name: "Lying Spinal Twist Left", desc: "Knees drop to one side, arms wide, both shoulders down.", sec: 30, img: "/routines/spinal-twist.png" },
      { name: "Lying Spinal Twist Right", desc: "Switch sides. Breathe into the rotation.", sec: 30, img: "/routines/spinal-twist.png" },
      { name: "Neck Stretch Left", desc: "Sit or stand tall, drop the ear toward the shoulder, hand rests lightly on the head — gravity only, no pulling.", sec: 30, img: "/routines/neck-stretch.png" },
      { name: "Neck Stretch Right", desc: "Switch sides. Keep the opposite shoulder heavy and relaxed.", sec: 30, img: "/routines/neck-stretch.png" },
    ],
  },
};

/* Mon … Sun — null = rest evening */
export const DEFAULT_SCHEDULE = ["back", "core", "mobility", null, null, "back", "core"];

export const routineMinutes = (r) => Math.round(r.exercises.reduce((a, e) => a + e.sec, 0) / 60 * 10) / 10;

/** Consecutive scheduled evenings completed; unscheduled evenings never break the streak. */
export function routineStreak(done, schedule, from = today()) {
  let streak = 0;
  let d = done[from] ? from : addDays(from, -1); // today not done yet doesn't break it
  for (let i = 0; i < 400; i++) {
    if (done[d]) streak++;
    else if (schedule[dayIdx(d)]) break;
    d = addDays(d, -1);
  }
  return streak;
}
