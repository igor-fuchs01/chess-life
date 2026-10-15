// Loaded in every page's <head>, so the saved theme is set before the page is drawn and a dark page never flashes light.
const THEME_STORAGE_KEY = "chess-life-theme";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

/**
 * Returns the theme to show: the one the user chose, or the system's when they never chose one.
 * @returns {"dark"|"light"}
 */
function getPreferredTheme() {
  let savedTheme = null;

  // Storage can be blocked by the browser; the system theme is used then.
  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    savedTheme = null;
  }

  if (savedTheme === DARK_THEME || savedTheme === LIGHT_THEME) {
    return savedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK_THEME : LIGHT_THEME;
}

/**
 * Returns the theme the page is showing.
 * @returns {"dark"|"light"}
 */
function getCurrentTheme() {
  return document.documentElement.dataset.theme;
}

/**
 * Switches between the light and dark themes, saves the choice and fires a "themechange" event
 * on document, for pages that draw with the theme's colors, such as the dashboard charts.
 */
function toggleTheme() {
  const theme = getCurrentTheme() === DARK_THEME ? LIGHT_THEME : DARK_THEME;
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage is blocked: the choice lasts until the page is left.
  }

  document.dispatchEvent(new Event("themechange"));
}

document.documentElement.dataset.theme = getPreferredTheme();
