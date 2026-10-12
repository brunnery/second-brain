import { PageHead, Seg } from "../../components/ui.jsx";
import { go } from "../../app/router.js";
import TodayFood from "./TodayFood.jsx";
import MealPlanView from "./MealPlanView.jsx";
import ShoppingView from "./ShoppingView.jsx";
import FoodsView from "./FoodsView.jsx";

const TABS = [["today", "Today"], ["plan", "Meal plan"], ["shop", "Shopping"], ["foods", "Foods"]];

export default function FoodPage({ route }) {
  const t = TABS.some(([k]) => k === route[0]) ? route[0] : "today";
  return (
    <div className="area-food">
      <PageHead eyebrow="Nutrition" title="Food" />
      <div style={{ marginBottom: 14 }}><Seg value={t} onChange={(k) => go(`food/${k}`)} options={TABS} /></div>
      {t === "today" && <TodayFood />}
      {t === "plan" && <MealPlanView />}
      {t === "shop" && <ShoppingView />}
      {t === "foods" && <FoodsView />}
    </div>
  );
}
