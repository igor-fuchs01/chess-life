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
- Before the first run, create the database and the application user with `src/database/01-schema.sql`, `02-seed.sql` and `03-app-user.sql` (section 7 of [`03-database.md`](03-database.md)). Then set `DB_DATABASE=chess_life`, `DB_USER=chess_life_user` and that user's password in `DB_PASSWORD` in the environment file.

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
    ├── play/               Restricted game pages: play.html (start screen, profile.js), game.html (the game: rules.js and play.js)
    └── dashboard/          Restricted dashboard: indicators, charts and games played on the site
```

## 3. Front-end

### Design

The site uses the "classic" direction chosen by the user: cream paper (`--paper`), deep green (`--green`) and brass (`--brass`), a serif for headings (`--font-heading`: Georgia) and a sans-serif for text (`--font-body`: Segoe UI or the system font). Only fonts already installed on the user's system are used, with no web fonts. Colors and fonts are CSS variables in the `:root` block of `shared/style.css`; feature styles only use those variables.

### Light and dark themes

- The sidebar has a button (☾ / ☀, "Modo escuro" / "Modo claro") that switches between the light and the dark theme. The choice is saved in `localStorage` (`chess-life-theme`). Before any choice, the site follows the system theme (`prefers-color-scheme`).
- `shared/theme.js` is loaded in the `<head>` of every page, right after the stylesheets. It sets `data-theme="light"` or `"dark"` on `<html>` before the page is drawn, so a dark page never flashes light. `toggleTheme()` switches the theme and fires a `themechange` event on `document`.
- The dark palette is a single `:root[data-theme="dark"]` block in `shared/style.css` that redefines the color variables, plus `color-scheme: dark` for form controls and scrollbars. Feature stylesheets have no theme rules of their own.
- Variables by role:
  - `--green`: surfaces, such as buttons and the board frame.
  - `--green-text`: green text on the page background. It is lighter in the dark theme.
  - `--light-ink`: text on green surfaces and photos, the same in both themes.
  - `--dark-ink`: pieces on the board and the dark photo tile, the same in both themes.
- The board squares keep their wood colors in both themes.
- The dashboard charts read their colors from the variables, and draw again on `themechange`.
  - `--win`, `--draw` and `--loss` color the game results in the charts and the dashboard tags. Win and loss are opposite poles (green and rust) and a draw is a neutral stone between them, which is also its place in the stacked bars. They were checked with a color-vision validator: in both themes win and loss are far apart for normal vision (ΔE 23.3 light, 25.3 dark, against a floor of 15), and for color-blind readers they sit in the 6–8 band that needs a second channel, so every result also shows as text (legend counts, tag words) and stacked segments keep a 2px gap. The previous green, rust and brass failed it: in the dark theme loss and draw were only ΔE 8.8 apart.
- Every text color pair passes the WCAG contrast minimum in the dark theme (4.5:1 for text, 3:1 for large text and chart bars). In the light theme, `--brass` on `--paper` (2.7:1) is below 3:1, which predates the dark theme.

### Pages

| URL | Feature folder | Access | API used |
| --- | --- | --- | --- |
| `/` | `index.html`, `home/` | Public | — |
| `/gallery/gallery.html` | `gallery/` | Public | — |
| `/auth/login.html` | `auth/` | Public | `POST /usuarios/autenticar` |
| `/auth/signup.html` | `auth/` | Public | `POST /usuarios/cadastrar`, `GET /aberturas/listar` |
| `/play/play.html` | `play/` | Restricted | `GET /perfis/buscar`, `PUT /perfis/atualizar`, `GET /aberturas/listar` |
| `/play/game.html` (`?cor=brancas` or `?cor=pretas`) | `play/` | Restricted | `POST /partidas/cadastrar` |
| `/dashboard/dashboard.html` | `dashboard/` | Restricted | `GET /partidas/listar` |

### Conventions

- Every page has empty `<aside id="site-sidebar">` and `<footer id="site-footer">` elements. It loads `shared/theme.js` in `<head>`, then `shared/session.js` and `shared/layout.js`, which fills them. The menu shows "Jogar" and "Dashboard" only to logged-in users. The bottom of the sidebar shows the theme button and, below it, "Entrar" to visitors or, in the same place, "Sair" to logged-in users.
- Sidebar (adapted from the "Glass Sidebar" in `.temp/glass-sidebar`, styles under "Sidebar" in `shared/style.css`): a floating glass bar fixed on the left, replacing the old header. Closed it is `--sidebar-rail` (68px) wide and shows only the icons; on hover or keyboard focus (`:has(:focus-visible)`) it widens to `--sidebar-open` (240px) over the page and shows the labels, with no JavaScript. It does not use `:focus-within`, because a button clicked with the mouse (such as the theme button) keeps the focus and would keep the bar open after the mouse leaves. There is no strip reserved for the bar: sections, their backgrounds and the footer span the whole window, under the sidebar. Only their content moves: `.wrap` adds `--sidebar-space` to its left padding and to its `max-width`, so the content keeps clear of the closed bar and is centered in the space to its right, and the footer text gets the same left padding. Rules that override `.wrap`'s width (`.auth`, `.dash .wrap`, `.play .wrap`) add `--sidebar-space` too, and the home `.hero` sets only its top and bottom padding, so it keeps the `.wrap` side padding. The glass is `--card` at 55% opacity (`color-mix`) with `backdrop-filter: blur(16px) saturate(160%)`. Hovered items get a 14% tint of `--green-text` and green text, which shows in both themes (a lighter glass tone barely showed over the light cream). The current page is a `--green` item, "Sair" turns `--danger` on hover, and the theme button and "Entrar" or "Sair" sit at the bottom. The page icons are chess pieces: ♚ Minha história, ♝ Galeria, ♞ Jogar, ♜ Dashboard. "Entrar" is a door, `assets/porta.svg`, used as a CSS `mask` over `currentColor` (`.sidebar-icon.door`), so it follows the text color, the hover and the theme like the glyph icons (an SVG loaded from a file cannot read the page colors, and the door character is a color emoji on most systems); "Sair" is ⏻. Right below "Minha história", every visitor sees ♛ Agradecimentos (always a queen, the user's choice), which scrolls to the home page section `#agradecimentos`. From other pages it opens `index.html#agradecimentos`; on the home page it keeps only `#agradecimentos`, because the server serves that page at `/` and a link to `index.html` would reload it instead of scrolling. `html` has `scroll-behavior: smooth` unless the system asks for reduced motion, and the section link is never marked as the current page. After a click, the section is the page's `:target` (the address ends in `#agradecimentos`), and the CSS rule `body:has(#agradecimentos:target) .sidebar-item[href="#agradecimentos"]` gives the link the hover style, with no JavaScript. It follows the address, not scrolling: the link stays highlighted until the address changes. Every item has a `title`, so its name shows while the bar is closed. Widths based on the window must subtract `--sidebar-space`, like the game board on phones.
- Authentication is the user's session in the browser, through `shared/session.js` (see "Authentication" below).
- Form feedback uses `showMessage(element, text, "error" | "success")` from `shared/layout.js` (RF11).
- Pages use relative paths for their files, so they also open straight from disk. Scripts build links from `SITE_ROOT` (`shared/session.js`). API calls only work when the site is served by `app.js`.
- Every SVG file of the front-end lives in `public/assets/`, with the other images, and icons are files there instead of SVG markup written in the scripts.
- An element whose class sets `display` ignores the `hidden` attribute, so such a class gets its own `[hidden] { display: none; }` rule: `.btn[hidden]` in `shared/style.css` (the game page's "Tentar salvar de novo") and `.player-stats[hidden]` in `play/play.css`. A global `[hidden]` rule does not work, because a class in a later stylesheet wins over it.
- Forms are validated on the client too, for a quick reply: strong password (RN02: at least 8 characters with an uppercase letter, a lowercase letter, a digit and a special character), valid e-mail and matching confirmation. The server must repeat these checks. The password strength is checked by `validatePasswordStrength` in `auth/password.js`, on sign-up only, before any request is sent. Login does not check it, on the page or in the API, so users whose password was saved before RN02 can still log in. The sign-up error shows in the form message below the submit button.
- Login and sign-up layout (`auth/auth.css`): the `.alt` section fills `<main>`, so its background reaches the footer, and the form sits in its middle. Spacing is compact: smaller fields (7px padding, 15px text) and small label margins. The footer of every page has 20px of vertical padding (`.site-footer` in `shared/style.css`). The sign-up form (a 640px card) shows "Sua conta" and then "Seu perfil de jogador" one below the other (`.signup-sections`, `flex-direction: column`), each with two rows of paired fields (`.field-row`), and its title puts the ornament on the left of "Crie a sua conta". Both pages fit the window with the footer, without scrolling, even with an error message, down to 1280×720. On phones the fields stack and sign-up scrolls.
- Sign-up creates the account and the player profile at once (`POST /usuarios/cadastrar`). Below the account fields, the "Seu perfil de jogador" block has rating, "Joga desde", favorite opening (a normal dropdown with "Escolha uma" first, filled by `GET /aberturas/listar`) and a bio of up to 50 characters, all required. If the openings cannot be loaded, the form says to reload the page, since the opening is required. The profile fields are read and checked by `shared/profile-form.js`, the same code the profile dialog uses.
- User-provided text goes into the page with `textContent`, never `innerHTML`.
- Chart.js 4.4.1 is loaded from cdnjs only on the dashboard.
- The board's base style (`.board`, `.light`, `.dark`) is in `shared/style.css`. The game page draws its board with `play/play.js`; the home page shows `assets/dragao-acelerado.svg` in an `<img class="board">`, so it gets the same frame and shadow.
- The home page board is an animated SVG of the Accelerated Dragon (1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6), with no JavaScript. Its CSS animations share one 16s cycle: each move takes 0.6s with 0.9s between moves, the final position stays on screen, and the pieces fade out and back in before the opening repeats. With `prefers-reduced-motion`, it stops on the final position. Its colors are written in the file, since an SVG loaded by `<img>` cannot read the page's CSS variables; the board squares are the same in both themes anyway.
- Layouts use flexbox, never CSS grid. The board is a wrapping flex container whose 64 squares are each `12.5%` wide and square (`aspect-ratio: 1`); the gallery photos are a third of the row minus the gaps; the dashboard panels sit in two `.panel-row` rows, with `.panel.wide` taking twice the width of the other panel.
- Code and identifiers are in English; text shown to users is in Portuguese.

### Authentication

Authentication is done by the user's session in the browser, decided on 2026-10-25. After a successful login the page saves the user in the tab's `sessionStorage`, and every page reads it from there. There is no token, cookie or server session: the server only checks the e-mail and password once, at login.

| Function (`shared/session.js`) | What it does | Called by |
| --- | --- | --- |
| `startSession(user)` | Saves `USER_ID`, `USER_NAME` and `USER_EMAIL` in `sessionStorage` | `auth/login.js`, after `POST /usuarios/autenticar` replies `200` |
| `getSessionUser()` | Returns `{ id, name, email }`, or `null` for a visitor | `shared/layout.js`, `dashboard/dashboard.js`, `play/play.js` |
| `requireSession()` | Sends a visitor to the login page | The `<head>` of every restricted page |
| `endSession()` | Clears `sessionStorage` and opens the login page | The "Sair" button of the navigation |

### Game page

The game is played by two people on the same computer, on two pages. `/play/play.html` (the sidebar's "Jogar") is the start screen, where the logged-in user sees their profile and chooses their color. `/play/game.html` is the game, with the board drawn with that color at the bottom.

- **Start screen** (`play/play.html`, styles in `play/play.css`), from top to bottom:
  - **Player card** (`.player-card`): a green band with the logged-in user's name and their profile (bio, rating, "Joga desde" and favorite opening), or an invitation to create one. Its button reads "Criar perfil" or "Editar perfil".
  - **Escolha suas peças**: two wide links (`.color-option`), Brancas ♔ and Pretas ♚, each king on a light square. They open `game.html?cor=brancas` or `game.html?cor=pretas`.
  - **Regras da partida** (`.rule-tiles`): five short tiles in a row, a title and one line each: two players, moving, special moves, game end and the dashboard.
- **Profile** (`play/profile.js`, with `shared/profile-form.js`): the profile is created at sign-up, so here it is only read and edited. The start screen reads it with `GET /perfis/buscar/:idUsuario` and fills the favorite opening options with `GET /aberturas/listar`. The player card's "Editar perfil" button, shown only when the profile was found, opens a `<dialog>` (`#profile-dialog`) with the profile form: rating, "Joga desde" (`ano_inicio`), favorite opening, shown as a box of six rows with its own scrollbar (`size="6"`, since the native dropdown list cannot be limited with CSS and would grow past the dialog), and a bio of up to 50 characters with a counter. Every field is required, so the list has no "Nenhuma" option. Saving sends `PUT /perfis/atualizar/:idUsuario`, then closes the dialog and reads the profile again, so the card shows the new information right away. The page checks that every field is filled, the rating (0 to 3500) and the year (1901 to the current year) before sending, and shows the API's errors in the dialog. If the openings cannot be loaded, the dialog does not let the user save, because saving would clear the favorite opening. A user with no profile (an account created before 2026-11-02) sees "Perfil não encontrado." and no edit button; the `perfil` table in [`03-database.md`](03-database.md) shows the SQL that gives them one.
- **Rules** (`play/rules.js`): written for this project, with no library. The board is an 8×8 matrix, `board[row][column]`, holding `{ color, type }` or `null`. Row 0 is the 8th rank and column 0 is the a-file. A game is a plain object: board, player to move, castling rights, en passant square, half-move clock and position history. `makeMove` returns a new game instead of changing the old one.
- **Legal moves**: each piece's moves are generated, then a move is kept only if its own king is not attacked afterwards. This one check covers check (only moving the king, blocking or capturing the attacker), pins and double check (only king moves).
- **Special moves**:
  - Kingside and queenside castling: the king and that rook have not moved, the squares between them are empty, and the king is not in check and does not pass through or land on an attacked square.
  - En passant: only on the move right after the enemy pawn's double step.
  - Promotion: a dialog lets the player choose queen, rook, bishop or knight.
- **Game end**: checkmate and stalemate. Draws end the game automatically, without a claim: insufficient material, the fifty-move rule (100 half-moves without a capture or pawn move) and threefold repetition (same pieces, player to move, castling rights and possible en passant). Players can also resign (the player to move) or agree to a draw.
- **Notation**: every move is written in SAN, with disambiguation (`Nbd2`), captures, promotion (`e8=Q`), castling (`O-O`, `O-O-O`), check (`+`) and mate (`#`). The move list shows piece symbols instead of the letters.
- **Saving** (`play/play.js`): when the game ends, the page sends `{ resultado, adversario: "humano", cor, lances }` to `POST /partidas/cadastrar/:idUsuario`, with the result from the user's side. It shows the opening the API identified, or an error with a "Tentar salvar de novo" button. A game with no moves is not saved.
- **Game page** (`play/game.html`, `play/play.js`): it reads the color from `?cor=` and starts the game at once; without a valid color it goes back to the start screen. "Nova partida" also goes back there, asking first when a game in progress would be lost.
- **Layout** (`play/game.css`): the board takes the width left by the 340px side panel, up to 600px, and the page scrolls when needed. The pieces are sized in `cqw` (a percentage of the board's width, through `container-type: inline-size`), so they follow the board. The moves list scrolls inside the panel past 320px. On phones the panel goes below the board.
- **Checking the rules**: the move generator was checked with *perft* (counting every position to a given depth). The counts match the published values for the starting position (depth 4), "Kiwipete" (depth 3) and three other standard test positions that cover castling, en passant pins and promotions.

### Gallery photos

The gallery shows six photos, stored in `public/assets/` and referenced as `../assets/<file>`. Each one is a `<figure class="photo">` with an `<img>` (with an `alt` text) and a `<figcaption>` that shows on hover; the CSS crops the image to a square (`object-fit: cover`). One variation:

- `.photo-bottom` keeps the bottom of the photo in the square crop (`object-position: bottom`), for the OBMEP medal photo, whose medal sits at the bottom.

To add a photo, put the file in `public/assets/`, upright and small (`medalha-obmep.jpg` was resized to 900×1200, about 110 KB, from a 4 MB phone photo), add a `<figure>` to `gallery.html` and update the photo count in the profile. Some files are large (`geometria-dark.png` is about 1.5 MB and `chess-board.png` about 1 MB). The geometry photo is always the dark version, in both themes; smaller versions would make the page load faster.

Layout (`gallery/gallery.css`): the photos sit in rows of three inside `.photo-area`, at most 760px wide; each photo is a third of the row minus the gaps, so the grid follows the width on any screen and the page scrolls when needed. On phones the profile stacks.

## 4. Back-end

The API contracts (routes, bodies, replies and error messages) are in [`04-api.md`](04-api.md).

The back-end was rebuilt on 2026-10-15 from the legacy template's code. It keeps the template's structure and drops every resource Chess Life does not use:

```
app.js                       Loads the environment file, serves public/ and mounts /usuarios, /partidas, /perfis and /aberturas
src/
├── routes/                  URL → controller function
│   ├── usuarios.js
│   ├── partidas.js
│   ├── perfis.js
│   └── aberturas.js
├── controllers/             Read the request, validate it and reply (status and message)
│   ├── usuarioController.js Sign-up, login
│   ├── partidaController.js List and save games
│   ├── perfilController.js  Read, create and update the profile
│   └── aberturaController.js List the openings
├── models/                  Build and run the SQL
│   ├── usuarioModel.js
│   ├── partidaModel.js      Saves a game and its moves in one transaction
│   ├── perfilModel.js       Reads, creates and updates a user's profile
│   ├── aberturaModel.js     Reads the opening list from the abertura table, with or without the moves
│   └── openingBook.js       Picks a game's opening from that list (no database access)
└── database/
    ├── config.js            Connection pool: query(sql, values) and transaction(runStatements)
    ├── 01-schema.sql        Database and tables
    ├── 02-seed.sql          Opening list
    └── 03-app-user.sql      MySQL user of the API, with the least privileges it needs
```

Conventions for new back-end code:

- A new resource follows `routes/<resource>.js` → `controllers/<resource>Controller.js` → `models/<resource>Model.js`, with the resource named after its table (`partida`).
- Routes pass the controller function directly (`router.post("/cadastrar", usuarioController.registerUser)`).
- Controllers are `async` functions with their own `try`/`catch`, since Express 4 does not catch errors from `async` handlers. They validate on the server even when the page already validated (RF11), reply with the status codes of [`04-api.md`](04-api.md), and log only `error.message` with `console.error`.
- Models only build and run SQL, always with `?` placeholders, through `database.query`. Statements that must succeed or fail together go through `database.transaction`.
- Identifiers are in English. Table names, columns, URL paths and request fields stay in Portuguese, as the database and the existing contracts use them.
- The database connection comes from the `DB_*` variables of the environment file. To use the Chess Life database, `DB_DATABASE` must be `chess_life`, the database created by `01-schema.sql`.

## 5. Pending

- Nothing pending.
