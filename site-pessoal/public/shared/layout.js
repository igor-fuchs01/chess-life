const FOOTER_TEXT = "Chess Life · Projeto Individual de Pesquisa e Inovação · SPTech 2026 · Igor Fuchs Pereira";

/**
 * Fills the page's <header id="site-header"> with the logo and the navigation menu.
 * Visitors see "Entrar"; logged-in users see "Dashboard" and "Sair".
 */
function renderHeader() {
  const user = getSessionUser();
  let navigation = "";

  for (const link of getNavigationLinks(user)) {
    const activeClass = isCurrentPage(link.path) ? ' class="active"' : "";
    navigation += `<a href="${SITE_ROOT}${link.path}"${activeClass}>${link.label}</a>`;
  }

  if (user) {
    navigation += '<button type="button" id="logout-button">Sair</button>';
  }

  const header = document.getElementById("site-header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="wrap">
      <a href="${SITE_ROOT}index.html" class="logo"><img src="${SITE_ROOT}shared/logo.svg" alt=""><titulo>Chess <span>Life</span></titulo></a>
      <nav class="site-nav">${navigation}</nav>
    </div>`;

  if (user) {
    document.getElementById("logout-button").addEventListener("click", endSession);
  }
}

/**
 * Lists the menu links, with paths relative to the site root.
 * @param {object|null} user - The logged-in user, or null for a visitor.
 * @returns {{path: string, label: string}[]}
 */
function getNavigationLinks(user) {
  const links = [
    { path: "index.html", label: "Início" },
    { path: "story/story.html", label: "Minha história" },
    { path: "gallery/gallery.html", label: "Galeria" }
  ];

  if (user) {
    links.push({ path: "dashboard/dashboard.html", label: "Dashboard" });
  } else {
    links.push({ path: "auth/login.html", label: "Entrar" });
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
  if (path === "index.html" && currentPath.endsWith("/")) {
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

renderHeader();
renderFooter();
