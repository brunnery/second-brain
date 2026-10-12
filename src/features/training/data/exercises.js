/* ================================================================
   EXERCISE DATABASE
   Each entry: id, name, pattern, primary muscles, secondary muscles,
   equipment, mechanic (c = compound, i = isolation),
   spine load (0 low · 1 moderate · 2 high axial/shear load), cue.
   Order inside a pattern = preference order for the plan generator
   (first = default pick, later = variations for B-days / swaps).
   Add your own exercises in the app (Library → +); they are stored
   separately and merged with this list.
   ================================================================ */

export const MUSCLES = {
  chest: "Chest", frontDelts: "Front delts", sideDelts: "Side delts", rearDelts: "Rear delts",
  triceps: "Triceps", lats: "Lats", upperBack: "Upper back", traps: "Traps", biceps: "Biceps",
  forearms: "Forearms", quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves",
  adductors: "Adductors", abductors: "Abductors", abs: "Abs", obliques: "Obliques", lowerBack: "Lower back",
  fullBody: "Full body",
};

export const EQUIPMENT = {
  barbell: "Barbell", dumbbell: "Dumbbell", cable: "Cable", machine: "Machine", smith: "Smith machine",
  bodyweight: "Bodyweight", kettlebell: "Kettlebell", ezbar: "EZ-bar", band: "Band", trapbar: "Trap bar",
  sled: "Sled", other: "Other",
};

export const PATTERNS = {
  h_press: "Horizontal press", incline_press: "Incline press", v_press: "Overhead press", chest_fly: "Chest fly",
  dip: "Dip", lat_raise: "Lateral raise", rear_delt: "Rear delt / posture", tri_pushdown: "Triceps pushdown",
  tri_overhead: "Overhead triceps", tri_press: "Triceps press", v_pull: "Vertical pull", h_row: "Row",
  pullover: "Straight-arm pull", shrug: "Shrug", curl: "Curl", curl_neutral: "Hammer / neutral curl",
  squat: "Squat", hinge: "Hip hinge", lunge: "Single-leg", leg_press: "Leg press", knee_ext: "Knee extension",
  knee_flex: "Leg curl", hip_thrust: "Hip thrust", calf: "Calf raise", adductor: "Adductors",
  abductor: "Abductors", back_ext: "Back extension", core_flex: "Core flexion", core_anti: "Anti-extension",
  core_rot: "Rotation / anti-rotation", carry: "Carry", conditioning: "Conditioning",
};

const ex = (id, name, pattern, primary, secondary, equipment, mech, spine, cue) =>
  ({ id, name, pattern, primary, secondary, equipment, mech, spine, cue });

export const EXERCISES = [
  /* ---------- horizontal press ---------- */
  ex("bb-bench", "Barbell Bench Press", "h_press", ["chest"], ["triceps", "frontDelts"], "barbell", "c", 0, "Shoulder blades pinned, feet planted, bar to lower chest."),
  ex("db-bench", "Dumbbell Bench Press", "h_press", ["chest"], ["triceps", "frontDelts"], "dumbbell", "c", 0, "Deep stretch at the bottom, press slightly inward."),
  ex("machine-chest", "Machine Chest Press", "h_press", ["chest"], ["triceps", "frontDelts"], "machine", "c", 0, "Seat so handles sit at mid-chest; full control."),
  ex("smith-bench", "Smith Machine Bench Press", "h_press", ["chest"], ["triceps", "frontDelts"], "smith", "c", 0, "Bar path to lower chest, elbows ~45°."),
  ex("paused-bench", "Paused Bench Press", "h_press", ["chest"], ["triceps", "frontDelts"], "barbell", "c", 0, "1 s dead pause on the chest, stay tight."),
  ex("close-grip-bench", "Close-Grip Bench Press", "h_press", ["triceps", "chest"], ["frontDelts"], "barbell", "c", 0, "Shoulder-width grip, elbows tucked."),
  ex("cable-press", "Seated Cable Chest Press", "h_press", ["chest"], ["triceps"], "cable", "c", 0, "Constant tension, squeeze at full extension."),
  ex("push-up", "Push-up", "h_press", ["chest"], ["triceps", "frontDelts", "abs"], "bodyweight", "c", 0, "Rigid body line, chest to floor."),
  ex("weighted-push-up", "Weighted Push-up", "h_press", ["chest"], ["triceps", "frontDelts"], "bodyweight", "c", 0, "Plate on upper back, full range."),
  ex("floor-press", "Dumbbell Floor Press", "h_press", ["chest", "triceps"], ["frontDelts"], "dumbbell", "c", 0, "Elbows touch the floor softly each rep."),
  ex("decline-bench", "Decline Bench Press", "h_press", ["chest"], ["triceps"], "barbell", "c", 0, "Slight decline, bar to lower chest."),

  /* ---------- incline press ---------- */
  ex("incline-db", "Incline Dumbbell Press", "incline_press", ["chest", "frontDelts"], ["triceps"], "dumbbell", "c", 0, "Bench 30°, dumbbells over upper chest."),
  ex("incline-bb", "Incline Barbell Press", "incline_press", ["chest", "frontDelts"], ["triceps"], "barbell", "c", 0, "Bench 30°, bar to upper chest."),
  ex("incline-smith", "Incline Smith Press", "incline_press", ["chest", "frontDelts"], ["triceps"], "smith", "c", 0, "Stable path, focus on the upper-chest stretch."),
  ex("incline-machine", "Incline Machine Press", "incline_press", ["chest", "frontDelts"], ["triceps"], "machine", "c", 0, "Handles at upper chest height."),
  ex("low-high-cable-press", "Low-to-High Cable Press", "incline_press", ["chest"], ["frontDelts"], "cable", "c", 0, "Press up and in, finish at eye level."),

  /* ---------- overhead press ---------- */
  ex("seated-db-ohp", "Seated Dumbbell Shoulder Press", "v_press", ["frontDelts"], ["sideDelts", "triceps"], "dumbbell", "c", 0, "Back supported, press to just short of lockout."),
  ex("machine-ohp", "Machine Shoulder Press", "v_press", ["frontDelts"], ["sideDelts", "triceps"], "machine", "c", 0, "Ribs down, elbows slightly in front."),
  ex("bb-ohp", "Standing Barbell Overhead Press", "v_press", ["frontDelts"], ["sideDelts", "triceps", "abs"], "barbell", "c", 2, "Glutes tight, head through at the top."),
  ex("seated-bb-ohp", "Seated Barbell Overhead Press", "v_press", ["frontDelts"], ["sideDelts", "triceps"], "barbell", "c", 1, "Back against pad, bar in front of face."),
  ex("smith-ohp", "Smith Machine Shoulder Press", "v_press", ["frontDelts"], ["sideDelts", "triceps"], "smith", "c", 0, "Bench slightly reclined, bar to chin."),
  ex("arnold-press", "Arnold Press", "v_press", ["frontDelts", "sideDelts"], ["triceps"], "dumbbell", "c", 0, "Rotate palms out as you press."),
  ex("landmine-press", "Half-Kneeling Landmine Press", "v_press", ["frontDelts", "chest"], ["triceps", "obliques"], "barbell", "c", 0, "Shoulder-friendly angle, ribs down."),
  ex("push-press", "Push Press", "v_press", ["frontDelts"], ["triceps", "quads"], "barbell", "c", 2, "Short dip, drive with the legs, lock out."),

  /* ---------- chest fly ---------- */
  ex("cable-fly", "Cable Fly (mid)", "chest_fly", ["chest"], [], "cable", "i", 0, "Soft elbows, hug a tree, squeeze."),
  ex("pec-deck", "Pec Deck", "chest_fly", ["chest"], [], "machine", "i", 0, "Big stretch, pause 1 s in contraction."),
  ex("low-cable-fly", "Low-to-High Cable Fly", "chest_fly", ["chest"], ["frontDelts"], "cable", "i", 0, "Scoop upward, targets upper chest."),
  ex("db-fly", "Dumbbell Fly", "chest_fly", ["chest"], [], "dumbbell", "i", 0, "Controlled stretch, stop before shoulder strain."),
  ex("high-cable-fly", "High-to-Low Cable Fly", "chest_fly", ["chest"], [], "cable", "i", 0, "Pull down and in toward the hips."),

  /* ---------- dips ---------- */
  ex("dip", "Dips", "dip", ["chest", "triceps"], ["frontDelts"], "bodyweight", "c", 0, "Slight forward lean, shoulders down."),
  ex("weighted-dip", "Weighted Dips", "dip", ["chest", "triceps"], ["frontDelts"], "bodyweight", "c", 0, "Belt load, controlled depth."),
  ex("assisted-dip", "Assisted Dip Machine", "dip", ["chest", "triceps"], ["frontDelts"], "machine", "c", 0, "Use assistance to reach full depth."),

  /* ---------- lateral raise ---------- */
  ex("db-lateral", "Dumbbell Lateral Raise", "lat_raise", ["sideDelts"], [], "dumbbell", "i", 0, "Lead with elbows, slight forward lean."),
  ex("cable-lateral", "Cable Lateral Raise", "lat_raise", ["sideDelts"], [], "cable", "i", 0, "Cable behind body, constant tension."),
  ex("machine-lateral", "Machine Lateral Raise", "lat_raise", ["sideDelts"], [], "machine", "i", 0, "Pads on elbows, no shrugging."),
  ex("lean-away-lateral", "Lean-Away Lateral Raise", "lat_raise", ["sideDelts"], [], "dumbbell", "i", 0, "Hold a post, lean away for a longer range."),
  ex("cable-y-raise", "Cable Y-Raise", "lat_raise", ["sideDelts"], ["traps"], "cable", "i", 0, "Raise in a Y shape, thumbs up."),

  /* ---------- rear delts / posture (Scheuermann-friendly) ---------- */
  ex("face-pull", "Face Pull", "rear_delt", ["rearDelts", "upperBack"], ["traps"], "cable", "i", 0, "Pull to forehead, rotate thumbs back."),
  ex("reverse-pec-deck", "Reverse Pec Deck", "rear_delt", ["rearDelts"], ["upperBack"], "machine", "i", 0, "Arms wide, squeeze shoulder blades lightly."),
  ex("cable-rear-fly", "Cable Rear Delt Fly", "rear_delt", ["rearDelts"], ["upperBack"], "cable", "i", 0, "Cross cables, sweep out wide."),
  ex("prone-y-raise", "Prone Y-Raise (incline bench)", "rear_delt", ["upperBack", "rearDelts"], ["traps"], "dumbbell", "i", 0, "Chest on bench, light weight, upper-back extension."),
  ex("band-pull-apart", "Band Pull-Apart", "rear_delt", ["rearDelts", "upperBack"], [], "band", "i", 0, "Arms straight, pull band to chest."),
  ex("db-rear-fly", "Bent-Over Dumbbell Rear Fly", "rear_delt", ["rearDelts"], ["upperBack"], "dumbbell", "i", 1, "Chest supported if possible, pinkies up."),

  /* ---------- triceps ---------- */
  ex("rope-pushdown", "Rope Pushdown", "tri_pushdown", ["triceps"], [], "cable", "i", 0, "Elbows pinned, split rope at the bottom."),
  ex("bar-pushdown", "Straight-Bar Pushdown", "tri_pushdown", ["triceps"], [], "cable", "i", 0, "Lock out hard, slow return."),
  ex("single-arm-pushdown", "Single-Arm Cable Pushdown", "tri_pushdown", ["triceps"], [], "cable", "i", 0, "Reverse grip possible, full lockout."),
  ex("cable-oh-ext", "Overhead Cable Triceps Extension", "tri_overhead", ["triceps"], [], "cable", "i", 0, "Face away, stretch behind head."),
  ex("db-oh-ext", "Overhead Dumbbell Extension", "tri_overhead", ["triceps"], [], "dumbbell", "i", 0, "Seated, elbows narrow, deep stretch."),
  ex("ez-oh-ext", "EZ-Bar Overhead Extension", "tri_overhead", ["triceps"], [], "ezbar", "i", 0, "Seated, back supported."),
  ex("skull-crusher", "EZ-Bar Skull Crusher", "tri_press", ["triceps"], [], "ezbar", "i", 0, "Bar behind forehead, elbows slightly back."),
  ex("db-skull-crusher", "Dumbbell Skull Crusher", "tri_press", ["triceps"], [], "dumbbell", "i", 0, "Neutral grip, slow eccentric."),
  ex("jm-press", "JM Press", "tri_press", ["triceps"], ["chest"], "barbell", "c", 0, "Hybrid of close-grip press and skull crusher."),
  ex("tri-dip-machine", "Seated Dip Machine", "tri_press", ["triceps"], ["chest"], "machine", "c", 0, "Upright torso for triceps focus."),

  /* ---------- vertical pull ---------- */
  ex("lat-pulldown", "Lat Pulldown", "v_pull", ["lats"], ["biceps", "upperBack"], "cable", "c", 0, "Chest up, pull elbows to ribs."),
  ex("pull-up", "Pull-up", "v_pull", ["lats"], ["biceps", "upperBack"], "bodyweight", "c", 0, "Full hang to chin over bar."),
  ex("weighted-pull-up", "Weighted Pull-up", "v_pull", ["lats"], ["biceps", "upperBack"], "bodyweight", "c", 0, "Belt load, no kipping."),
  ex("chin-up", "Chin-up", "v_pull", ["lats", "biceps"], ["upperBack"], "bodyweight", "c", 0, "Supinated grip, chest to bar."),
  ex("neutral-pulldown", "Neutral-Grip Pulldown", "v_pull", ["lats"], ["biceps"], "cable", "c", 0, "Close neutral handle, big stretch at top."),
  ex("single-arm-pulldown", "Single-Arm Cable Pulldown", "v_pull", ["lats"], ["biceps"], "cable", "c", 0, "Kneel, pull elbow to hip."),
  ex("assisted-pull-up", "Assisted Pull-up Machine", "v_pull", ["lats"], ["biceps"], "machine", "c", 0, "Use enough help for clean reps."),
  ex("machine-pulldown", "Machine Pulldown (plate-loaded)", "v_pull", ["lats"], ["biceps"], "machine", "c", 0, "Drive elbows down and back."),

  /* ---------- rows ---------- */
  ex("cs-row", "Chest-Supported T-Bar Row", "h_row", ["upperBack", "lats"], ["rearDelts", "biceps"], "machine", "c", 0, "Chest on pad — zero lower-back load."),
  ex("seated-cable-row", "Seated Cable Row", "h_row", ["upperBack", "lats"], ["biceps", "rearDelts"], "cable", "c", 0, "Tall chest, pull to belly button."),
  ex("db-row", "One-Arm Dumbbell Row", "h_row", ["lats", "upperBack"], ["biceps"], "dumbbell", "c", 0, "Hand on bench, pull toward hip."),
  ex("machine-row", "Machine Row", "h_row", ["upperBack", "lats"], ["biceps"], "machine", "c", 0, "Chest on pad, full protraction."),
  ex("incline-db-row", "Incline Dumbbell Row (chest-supported)", "h_row", ["upperBack"], ["rearDelts", "biceps"], "dumbbell", "c", 0, "Chest on 30° bench, elbows wide."),
  ex("bb-row", "Barbell Row", "h_row", ["upperBack", "lats"], ["biceps", "lowerBack"], "barbell", "c", 2, "Hinge ~45°, neutral spine, bar to belly."),
  ex("pendlay-row", "Pendlay Row", "h_row", ["upperBack", "lats"], ["lowerBack"], "barbell", "c", 2, "Dead stop each rep, explosive pull."),
  ex("seal-row", "Seal Row", "h_row", ["upperBack", "lats"], ["rearDelts"], "barbell", "c", 0, "Lying on a high bench — spine fully supported."),
  ex("meadows-row", "Meadows Row", "h_row", ["lats", "upperBack"], ["biceps"], "barbell", "c", 1, "Landmine, staggered stance."),
  ex("inverted-row", "Inverted Row", "h_row", ["upperBack"], ["biceps", "rearDelts"], "bodyweight", "c", 0, "Body straight, chest to bar."),
  ex("wide-cable-row", "Wide-Grip Cable Row", "h_row", ["upperBack", "rearDelts"], ["lats"], "cable", "c", 0, "Elbows flared, squeeze upper back."),

  /* ---------- straight-arm ---------- */
  ex("straight-arm-pulldown", "Straight-Arm Pulldown", "pullover", ["lats"], [], "cable", "i", 0, "Arms nearly straight, sweep to thighs."),
  ex("db-pullover", "Dumbbell Pullover", "pullover", ["lats", "chest"], [], "dumbbell", "i", 0, "Hips low, deep stretch overhead."),
  ex("machine-pullover", "Machine Pullover", "pullover", ["lats"], [], "machine", "i", 0, "Elbows drive down in an arc."),

  /* ---------- shrugs ---------- */
  ex("db-shrug", "Dumbbell Shrug", "shrug", ["traps"], [], "dumbbell", "i", 0, "Straight up, pause at top."),
  ex("cable-shrug", "Cable Shrug", "shrug", ["traps"], [], "cable", "i", 0, "Slight lean, constant tension."),
  ex("bb-shrug", "Barbell Shrug", "shrug", ["traps"], ["forearms"], "barbell", "i", 1, "Heavy, controlled, no rolling."),

  /* ---------- biceps ---------- */
  ex("ez-curl", "EZ-Bar Curl", "curl", ["biceps"], ["forearms"], "ezbar", "i", 0, "Elbows still, full stretch."),
  ex("incline-db-curl", "Incline Dumbbell Curl", "curl", ["biceps"], [], "dumbbell", "i", 0, "Arms hang behind body for the stretch."),
  ex("cable-curl", "Cable Curl", "curl", ["biceps"], [], "cable", "i", 0, "Constant tension, squeeze at top."),
  ex("bb-curl", "Barbell Curl", "curl", ["biceps"], ["forearms"], "barbell", "i", 0, "No hip swing."),
  ex("preacher-curl", "Preacher Curl", "curl", ["biceps"], [], "machine", "i", 0, "Armpits on pad, slow negative."),
  ex("bayesian-curl", "Bayesian Cable Curl", "curl", ["biceps"], [], "cable", "i", 0, "Face away, arm behind body."),
  ex("db-curl", "Alternating Dumbbell Curl", "curl", ["biceps"], ["forearms"], "dumbbell", "i", 0, "Supinate on the way up."),
  ex("spider-curl", "Spider Curl", "curl", ["biceps"], [], "dumbbell", "i", 0, "Chest on incline bench, arms vertical."),
  ex("hammer-curl", "Hammer Curl", "curl_neutral", ["biceps", "forearms"], [], "dumbbell", "i", 0, "Neutral grip, elbows by sides."),
  ex("rope-hammer-curl", "Cable Rope Hammer Curl", "curl_neutral", ["biceps", "forearms"], [], "cable", "i", 0, "Rope, thumbs up."),
  ex("cross-body-curl", "Cross-Body Hammer Curl", "curl_neutral", ["biceps", "forearms"], [], "dumbbell", "i", 0, "Curl toward opposite shoulder."),
  ex("reverse-curl", "Reverse EZ Curl", "curl_neutral", ["forearms", "biceps"], [], "ezbar", "i", 0, "Overhand grip, wrists neutral."),

  /* ---------- squat pattern ---------- */
  ex("hack-squat", "Hack Squat (machine)", "squat", ["quads"], ["glutes"], "machine", "c", 1, "Back flat on pad, deep knees-forward squat."),
  ex("bb-back-squat", "Barbell Back Squat", "squat", ["quads", "glutes"], ["adductors", "lowerBack"], "barbell", "c", 2, "Brace, sit between the hips, knees track toes."),
  ex("front-squat", "Front Squat", "squat", ["quads"], ["glutes", "upperBack"], "barbell", "c", 1, "Elbows high, upright torso."),
  ex("smith-squat", "Smith Machine Squat", "squat", ["quads", "glutes"], [], "smith", "c", 1, "Feet slightly forward, full depth."),
  ex("pendulum-squat", "Pendulum Squat", "squat", ["quads"], ["glutes"], "machine", "c", 0, "Deep, controlled, back supported."),
  ex("belt-squat", "Belt Squat", "squat", ["quads", "glutes"], ["adductors"], "machine", "c", 0, "Load on hips — no spinal compression."),
  ex("goblet-squat", "Goblet Squat", "squat", ["quads"], ["glutes", "abs"], "dumbbell", "c", 0, "Elbows inside knees, chest tall."),
  ex("ssb-squat", "Safety Bar Squat", "squat", ["quads", "glutes"], ["upperBack"], "barbell", "c", 1, "Handles in front, upright torso."),
  ex("high-bar-pause-squat", "Paused Back Squat", "squat", ["quads", "glutes"], ["lowerBack"], "barbell", "c", 2, "2 s pause in the hole, stay braced."),
  ex("v-squat", "V-Squat Machine", "squat", ["quads", "glutes"], [], "machine", "c", 0, "Shoulders under pads, deep range."),

  /* ---------- hinge ---------- */
  ex("rdl", "Romanian Deadlift", "hinge", ["hamstrings", "glutes"], ["lowerBack"], "barbell", "c", 1, "Hips back, bar close, stop at hamstring stretch."),
  ex("db-rdl", "Dumbbell Romanian Deadlift", "hinge", ["hamstrings", "glutes"], ["lowerBack"], "dumbbell", "c", 1, "Neutral spine, soft knees."),
  ex("trapbar-dl", "Trap Bar Deadlift", "hinge", ["glutes", "quads", "hamstrings"], ["lowerBack", "traps"], "trapbar", "c", 1, "Push the floor away, chest tall."),
  ex("deadlift", "Conventional Deadlift", "hinge", ["glutes", "hamstrings", "lowerBack"], ["traps", "forearms"], "barbell", "c", 2, "Bar over mid-foot, wedge in, push floor."),
  ex("sumo-dl", "Sumo Deadlift", "hinge", ["glutes", "adductors", "quads"], ["lowerBack"], "barbell", "c", 2, "Wide stance, knees out, chest up."),
  ex("cable-pull-through", "Cable Pull-Through", "hinge", ["glutes", "hamstrings"], [], "cable", "c", 0, "Hinge, snap hips forward."),
  ex("kb-swing", "Kettlebell Swing", "hinge", ["glutes", "hamstrings"], ["lowerBack"], "kettlebell", "c", 1, "Hip snap, bell floats to chest height."),
  ex("good-morning", "Good Morning", "hinge", ["hamstrings", "lowerBack"], ["glutes"], "barbell", "c", 2, "Light weight, hinge with soft knees."),
  ex("sl-rdl", "Single-Leg Romanian Deadlift", "hinge", ["hamstrings", "glutes"], [], "dumbbell", "c", 0, "Hips square, reach long."),

  /* ---------- single-leg ---------- */
  ex("bss", "Bulgarian Split Squat", "lunge", ["quads", "glutes"], ["adductors"], "dumbbell", "c", 0, "Rear foot elevated, torso slightly forward for glutes."),
  ex("walking-lunge", "Walking Lunge", "lunge", ["quads", "glutes"], ["adductors"], "dumbbell", "c", 0, "Long steps, knee kisses the floor."),
  ex("reverse-lunge", "Reverse Lunge", "lunge", ["glutes", "quads"], [], "dumbbell", "c", 0, "Step back, front shin vertical."),
  ex("step-up", "Dumbbell Step-up", "lunge", ["quads", "glutes"], [], "dumbbell", "c", 0, "Drive through the top foot only."),
  ex("smith-split-squat", "Smith Split Squat", "lunge", ["quads", "glutes"], [], "smith", "c", 0, "Stable bar, focus on depth."),
  ex("sl-leg-press", "Single-Leg Leg Press", "lunge", ["quads", "glutes"], [], "machine", "c", 0, "Fix side imbalances."),

  /* ---------- leg press ---------- */
  ex("leg-press", "Leg Press", "leg_press", ["quads", "glutes"], ["adductors"], "machine", "c", 0, "Lower back stays on pad, deep knees."),
  ex("leg-press-high", "Leg Press (feet high)", "leg_press", ["glutes", "hamstrings"], ["quads"], "machine", "c", 0, "Feet high and wide for posterior chain."),
  ex("horizontal-leg-press", "Seated Horizontal Leg Press", "leg_press", ["quads", "glutes"], [], "machine", "c", 0, "Controlled depth, no bouncing."),

  /* ---------- knee extension ---------- */
  ex("leg-ext", "Leg Extension", "knee_ext", ["quads"], [], "machine", "i", 0, "Pause at the top, slow lower."),
  ex("sl-leg-ext", "Single-Leg Extension", "knee_ext", ["quads"], [], "machine", "i", 0, "One leg at a time, full squeeze."),
  ex("sissy-squat", "Sissy Squat", "knee_ext", ["quads"], [], "bodyweight", "i", 0, "Knees forward, hips stay extended."),

  /* ---------- leg curl ---------- */
  ex("seated-leg-curl", "Seated Leg Curl", "knee_flex", ["hamstrings"], [], "machine", "i", 0, "Lean forward for a bigger stretch."),
  ex("lying-leg-curl", "Lying Leg Curl", "knee_flex", ["hamstrings"], ["calves"], "machine", "i", 0, "Hips pressed down, curl to glutes."),
  ex("nordic-curl", "Nordic Hamstring Curl", "knee_flex", ["hamstrings"], [], "bodyweight", "i", 0, "Slow fall, push back up."),
  ex("sl-leg-curl", "Single-Leg Lying Curl", "knee_flex", ["hamstrings"], [], "machine", "i", 0, "Toes pulled up."),
  ex("swiss-ball-curl", "Swiss Ball Leg Curl", "knee_flex", ["hamstrings"], ["glutes"], "other", "i", 0, "Hips up throughout."),

  /* ---------- glutes ---------- */
  ex("hip-thrust", "Barbell Hip Thrust", "hip_thrust", ["glutes"], ["hamstrings"], "barbell", "c", 0, "Chin tucked, ribs down, lock out with glutes."),
  ex("machine-hip-thrust", "Machine Hip Thrust", "hip_thrust", ["glutes"], ["hamstrings"], "machine", "c", 0, "Pause 1 s at the top."),
  ex("glute-bridge-bb", "Barbell Glute Bridge", "hip_thrust", ["glutes"], [], "barbell", "c", 0, "From the floor, short range, heavy."),
  ex("cable-kickback", "Cable Glute Kickback", "hip_thrust", ["glutes"], [], "cable", "i", 0, "Kick back and slightly out."),

  /* ---------- calves ---------- */
  ex("standing-calf", "Standing Calf Raise", "calf", ["calves"], [], "machine", "i", 0, "Full stretch, 1 s pause at bottom."),
  ex("seated-calf", "Seated Calf Raise", "calf", ["calves"], [], "machine", "i", 0, "Targets soleus — slow reps."),
  ex("leg-press-calf", "Leg Press Calf Raise", "calf", ["calves"], [], "machine", "i", 0, "Balls of feet on edge, full range."),
  ex("smith-calf", "Smith Machine Calf Raise", "calf", ["calves"], [], "smith", "i", 0, "Step under bar, deep stretch."),

  /* ---------- adductors / abductors ---------- */
  ex("adductor-machine", "Hip Adduction Machine", "adductor", ["adductors"], [], "machine", "i", 0, "Lean forward slightly for range."),
  ex("copenhagen", "Copenhagen Plank", "adductor", ["adductors"], ["obliques"], "bodyweight", "i", 0, "Top leg on bench, hips up."),
  ex("abductor-machine", "Hip Abduction Machine", "abductor", ["abductors", "glutes"], [], "machine", "i", 0, "Lean forward for glute med."),
  ex("cable-abduction", "Cable Hip Abduction", "abductor", ["abductors"], [], "cable", "i", 0, "Ankle strap, controlled."),

  /* ---------- back extension ---------- */
  ex("back-ext-45", "45° Back Extension", "back_ext", ["lowerBack", "glutes"], ["hamstrings"], "bodyweight", "i", 0, "Round-free, squeeze glutes at top."),
  ex("reverse-hyper", "Reverse Hyperextension", "back_ext", ["glutes", "lowerBack"], ["hamstrings"], "machine", "i", 0, "Swing legs up with glutes, decompresses spine."),
  ex("bird-dog-row", "Bird Dog", "back_ext", ["lowerBack", "abs"], ["glutes"], "bodyweight", "i", 0, "Opposite arm/leg, hips level."),

  /* ---------- core ---------- */
  ex("cable-crunch", "Cable Crunch", "core_flex", ["abs"], [], "cable", "i", 0, "Curl ribs to pelvis, hips still."),
  ex("hanging-knee-raise", "Hanging Knee Raise", "core_flex", ["abs"], ["forearms"], "bodyweight", "i", 0, "Tilt pelvis up, no swinging."),
  ex("hanging-leg-raise", "Hanging Leg Raise", "core_flex", ["abs"], ["forearms"], "bodyweight", "i", 0, "Straight legs, slow down."),
  ex("decline-crunch", "Decline Crunch", "core_flex", ["abs"], [], "bodyweight", "i", 0, "Hold plate on chest to load."),
  ex("machine-crunch", "Ab Crunch Machine", "core_flex", ["abs"], [], "machine", "i", 0, "Exhale fully at the bottom."),
  ex("captains-chair", "Captain's Chair Leg Raise", "core_flex", ["abs"], [], "machine", "i", 0, "Back on pad, knees to chest."),
  ex("ab-wheel", "Ab Wheel Rollout", "core_anti", ["abs"], ["lats"], "other", "i", 0, "Ribs down, roll only as far as you stay braced."),
  ex("plank", "Plank", "core_anti", ["abs"], ["obliques"], "bodyweight", "i", 0, "Squeeze glutes, push floor away."),
  ex("dead-bug", "Dead Bug", "core_anti", ["abs"], [], "bodyweight", "i", 0, "Lower back flat, slow opposite limbs."),
  ex("body-saw", "Body Saw", "core_anti", ["abs"], [], "other", "i", 0, "Forearms on floor, feet on sliders."),
  ex("pallof", "Pallof Press", "core_rot", ["obliques", "abs"], [], "cable", "i", 0, "Resist rotation, press straight out."),
  ex("cable-woodchop", "Cable Woodchopper", "core_rot", ["obliques"], ["abs"], "cable", "i", 0, "Rotate through thoracic spine, hips stable."),
  ex("side-plank", "Side Plank", "core_rot", ["obliques"], ["abductors"], "bodyweight", "i", 0, "Straight line, hips high."),
  ex("landmine-rotation", "Landmine Rotation", "core_rot", ["obliques"], ["frontDelts"], "barbell", "i", 0, "Arms long, pivot feet."),

  /* ---------- carries ---------- */
  ex("farmer-carry", "Farmer's Carry", "carry", ["forearms", "traps"], ["abs", "obliques"], "dumbbell", "c", 1, "Tall posture, short quick steps."),
  ex("suitcase-carry", "Suitcase Carry", "carry", ["obliques", "forearms"], ["abs"], "dumbbell", "c", 0, "One side loaded, stay upright."),

  /* ---------- conditioning finishers ---------- */
  ex("sled-push", "Sled Push", "conditioning", ["quads", "fullBody"], ["glutes", "calves"], "sled", "c", 0, "Low body angle, drive hard. Great knee-friendly finisher."),
  ex("kb-swing-cond", "Kettlebell Swing Intervals", "conditioning", ["fullBody"], ["glutes", "hamstrings"], "kettlebell", "c", 1, "20 swings every minute on the minute."),
  ex("battle-ropes", "Battle Ropes", "conditioning", ["fullBody"], ["frontDelts"], "other", "c", 0, "30 s on / 30 s off waves."),
  ex("wall-balls", "Wall Balls", "conditioning", ["fullBody"], ["quads", "frontDelts"], "other", "c", 0, "Squat and throw in one motion."),
  ex("db-thruster", "Dumbbell Thrusters", "conditioning", ["fullBody"], ["quads", "frontDelts"], "dumbbell", "c", 1, "Front squat into press, smooth."),
  ex("burpee", "Burpees", "conditioning", ["fullBody"], ["chest", "quads"], "bodyweight", "c", 0, "Steady rhythm over speed."),
  ex("sled-drag", "Backward Sled Drag", "conditioning", ["quads"], ["calves"], "sled", "c", 0, "Short steps, knees over toes."),
  ex("airbike-finisher", "Air Bike Sprints", "conditioning", ["fullBody"], ["quads"], "machine", "c", 0, "8 × 15 s all-out / 45 s easy."),
  ex("erg-finisher", "Rower Sprints", "conditioning", ["fullBody"], ["lats", "quads"], "machine", "c", 0, "6 × 250 m hard / 1 min easy."),
];

export const exerciseById = (id, custom = []) =>
  EXERCISES.find((e) => e.id === id) || custom.find((e) => e.id === id) || null;

export const allExercises = (custom = []) => [...EXERCISES, ...custom];
