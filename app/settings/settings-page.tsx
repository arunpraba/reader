"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { useTheme } from "../theme-provider";
import type { ThemeKind } from "../../lib/themes";

type Filter = "all" | ThemeKind;

export function SettingsPage() {
  const { themeId, themes, setThemeId } = useTheme();
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () =>
      filter === "all"
        ? themes
        : themes.filter((theme) => theme.kind === filter),
    [filter, themes],
  );

  return (
    <main className="theme-settings">
      <header className="theme-settings-header">
        <Link href="/" className="back-link">
          <span className="back-link-icon" aria-hidden>
            ←
          </span>
          Library
        </Link>
        <div>
          <p className="eyebrow">Appearance</p>
          <h1>Color Theme</h1>
          <p className="theme-settings-lead">
            Choose a color theme for Margin. Your selection is saved on this
            device.
          </p>
        </div>
      </header>

      <div
        className="theme-filter"
        role="group"
        aria-label="Filter themes by kind"
      >
        {(
          [
            ["all", "All"],
            ["light", "Light"],
            ["dark", "Dark"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "selected" : undefined}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="theme-list" role="listbox" aria-label="Color themes">
        {visible.map((theme) => {
          const selected = theme.id === themeId;
          return (
            <li key={theme.id}>
              <button
                type="button"
                className={`theme-option${selected ? " selected" : ""}`}
                role="option"
                aria-selected={selected}
                onClick={() => setThemeId(theme.id)}
              >
                <span
                  className="theme-preview"
                  aria-hidden
                  style={
                    {
                      "--swatch-bg": theme.preview.bg,
                      "--swatch-surface": theme.preview.surface,
                      "--swatch-ink": theme.preview.ink,
                      "--swatch-accent": theme.preview.accent,
                      "--swatch-green": theme.preview.green,
                    } as CSSProperties
                  }
                >
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="theme-option-copy">
                  <strong>{theme.label}</strong>
                  <small>{theme.description}</small>
                </span>
                <span className="theme-option-kind">{theme.kind}</span>
                {selected ? (
                  <span className="theme-option-check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
