"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("subflo-theme");
    if (saved === "light") { setDark(false); document.documentElement.setAttribute("data-theme", "light"); }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("subflo-theme", next ? "dark" : "light");
  }

  return (
    <button onClick={toggle} className="sf-btn sf-btn-ghost p-1.5" title={dark ? "Light mode" : "Dark mode"}>
      {dark ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 9.3A6 6 0 116.7 2 4.5 4.5 0 0014 9.3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )}
    </button>
  );
}
