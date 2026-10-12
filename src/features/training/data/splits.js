/* ================================================================
   SPLIT TEMPLATES
   A day is a list of slots: { p: pattern, role, v: variation index }.
   The generator fills each slot with an exercise of that pattern.
   Slots are listed in priority order — when the session is short,
   the last accessory slots are dropped first.
   Pull days always carry a posture slot (face pull / rear delt / Y-raise)
   because of the Scheuermann focus.
   ================================================================ */

const P = (p, v = 0) => ({ p, role: "primary", v });
const S = (p, v = 0) => ({ p, role: "secondary", v });
const A = (p, v = 0) => ({ p, role: "accessory", v });

const DAYS = {
  pushA: { name: "Push A", focus: "Chest · shoulders · triceps", slots: [P("h_press"), S("incline_press"), S("v_press"), A("lat_raise"), A("chest_fly"), A("tri_overhead"), A("tri_pushdown")] },
  pushB: { name: "Push B", focus: "Shoulders · upper chest · triceps", slots: [P("v_press"), S("incline_press", 1), S("h_press", 1), A("lat_raise", 1), A("tri_press"), A("chest_fly", 1), A("dip")] },
  pullA: { name: "Pull A", focus: "Back thickness · biceps", slots: [P("h_row"), S("v_pull"), A("rear_delt"), S("h_row", 1), A("curl"), A("curl_neutral"), A("shrug")] },
  pullB: { name: "Pull B", focus: "Back width · biceps · posture", slots: [P("v_pull", 2), S("h_row", 4), A("rear_delt", 1), A("pullover"), A("curl", 1), A("curl_neutral", 1), A("back_ext")] },
  legsA: { name: "Legs A", focus: "Quads · calves · abs", slots: [P("squat"), S("leg_press"), S("lunge"), A("knee_ext"), A("knee_flex", 1), A("calf"), A("core_flex")] },
  legsB: { name: "Legs B", focus: "Hamstrings · glutes · core", slots: [P("hinge"), S("hip_thrust"), S("squat", 4), A("knee_flex"), A("calf", 1), A("core_anti"), A("adductor")] },

  upperA: { name: "Upper A", focus: "Horizontal push & pull", slots: [P("h_press"), S("h_row"), S("v_pull"), S("v_press"), A("rear_delt"), A("curl"), A("tri_pushdown")] },
  upperB: { name: "Upper B", focus: "Vertical push & pull", slots: [P("v_pull", 2), S("incline_press"), S("h_row", 1), A("lat_raise"), A("rear_delt", 1), A("tri_overhead"), A("curl_neutral")] },
  lowerA: { name: "Lower A", focus: "Squat focus", slots: [P("squat"), S("hinge"), S("leg_press"), A("knee_ext"), A("calf"), A("core_flex"), A("knee_flex", 1)] },
  lowerB: { name: "Lower B", focus: "Hinge focus", slots: [P("hinge"), S("lunge"), S("hip_thrust"), A("knee_flex"), A("calf", 1), A("core_anti"), A("knee_ext", 1)] },

  fullA: { name: "Full Body A", focus: "Squat · press · row", slots: [P("squat"), S("h_press"), S("h_row"), A("lat_raise"), A("curl"), A("core_flex"), A("calf")] },
  fullB: { name: "Full Body B", focus: "Hinge · overhead · pull-up", slots: [P("hinge"), S("v_press"), S("v_pull"), S("lunge"), A("tri_overhead"), A("rear_delt"), A("core_anti")] },
  fullC: { name: "Full Body C", focus: "Legs · incline · row", slots: [P("incline_press"), S("leg_press"), S("h_row", 1), A("knee_flex"), A("rear_delt", 1), A("curl_neutral"), A("core_rot")] },
};

/* days per week → day keys + default weekdays (0 = Mon) */
export const SPLITS = {
  3: { name: "Full body ×3", days: ["fullA", "fullB", "fullC"], weekdays: [0, 2, 4] },
  4: { name: "Upper / Lower ×2", days: ["upperA", "lowerA", "upperB", "lowerB"], weekdays: [0, 1, 3, 4] },
  5: { name: "Upper / Lower + Push / Pull / Legs", days: ["upperA", "lowerA", "pushB", "pullB", "legsB"], weekdays: [0, 1, 3, 4, 5] },
  6: { name: "Push / Pull / Legs ×2", days: ["pushA", "pullA", "legsA", "pushB", "pullB", "legsB"], weekdays: [0, 1, 2, 3, 4, 5] },
};

export const dayTemplate = (key) => DAYS[key];
export const isLegDay = (key) => ["legsA", "legsB", "lowerA", "lowerB"].includes(key);
