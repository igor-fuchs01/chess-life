const PUBLIC_LINKS = [
  { href: "/", label: "Início" },
  { href: "/story/story.html", label: "Minha história" },
  { href: "/gallery/gallery.html", label: "Galeria" }
];

function renderHeader() {
  const header = document.getElementById("site-header");
  const user = getSessionUser();
  const links = user
    ? [...PUBLIC_LINKS, { href: "/dashboard/dashboard.html", label: "Dashboard" }]
    : [...PUBLIC_LINKS, { href: LOGIN_PAGE, label: "Entrar" }];

  const nav = links
    .map((link) => {
      const active = link.href === window.location.pathname ? ' class="active"' : "";
      return `<a href="${link.href}"${active}>${link.label}</a>`;
    })
    .join("");

  header.className = "site-header";
  header.innerHTML = `
    <div class="wrap">
      <a href="/" class="logo">Chess <span>Life</span></a>
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
