/* Tiny hash router: "#/train/plan" → ["train", "plan"]. Back button works. */
import { useSyncExternalStore } from "react";

const read = () => (window.location.hash.replace(/^#\/?/, "") || "home").split("/").filter(Boolean);
let current = typeof window !== "undefined" ? read() : ["home"];
const subs = new Set();
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    current = read();
    subs.forEach((f) => f());
    window.scrollTo(0, 0);
  });
}
export const useRoute = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => current);
export const go = (path) => { window.location.hash = `/${path.replace(/^\/+/, "")}`; };
export const back = () => window.history.back();
