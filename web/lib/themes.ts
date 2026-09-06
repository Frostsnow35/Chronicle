export type ThemeKey = "orange" | "blue";

export interface ThemeDef {
  label: string;
  accent: string;
  accentStrong: string;
  secondary: string;
}

export const THEMES: Record<ThemeKey, ThemeDef> = {
  orange: {
    label: "暖橙",
    accent: "#ff6b00",
    accentStrong: "#e05e00",
    secondary: "#38bdf8"
  },
  blue: {
    label: "海蓝",
    accent: "#0ea5e0",
    accentStrong: "#0b85b4",
    secondary: "#ff6b00"
  }
};

export const DEFAULT_THEME: ThemeKey = "orange";

export function isThemeKey(value: string | null | undefined): value is ThemeKey {
  return value === "orange" || value === "blue";
}

export function getTheme(value: string | null | undefined): ThemeDef {
  return THEMES[isThemeKey(value) ? value : DEFAULT_THEME];
}
