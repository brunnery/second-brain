import { Home, Dumbbell, UtensilsCrossed, Wallet, Menu } from "lucide-react";
import { useRoute, go } from "./app/router.js";
import { ToastHost } from "./components/ui.jsx";
import { useProfile } from "./features/profile/store.js";
import Onboarding from "./features/profile/Onboarding.jsx";
import HomePage from "./features/home/HomePage.jsx";
import TrainPage from "./features/training/TrainPage.jsx";
import FoodPage from "./features/nutrition/FoodPage.jsx";
import MoneyPage from "./features/finance/MoneyPage.jsx";
import MorePage from "./features/settings/MorePage.jsx";
import { useFeedSnapshot } from "./features/coach.js";
import { useRecurringAutobook } from "./features/finance/MoneyPage.jsx";

const TABS = [
  { key: "home", label: "Today", Icon: Home, color: "var(--text)" },
  { key: "train", label: "Train", Icon: Dumbbell, color: "var(--train)" },
  { key: "food", label: "Food", Icon: UtensilsCrossed, color: "var(--food)" },
  { key: "money", label: "Money", Icon: Wallet, color: "var(--money)" },
  { key: "more", label: "More", Icon: Menu, color: "var(--text)" },
];

export default function App() {
  const [profile] = useProfile();
  const route = useRoute();
  const [section, ...rest] = route;
  useFeedSnapshot();
  useRecurringAutobook();

  if (!profile.onboarded) return <Onboarding />;

  let page;
  if (section === "train") page = <TrainPage route={rest} />;
  else if (section === "food") page = <FoodPage route={rest} />;
  else if (section === "money") page = <MoneyPage route={rest} />;
  else if (section === "more") page = <MorePage route={rest} />;
  else page = <HomePage />;

  const active = TABS.find((t) => t.key === section)?.key || "home";

  return (
    <>
      <main className="app">{page}</main>
      <nav className="tabbar" aria-label="Main">
        <div className="tabbar-inner">
          {TABS.map(({ key, label, Icon, color }) => (
            <button key={key} className={`tab ${active === key ? "on" : ""}`} style={{ "--tabc": color }}
              aria-current={active === key ? "page" : undefined} onClick={() => go(key)}>
              <Icon size={21} strokeWidth={active === key ? 2.4 : 1.9} />
              {label}
              <span className="pip" />
            </button>
          ))}
        </div>
      </nav>
      <ToastHost />
    </>
  );
}
