// Keeps annuity screen state in the URL so browser Back / Forward / refresh / shared links behave properly.
//  - filters, page and tab use `replace` (changing a filter must not fill the history with entries)
//  - opening a record PUSHES an entry, so Back closes the dialog instead of leaving the screen;
//    closing pops that entry (or just removes the param when the page was opened straight from a link)
import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const MODAL_FLAG = "annuityModal";

/** A single query-string value (string), updated with `replace`. */
export function useUrlParam(key: string, fallback = "", resetPage = key !== "page"): [string, (v: string | null) => void] {
  const [sp, setSp] = useSearchParams();
  const value = sp.get(key) ?? fallback;
  const set = useCallback(
    (v: string | null) =>
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (v === null || v === "" || v === fallback) n.delete(key);
          else n.set(key, v);
          if (resetPage) n.delete("page"); // a new filter starts again from page 1
          return n;
        },
        { replace: true },
      ),
    [key, fallback, resetPage, setSp],
  );
  return [value, set];
}

/** The `page` query value as a number (>= 1). */
export function useUrlPage(key = "page"): [number, (p: number) => void] {
  const [raw, setRaw] = useUrlParam(key, "1");
  const n = parseInt(raw, 10);
  return [Number.isFinite(n) && n > 0 ? n : 1, (p) => setRaw(String(p))];
}

/** An "open record" param: push on open, pop on close. */
export function useModalParam(key = "open", clearKeys: string[] = []): { value: string | null; open: (v: string) => void; close: () => void } {
  const [sp, setSp] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const value = sp.get(key);

  const open = useCallback(
    (v: string) =>
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set(key, v);
          clearKeys.forEach((k) => n.delete(k)); // e.g. reset the dialog tab when another record is opened
          return n;
        },
        { replace: false, state: { [MODAL_FLAG]: true } },
      ),
    [key, clearKeys.join(","), setSp],
  );

  const close = useCallback(() => {
    if ((location.state as any)?.[MODAL_FLAG]) {
      navigate(-1); // we pushed it, so go back to the list entry
    } else {
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.delete(key);
          clearKeys.forEach((k) => n.delete(k));
          return n;
        },
        { replace: true },
      );
    }
  }, [key, clearKeys.join(","), location.state, navigate, setSp]);

  return { value, open, close };
}
