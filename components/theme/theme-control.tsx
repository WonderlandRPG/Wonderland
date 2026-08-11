"use client";

import { useEffect, useMemo, useState } from "react";
import { themeDefinitions, type ThemeAvailability, type ThemeName } from "@/lib/content/theme-definitions";

const themeStorageKey = "wonderland:theme";

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // A escolha continua válida durante a sessão quando o navegador bloqueia o armazenamento.
  }
}

export function ThemeControl({ availability, isAdmin }: { availability: ThemeAvailability; isAdmin: boolean }) {
  const [theme, setTheme] = useState<ThemeName>("classic");
  const [open, setOpen] = useState(false);
  const themes = useMemo(
    () => themeDefinitions.filter((option) => availability[option.key] || isAdmin),
    [availability, isAdmin],
  );

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(themeStorageKey);
    } catch {
      // O tema clássico continua disponível sem armazenamento local.
    }
    const requested = themeDefinitions.some((entry) => entry.key === stored) ? stored as ThemeName : "classic";
    const current: ThemeName = availability[requested] || isAdmin ? requested : "classic";
    document.documentElement.dataset.theme = current;
    queueMicrotask(() => setTheme(current));
  }, [availability, isAdmin]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  function choose(nextTheme: ThemeName) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setOpen(false);
  }

  return (
    <aside className={`theme-control ${open ? "is-open" : ""}`}>
      {open ? (
        <div className="theme-control__menu" role="group" aria-label="Escolha o tema do site">
          <header>
            <span>APARÊNCIA</span>
            <strong>Escolha seu tema</strong>
            <small>A preferência será usada em todas as páginas.</small>
          </header>
          {themes.map((option) => (
            <button
              aria-pressed={theme === option.key}
              className={theme === option.key ? "is-active" : ""}
              key={option.key}
              onClick={() => choose(option.key)}
              type="button"
            >
              <i aria-hidden="true">{option.icon}</i>
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
              <b aria-hidden="true">{theme === option.key ? "✓" : ""}</b>
            </button>
          ))}
        </div>
      ) : null}
      <button
        aria-expanded={open}
        aria-label="Escolher tema do site"
        className="theme-control__toggle"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true">{themeDefinitions.find((entry) => entry.key === theme)?.icon ?? "☀"}</span>
        <small>
          <b>Tema</b>
          <em>{themeDefinitions.find((entry) => entry.key === theme)?.label ?? "Aurora Real"}</em>
        </small>
      </button>
    </aside>
  );
}
