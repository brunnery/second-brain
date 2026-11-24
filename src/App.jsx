import { Home, Moon, Menu } from "lucide-react";
import { useRoute, go } from "./app/router.js";
import { ToastHost } from "./components/ui.jsx";
import { useProfile } from "./features/profile/store.js";
import Onboarding from "./features/profile/Onboarding.jsx";
import TodayPage from "./features/today/TodayPage.jsx";
import RoutinesView from "./features/routines/RoutinesView.jsx";
import { PageHead } from "./components/ui.jsx";
import MorePage from "./features/settings/MorePage.jsx";
import { useFeedSnapshot, useMigrations } from "./features/coach.js";

const TABS = [
  { key: "home", label: "Today", Icon: Home, color: "var(--text)" },
  { key: "routines", label: "Routines", Icon: Moon, color: "var(--mobility)" },
  { key: "more", label: "More", Icon: Menu, color: "var(--text)" },
];

export default function App() {
  const [profile] = useProfile();
  const route = useRoute();
  const [section, ...rest] = route;
  useFeedSnapshot();
  useMigrations();

  if (!profile.onboarded) return <Onboarding />;

  let page;
  // Simplified app (Nov 2026): Train / Food / Money tabs are hidden, their code and data stay.
  if (section === "routines" || (section === "train" && rest[0] === "mobility")) page = <><PageHead eyebrow="Evenings" title="Routines" /><RoutinesView /></>;
  else if (section === "more") page = <MorePage route={rest} />;
  else page = <TodayPage />;

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
