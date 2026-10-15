const HOME_PAGE = `${SITE_ROOT}index.html`;
const PUBLIC_LINKS = [
  { href: HOME_PAGE, label: "Início" },
  { href: `${SITE_ROOT}story/story.html`, label: "Minha história" },
  { href: `${SITE_ROOT}gallery/gallery.html`, label: "Galeria" }
];

function pagePath(url) {
  return new URL(url).pathname.replace(/index\.html$/, "");
}

function renderHeader() {
  const header = document.getElementById("site-header");
  const user = getSessionUser();
  const links = user
    ? [...PUBLIC_LINKS, { href: `${SITE_ROOT}dashboard/dashboard.html`, label: "Dashboard" }]
    : [...PUBLIC_LINKS, { href: LOGIN_PAGE, label: "Entrar" }];

  const nav = links
    .map((link) => {
      const active = pagePath(link.href) === pagePath(window.location.href) ? ' class="active"' : "";
      return `<a href="${link.href}"${active}>${link.label}</a>`;
    })
    .join("");

  header.className = "site-header";
  header.innerHTML = `
    <div class="wrap">
      <a href="${HOME_PAGE}" class="logo">Chess <span>Life</span></a>
      <nav class="site-nav">${nav}${user ? '<button type="button" id="logout-button">Sair</button>' : ""}</nav>
    </div>`;

  if (user) {
    document.getElementById("logout-button").addEventListener("click", endSession);
  }
}

function renderFooter() {
  const footer = document.getElementById("site-footer");
  footer.className = "site-footer";
  footer.textContent = "Chess Life · Projeto de Pesquisa e Inovação · SPTech 2026";
}

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;
}

renderHeader();
renderFooter();
