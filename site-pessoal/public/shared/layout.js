const FOOTER_TEXT = "Chess Life · Projeto Individual de Pesquisa e Inovação · SPTech 2026 · Igor Fuchs Pereira";
const HOME_PATH = "index.html";
const LOGIN_PATH = "auth/login.html";

/**
 * Fills the page's <aside id="site-sidebar"> with the logo, the navigation menu and the bottom buttons.
 * Closed, the sidebar shows only the icons; the CSS opens it over the page on hover or keyboard focus.
 * Logged-in users see "Jogar" and "Dashboard" in the menu. At the bottom, everyone sees the theme button,
 * followed by "Entrar" for visitors or, in its place, "Sair" for logged-in users.
 */
function renderSidebar() {
  const user = getSessionUser();
  let navigation = "";

  for (const link of getNavigationLinks(user)) {
    const activeClass = isCurrentPage(link.path) ? " active" : "";
    let address = SITE_ROOT + link.path;

    navigation += `
      <a href="${address}" class="sidebar-item${activeClass}" title="${link.label}">
        <span class="sidebar-icon" aria-hidden="true">${link.icon}</span><span class="sidebar-label">${link.label}</span>
      </a>`;
  }

  let bottomButtons = `
    <button type="button" class="sidebar-item" id="theme-button">
      <span class="sidebar-icon" aria-hidden="true"></span><span class="sidebar-label"></span>
    </button>`;
  if (user) {
    bottomButtons += `
      <button type="button" class="sidebar-item danger" id="logout-button" title="Sair">
        <span class="sidebar-icon" aria-hidden="true">⏻</span><span class="sidebar-label">Sair</span>
      </button>`;
  } else {
    const activeClass = isCurrentPage(LOGIN_PATH) ? " active" : "";
    bottomButtons += `
      <a href="${SITE_ROOT}${LOGIN_PATH}" class="sidebar-item${activeClass}" title="Entrar">
        <img class="sidebar-icon door" src="${SITE_ROOT}assets/porta.svg" alt=""><span class="sidebar-label">Entrar</span>
      </a>`;
  }

  const sidebar = document.getElementById("site-sidebar");
  sidebar.className = "sidebar";
  sidebar.innerHTML = `
    <a href="${SITE_ROOT}index.html" class="sidebar-brand">
      <img src="${SITE_ROOT}assets/logo.svg" alt=""><span class="sidebar-label">Chess <span>Life</span></span>
    </a>
    <nav class="sidebar-nav" aria-label="Menu principal">${navigation}</nav>
    <div class="sidebar-bottom">${bottomButtons}</div>`;

  if (user) {
    document.getElementById("logout-button").addEventListener("click", endSession);
  }

  const themeButton = document.getElementById("theme-button");
  updateThemeButton(themeButton);
  themeButton.addEventListener("click", () => {
    toggleTheme();
    updateThemeButton(themeButton);
    // A clicked button keeps the focus, and :focus-within would keep the sidebar open after the mouse leaves.
    themeButton.blur();
  });
}

/**
 * Shows on the theme button the theme it switches to: a sun in the dark theme, a moon in the light one.
 * @param {HTMLButtonElement} button
 */
function updateThemeButton(button) {
  const isDark = getCurrentTheme() === DARK_THEME;
  const label = isDark ? "Modo claro" : "Modo escuro";

  button.querySelector(".sidebar-icon").textContent = isDark ? "☀" : "☾";
  button.querySelector(".sidebar-label").textContent = label;
  button.title = label;
}

/**
 * Lists the menu links, with paths relative to the site root.
 * @param {object|null} user - The logged-in user, or null for a visitor.
 * @returns {{path: string, label: string, icon: string}[]}
 */
function getNavigationLinks(user) {
  const links = [
    { path: HOME_PATH, label: "Minha história", icon: "♚" },
    { path: `${HOME_PATH}#agradecimentos`, label: "Agradecimentos", icon: "♛" },
    { path: "gallery/gallery.html", label: "Galeria", icon: "♝" }
  ];

  if (user) {
    links.push({ path: "play/play.html", label: "Jogar", icon: "♞" });
    links.push({ path: "dashboard/dashboard.html", label: "Dashboard", icon: "♜" });
  }

  return links;
}

/**
 * Tells whether a menu link points to the page being viewed.
 * @param {string} path - Link path relative to the site root.
 * @returns {boolean}
 */
function isCurrentPage(path) {
  const currentPath = window.location.pathname;

  // The server serves the home page at "/", without "index.html" in the address.
  if (path === HOME_PATH && currentPath.endsWith("/")) {
    return true;
  }

  return currentPath.endsWith(path);
}

/**
 * Fills the page's <footer id="site-footer">.
 */
function renderFooter() {
  const footer = document.getElementById("site-footer");
  footer.className = "site-footer";
  footer.textContent = FOOTER_TEXT;
}

/**
 * Shows a feedback message below a form.
 * @param {HTMLElement} element - The element with the "message" class.
 * @param {string} text - Text shown to the user.
 * @param {"error"|"success"} type - Message style.
 */
function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;
}

renderSidebar();
renderFooter();
