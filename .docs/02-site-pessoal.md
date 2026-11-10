# site-pessoal — Application

`site-pessoal/` holds the Chess Life application. The specification it implements is in [`01-project.md`](01-project.md).

The folder started as a copy of SPTech's **web-data-viz** template (`BandTec/web-data-viz`, built for the "AquaTech" sample project). Its back-end (`app.js` and `src/`) was rebuilt from the template's code for Chess Life (section 4). Its legacy front-end was removed and rebuilt for Chess Life.

## 1. Running

```
cd site-pessoal
npm install
npm start        # or: npm run dev (restarts on file changes, uses nodemon)
```

- `app.js` picks the environment file on its first lines: `.env` for `producao` (remote database) and `.env.dev` for `desenvolvimento` (local database).
- Both files hold `AMBIENTE_PROCESSO`, `DB_HOST`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `APP_PORT` and `APP_HOST`. They contain credentials and are ignored by git, so never commit them.
- The site runs at `http://APP_HOST:APP_PORT`. Variables already set in the shell win over the file, for example `APP_PORT=3399 npm start`.
- Before the first run, create the database and the application user with `src/database/01-schema.sql`, `02-seed.sql` and `03-app-user.sql` (section 7 of [`03-database.md`](03-database.md)). Then set `DB_DATABASE=chess_life`, `DB_USER=chess_life_user` and that user's password in `DB_PASSWORD` in the environment file. The scripts start over: `01-schema.sql` drops the database with all its accounts and attempts, so run them again only when that is wanted.

There are no automated tests or lint setup yet.

## 2. Structure

```
site-pessoal/
├── app.js                  Express server: static files from public/ and API routers
├── package.json            express, mysql2, dotenv, cors, nodemon
├── src/                    Back-end: routes → controllers → models, and the database scripts (section 4)
└── public/                 Chess Life front-end, one folder per feature
    ├── index.html          Home page
    ├── shared/             Used by every page
    │   ├── style.css       Design tokens and base styles (classic design)
    │   ├── theme.js        Light and dark theme, loaded in every page's <head>
    │   ├── session.js      Session in sessionStorage
    │   ├── layout.js       Sidebar, footer and form messages
    │   └── profile-form.js Player profile fields (opening options, reading, checks), for sign-up and the profile dialog
    ├── home/               Home page styles (hero, story timeline, competencies, thanks, inspirations)
    ├── gallery/            Photo gallery page
    ├── assets/             Images shared by the pages, including every SVG: the gallery photos, the logo (`logo.svg`, used in the sidebar and as the favicon), the sidebar door icon (`porta.svg`) and the animated Accelerated Dragon board (`dragao-acelerado.svg`)
    ├── auth/               Login and sign-up pages; password.js checks the password strength on sign-up
    ├── play/               Restricted exercise pages: play.html (start screen: profile.js, play.js), game.html (the exercise board: rules.js and game.js)
    └── dashboard/          Restricted dashboard: indicators, charts and the user's attempts
```

## 3. Front-end

### Design

The site uses the "classic" direction chosen by the user: cream paper (`--paper`), deep green (`--green`) and brass (`--brass`), a serif for headings (`--font-heading`: Georgia) and a sans-serif for text (`--font-body`: Segoe UI or the system font). Only fonts already installed on the user's system are used, with no web fonts. Colors and fonts are CSS variables in the `:root` block of `shared/style.css`; feature styles only use those variables.

### Light and dark themes

- The sidebar has a button (☾ / ☀, "Modo escuro" / "Modo claro") that switches between the light and the dark theme. The choice is saved in `localStorage` (`chess-life-theme`). Before any choice, the site follows the system theme (`prefers-color-scheme`).
- `shared/theme.js` is loaded in the `<head>` of every page, right after the stylesheets. It sets `data-theme="light"` or `"dark"` on `<html>` before the page is drawn, so a dark page never flashes light. `toggleTheme()` switches the theme and saves it; if the browser blocks storage, the theme still switches for that page.
- The dark palette is a single `:root[data-theme="dark"]` block in `shared/style.css` that redefines the color variables, plus `color-scheme: dark` for form controls and scrollbars. Feature stylesheets have no theme rules of their own.
- Variables by role:
  - `--green`: surfaces, such as buttons and the board frame.
  - `--green-text`: green text on the page background. It is lighter in the dark theme.
  - `--light-ink`: text on green surfaces and photos, the same in both themes.
  - `--dark-ink`: pieces on the board and the dark photo tile, the same in both themes.
- The board squares keep their wood colors in both themes.
- The dashboard charts read their colors from the variables, and draw again when the theme button is clicked (`dashboard.js` listens to the button itself; there is no custom theme event).
  - `--win` and `--loss` color the right and wrong attempts in the charts and the dashboard tags. They are opposite poles (green and rust), checked with a color-vision validator: in both themes they are far apart for normal vision (ΔE 23.3 light, 25.3 dark, against a floor of 15), and for color-blind readers they sit in the 6–8 band that needs a second channel, so every result also shows as text (legend counts, tag words) and stacked segments keep a 2px gap. The `--draw` color left with the games, since an attempt has no draw.
- Every text color pair passes the WCAG contrast minimum in the dark theme (4.5:1 for text, 3:1 for large text and chart bars). In the light theme, `--brass` on `--paper` (2.7:1) is below 3:1, which predates the dark theme.

### Pages

| URL | Feature folder | Access | API used |
| --- | --- | --- | --- |
| `/` | `index.html`, `home/` | Public | — |
| `/gallery/gallery.html` | `gallery/` | Public | — |
| `/auth/login.html` | `auth/` | Public | `POST /usuarios/autenticar` |
| `/auth/signup.html` | `auth/` | Public | `POST /usuarios/cadastrar` |
| `/play/play.html` (`?lista=` opens a list) | `play/` | Restricted | `GET /perfis/buscar`, `PUT /perfis/atualizar`, `GET /listas/listar`, `GET /exercicios/listar` |
| `/play/game.html` (`?lista=2&exercicio=6`) | `play/` | Restricted | `GET /exercicios/buscar`, `GET /exercicios/listar`, `POST /tentativas/cadastrar` |
| `/dashboard/dashboard.html` | `dashboard/` | Restricted | `GET /tentativas/listar`, `GET /listas/listar` |

### Conventions

- Every page has empty `<aside id="site-sidebar">` and `<footer id="site-footer">` elements. It loads `shared/theme.js` in `<head>`, then `shared/session.js` and `shared/layout.js`, which fills them. The menu shows "Exercícios" and "Dashboard" only to logged-in users. The bottom of the sidebar shows the theme button and, below it, "Entrar" to visitors or, in the same place, "Sair" to logged-in users.
- Sidebar (styles under "Sidebar" in `shared/style.css`): a floating bar fixed on the left, replacing the old header, with the `--card` background, a `--line` border and a shadow. Closed it is `--sidebar-rail` (68px) wide and shows only the icons; on hover or focus (`:focus-within`) it widens to `--sidebar-open` (240px) over the page and shows the labels, with no JavaScript. A button clicked with the mouse keeps the focus, which would keep the bar open, so the theme button calls `blur()` after switching the theme. There is no strip reserved for the bar: sections, their backgrounds and the footer span the whole window, under the sidebar. Only their content moves: `.wrap` adds `--sidebar-space` to its left padding and to its `max-width`, so the content keeps clear of the closed bar and is centered in the space to its right, and the footer text gets the same left padding. Rules that override `.wrap`'s width (`.auth`, `.dash .wrap`, `.play .wrap`) add `--sidebar-space` too, and the home `.hero` sets only its top and bottom padding, so it keeps the `.wrap` side padding. Hovered items get the `--paper-2` background and green text. The current page is a `--green` item, "Sair" turns `--danger` on hover, and the theme button and "Entrar" or "Sair" sit at the bottom. The page icons are chess pieces: ♚ Minha história, ♝ Galeria, ♞ Exercícios, ♜ Dashboard. "Entrar" is a door, `assets/porta.svg`, in an `<img class="sidebar-icon door">`; its stroke is a neutral brown that reads in both themes, since an SVG loaded as an image cannot follow the text color (the door character is a color emoji on most systems). "Sair" is ⏻. Right below "Minha história", every visitor sees ♛ Agradecimentos (always a queen, the user's choice), which scrolls to the home page section `#agradecimentos`. From other pages it opens `index.html#agradecimentos`; on the home page it keeps only `#agradecimentos`, because the server serves that page at `/` and a link to `index.html` would reload it instead of scrolling. `html` has `scroll-behavior: smooth`, and the section link is never marked as the current page. Every item has a `title`, so its name shows while the bar is closed.
- Authentication is the user's session in the browser, through `shared/session.js` (see "Authentication" below).
- Form feedback uses `showMessage(element, text, "error" | "success")` from `shared/layout.js` (RF11).
- Pages use relative paths for their files, so they also open straight from disk. Scripts build links from `SITE_ROOT` (`shared/session.js`). API calls only work when the site is served by `app.js`.
- Every SVG file of the front-end lives in `public/assets/`, with the other images, and icons are files there instead of SVG markup written in the scripts.
- An element whose class sets `display` ignores the `hidden` attribute, so classes used on elements that JavaScript hides do not set `display`: `.btn` keeps the native button display, and `.player-stats` places its items with `display: inline-block` on the children. The site uses no attribute selectors such as `[hidden]`.
- CSS stays plain: no `color-mix`, `mask`, `backdrop-filter`, `:has()`, container query units or attribute selectors. Shared rules used by more than one page live in `shared/style.css`: `.field-row` (two fields side by side, stacked on phones) and the `dialog` element style with its `::backdrop`.
- Forms are validated on the client too, for a quick reply: strong password (RN02: at least 8 characters with an uppercase letter, a lowercase letter, a digit and a special character), valid e-mail and matching confirmation. The server must repeat these checks. The password strength is checked by `validatePasswordStrength` in `auth/password.js`, on sign-up only, before any request is sent. Login does not check it, on the page or in the API, so users whose password was saved before RN02 can still log in. The sign-up error shows in the form message below the submit button.
- Login and sign-up layout (`auth/auth.css`): the `.alt` section fills `<main>`, so its background reaches the footer, and the form sits in its middle. Spacing is compact: smaller fields (7px padding, 15px text) and small label margins. The footer of every page has 20px of vertical padding (`.site-footer` in `shared/style.css`). The sign-up form (a 640px card) shows "Sua conta" and then "Seu perfil de jogador" one below the other (`.signup-sections`, `flex-direction: column`), each with two rows of paired fields (`.field-row`), and its title puts the ornament on the left of "Crie a sua conta". Both pages fit the window with the footer, without scrolling, even with an error message, down to 1280×720. On phones the fields stack and sign-up scrolls.
- Sign-up creates the account and the player profile at once (`POST /usuarios/cadastrar`). Below the account fields, the "Seu perfil de jogador" block has rating, "Joga desde", favorite opening (a normal dropdown with "Nenhuma" first, filled with the openings mocked in `shared/profile-form.js`) and a bio of up to 50 characters. The opening is optional, for a user who does not know one or has no favorite; the other three are required. The profile fields are read and checked by `shared/profile-form.js`, the same code the profile dialog uses.
- User-provided text goes into the page with `textContent`, never `innerHTML`.
- Chart.js 4.4.1 is loaded from cdnjs only on the dashboard.
- Dashboard layout (`dashboard/dashboard.css`): on screens wider than 800px the page fills the window exactly and never scrolls, and its footer is hidden. It uses plain flexbox: `body` is `100vh`, and each box down to the charts takes the free height with `flex: 1` and `min-height: 0`. The two `.panel-row` rows share that height, the charts fill their panels (Chart.js with `maintainAspectRatio = false`) and the attempts table scrolls inside its panel. It was made for small windows such as a notebook at 1920×1080 with Windows' 125% zoom, where the browser shows only about 1536×730. On phones the panels stack, the charts and the table are 260px tall and the page scrolls.
- The board's base style (`.board`, `.light`, `.dark`) is in `shared/style.css`. The exercise page draws its board with `play/game.js`; the home page shows `assets/dragao-acelerado.svg` in an `<img class="board">`, so it gets the same frame and shadow.
- The home page board is an animated SVG of the Accelerated Dragon (1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6), with no JavaScript. Its CSS animations share one 16s cycle: each move takes 0.6s with 0.9s between moves, the final position stays on screen, and the pieces fade out and back in before the opening repeats. With `prefers-reduced-motion`, it stops on the final position. Its colors are written in the file, since an SVG loaded by `<img>` cannot read the page's CSS variables; the board squares are the same in both themes anyway.
- Layouts use flexbox, never CSS grid. The board is a wrapping flex container whose 64 squares are each `12.5%` wide and square (`aspect-ratio: 1`); the gallery photos are a third of the row minus the gaps; the dashboard panels sit in two `.panel-row` rows, with `.panel.wide` taking twice the width of the other panel.
- Code and identifiers are in English; text shown to users is in Portuguese.

### Authentication

Authentication is done by the user's session in the browser, decided on 2026-10-25. After a successful login the page saves the user in the tab's `sessionStorage`, and every page reads it from there. There is no token, cookie or server session: the server only checks the e-mail and password once, at login.

| Function (`shared/session.js`) | What it does | Called by |
| --- | --- | --- |
| `startSession(user)` | Saves `USER_ID`, `USER_NAME` and `USER_EMAIL` in `sessionStorage` | `auth/login.js`, after `POST /usuarios/autenticar` replies `200` |
| `getSessionUser()` | Returns `{ id, name, email }`, or `null` for a visitor | `shared/layout.js`, `dashboard/dashboard.js`, `play/play.js`, `play/game.js` |
| `requireSession()` | Sends a visitor to the login page | The `<head>` of every restricted page |
| `endSession()` | Clears `sessionStorage` and opens the login page | The "Sair" button of the navigation |

### Exercise pages

The restricted area is an exercise solver, on two pages. `/play/play.html` (the sidebar's "Exercícios") is the start screen, with the user's profile and the three exercise lists. `/play/game.html` is the board where one exercise is solved. Games between two people were removed on 2026-11-09.

- **Start screen** (`play/play.html`, styles in `play/play.css`), from top to bottom:
  - **Player card** (`.player-card`): a green band with the logged-in user's name and their profile (bio, rating, "Joga desde" and favorite opening), with the "Editar perfil" button.
  - **Listas de exercícios** (`play/play.js`, with the `<template>`s `#list-card-template` and `#exercise-row-template` in `play/play.html`): one wide button per list (`.list-option`), with its level number on a light square, its name, its description and the user's progress ("2/5"), from `GET /listas/listar/:idUsuario`. Clicking one marks it (`.selected`) and fills a table below (`#exercises-section`) with its exercises, from `GET /exercicios/listar/:idLista/:idUsuario`: a row per exercise with its number, a link to it, its status ("✓ Resolvido" or "Pendente") and an "Abrir" button. Both open `game.html?lista=<id>&exercicio=<id>`. The page opens the list named in `?lista=`, which the exercise page's "Voltar às listas" link sends.
  - **Como funciona** (`.rule-tiles`): four short tiles in a row: moving, the opponent's reply, a wrong move ends the attempt, and every attempt is saved.
- **Profile** (`play/profile.js`, with `shared/profile-form.js`): the profile is created at sign-up, so here it is only read and edited. The start screen reads it with `GET /perfis/buscar/:idUsuario`, fills the favorite opening options with the openings mocked in `shared/profile-form.js`, and shows on the card the opening's name, which the API returns as it was saved. The player card's "Editar perfil" button, shown only when the profile was found, opens a `<dialog>` (`#profile-dialog`) with the profile form: rating, "Joga desde" (`ano_inicio`), favorite opening, shown as a box of six rows with its own scrollbar (`size="6"`, since the native dropdown list cannot be limited with CSS and would grow past the dialog), and a bio of up to 50 characters with a counter. The list starts with "Nenhuma", since the favorite opening is optional; the other fields are required. Saving sends `PUT /perfis/atualizar/:idUsuario`, then closes the dialog and reads the profile again, so the card shows the new information right away. The page checks that rating, year and bio are filled, the rating (0 to 3500) and the year (1901 to the current year) before sending, and shows the API's errors in the dialog. A user with no profile sees "Perfil não encontrado." and no edit button.
- **Rules** (`play/rules.js`): written for this project, with no library, and kept to what the exercises need. The board is an 8×8 matrix, `board[row][column]`, holding the piece's FEN letter (`"K"` is the white king, `"p"` a black pawn; uppercase is White) or `""` for an empty square. Row 0 is the 8th rank and column 0 is the a-file. `readBoardFromFen` builds it from the first field of the exercise's FEN. `getTargets` lists the squares a piece can move to: the knight and the king one jump or step to each side, the rook, bishop and queen along their lines until the edge or a piece (stopping on an enemy piece), and the pawn one square forward, two from its starting row, or one diagonally to capture. `movePiece` moves it on the board.
- **What is not checked**: only the movement of each piece. A move that leaves the own king in check is not blocked; it is simply a wrong move. There is no castling, en passant or promotion, since no exercise uses them.
- **Notation**: the solutions are in SAN. `readSanMove` reads a solution move as a piece and a square (`"Qxf7#"` is a queen to f7; no piece letter means a pawn). A right move is recorded with the solution's own SAN, check (`+`) and mate (`#`) included; a wrong move is written by `writeSanMove` in short SAN (`Nf3`, `Qxf7`, `exd5`). The move list shows the moves in numbered lines of two, such as "1. Bxf7+ Ke7".
- **Solving** (`play/game.html`, `play/game.js`): the page reads `?lista=` and `?exercicio=` (without valid ids it goes back to the start screen), loads the exercise with `GET /exercicios/buscar/:idExercicio` and draws its position with the side to move, the user's side, at the bottom. The panel shows the exercise's title and "Brancas jogam e dão mate em 2.", counting down as the user plays. Each user move is right when the same piece goes to the same square as the next solution move: a different move ends the attempt as wrong ("Lance errado. Tente de novo."); a right move gets the opponent's reply from the solution, played by the page after 0.5s (`OPPONENT_DELAY_MS`) with the piece that can reach the reply's square; the last solution move ends it as solved ("Xeque-mate! Exercício resolvido."). Clicks are ignored while the opponent replies and after the end. The king in check is found from the last move's `+` or `#` sign.
- **Saving** (`play/game.js`): when the attempt ends, the page sends `{ fk_lista, fk_exercicio, lances }` to `POST /tentativas/cadastrar/:idUsuario`, with every move played, the replies included. The API decides whether it was right. The page shows "Tentativa salva no seu dashboard." or an error. "Tentar de novo" starts the same exercise again, and "Próximo exercício" opens the next one of the list (found with `GET /exercicios/listar/:idLista/:idUsuario`; hidden on the last one). "Voltar às listas" opens the start screen with this list open.
- **Layout** (`play/game.css`): the board takes the width left by the 340px side panel, up to 600px, and the page scrolls when needed. The pieces are 44px, and `6vw` on phones. The last move and the selected square get the solid `--square-highlight` background (the selected one also has a brass inner border) and a king in check gets `--square-check`. The moves list scrolls inside the panel past 320px. On phones the panel goes below the board.
- **Checking the rules**: every solution of the 15 exercises was replayed with `readSanMove` and `getTargets`, and each move has exactly one piece that can reach its square, so the page finds the opponent's replies without ambiguity.

### Gallery photos

The gallery shows six photos, stored in `public/assets/` and referenced as `../assets/<file>`. Each one is a `<figure class="photo">` with an `<img>` (with an `alt` text) and a `<figcaption>` that shows on hover; the CSS crops the image to a square (`object-fit: cover`). One variation:

- `.photo-bottom` keeps the bottom of the photo in the square crop (`object-position: bottom`), for the OBMEP medal photo, whose medal sits at the bottom.

To add a photo, put the file in `public/assets/`, upright and small (`medalha-obmep.jpg` was resized to 900×1200, about 110 KB, from a 4 MB phone photo), add a `<figure>` to `gallery.html` and update the photo count in the profile. Some files are large (`geometria-dark.png` is about 1.5 MB and `chess-board.png` about 1 MB). The geometry photo is always the dark version, in both themes; smaller versions would make the page load faster.

Layout (`gallery/gallery.css`): the photos sit in rows of three inside `.photo-area`, at most 760px wide; each photo is a third of the row minus the gaps, so the grid follows the width on any screen and the page scrolls when needed. On phones the profile stacks.

## 4. Back-end

The API contracts (routes, bodies, replies and error messages) are in [`04-api.md`](04-api.md).

The back-end was rebuilt on 2026-10-15 from the legacy template's code. It keeps the template's structure and drops every resource Chess Life does not use:

```
app.js                       Loads the environment file, serves public/ and mounts /usuarios, /perfis, /listas, /exercicios and /tentativas
src/
├── routes/                  URL → controller function
│   ├── usuarios.js
│   ├── perfis.js
│   ├── listasExercicios.js
│   ├── exercicios.js
│   └── tentativas.js
├── controllers/             Read the request, validate it and reply (status and message)
│   ├── usuarioController.js Sign-up, login
│   ├── perfilController.js  Read and update the profile, and check its fields (also for sign-up)
│   ├── listaExerciciosController.js List the exercise lists with the user's progress
│   ├── exercicioController.js List a list's exercises, read one exercise with its solution
│   └── tentativaController.js Save an attempt (compares it with the solution) and list the attempts
├── models/                  Build and run the SQL
│   ├── usuarioModel.js
│   ├── perfilModel.js       Reads and updates a user's profile
│   ├── listaExerciciosModel.js Reads the lists and how many exercises the user solved in each
│   ├── exercicioModel.js    Reads a list's exercises, an exercise and its solution
│   └── tentativaModel.js    Saves and lists the attempts
└── database/
    ├── config.js            Connection pool: query(sql, values) and transaction(runStatements)
    ├── 01-schema.sql        Drops and creates the database and its tables
    ├── 02-seed.sql          Openings, lists, exercises and solutions
    └── 03-app-user.sql      MySQL user of the API, with the least privileges it needs
```

Conventions for new back-end code:

- A new resource follows `routes/<resource>.js` → `controllers/<resource>Controller.js` → `models/<resource>Model.js`, with the resource named after its table (`tentativa`).
- Routes pass the controller function directly (`router.post("/cadastrar", usuarioController.registerUser)`).
- Controllers are `async` functions with their own `try`/`catch`, since Express 4 does not catch errors from `async` handlers. They validate on the server even when the page already validated (RF11), reply with the status codes of [`04-api.md`](04-api.md), and log only `error.message` with `console.error`.
- Models only build and run SQL, always with `?` placeholders, through `database.query`. Statements that must succeed or fail together go through `database.transaction`.
- Identifiers are in English. Table names, columns, URL paths and request fields stay in Portuguese, as the database and the existing contracts use them.
- The database connection comes from the `DB_*` variables of the environment file. To use the Chess Life database, `DB_DATABASE` must be `chess_life`, the database created by `01-schema.sql`.

## 5. Pending

- Nothing pending.
