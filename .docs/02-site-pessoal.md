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
    │   ├── logo.svg        Logo emblem (king in a green seal), used in the header and as the favicon
    │   ├── theme.js        Light and dark theme, loaded in every page's <head>
    │   ├── session.js      Session in sessionStorage
    │   └── layout.js       Header, footer and form messages
    ├── home/               Home page styles (hero, story timeline, competencies, thanks, inspirations)
    ├── gallery/            Photo gallery page
    ├── assets/             Images shared by the pages: the gallery photos and the animated Accelerated Dragon board (`dragao-acelerado.svg`)
    ├── auth/               Login and sign-up pages
    ├── play/               Restricted game page: rules.js (chess rules) and play.js (board and saving)
    └── dashboard/          Restricted dashboard: indicators, charts and games played on the site
```

## 3. Front-end

### Design

The site uses the "classic" direction chosen by the user: cream paper (`--paper`), deep green (`--green`) and brass (`--brass`), a serif for headings (`--font-heading`: Georgia) and a sans-serif for text (`--font-body`: Segoe UI or the system font). Only fonts already installed on the user's system are used, with no web fonts. Colors and fonts are CSS variables in the `:root` block of `shared/style.css`; feature styles only use those variables.

### Light and dark themes

- The header has a button (☾ / ☀) that switches between the light and the dark theme. The choice is saved in `localStorage` (`chess-life-theme`). Before any choice, the site follows the system theme (`prefers-color-scheme`).
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
| `/auth/signup.html` | `auth/` | Public | `POST /usuarios/cadastrar` |
| `/play/play.html` | `play/` | Restricted | `POST /partidas/cadastrar` |
| `/dashboard/dashboard.html` | `dashboard/` | Restricted | `GET /partidas/listar` |

### Conventions

- Every page has empty `<header id="site-header">` and `<footer id="site-footer">` elements. It loads `shared/theme.js` in `<head>`, then `shared/session.js` and `shared/layout.js`, which fills them. The navigation shows "Entrar" to visitors, and "Jogar", "Dashboard" and "Sair" to logged-in users.
- Authentication is the user's session in the browser, through `shared/session.js` (see "Authentication" below).
- Form feedback uses `showMessage(element, text, "error" | "success")` from `shared/layout.js` (RF11).
- Pages use relative paths for their files, so they also open straight from disk. Scripts build links from `SITE_ROOT` (`shared/session.js`). API calls only work when the site is served by `app.js`.
- Forms are validated on the client too, for a quick reply: password of at least 8 characters (RN02), valid e-mail and matching confirmation. The server must repeat these checks.
- Login and sign-up layout (`auth/auth.css`): the `.alt` section fills `<main>`, so its background reaches the footer, and the form sits in its middle. Spacing is compact and, on screens wider than 800px, the sign-up form shows its fields in pairs (`.field-row`), so the page fits the window with the header and the footer, even with an error message, down to 1280×720. On phones the fields stack and sign-up may scroll.
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

`/play/play.html` is a game between two people on the same computer. The logged-in user chooses their color, and the board is drawn with that color at the bottom.

- **Rules** (`play/rules.js`): written for this project, with no library. The board is an 8×8 matrix, `board[row][column]`, holding `{ color, type }` or `null`. Row 0 is the 8th rank and column 0 is the a-file. A game is a plain object: board, player to move, castling rights, en passant square, half-move clock and position history. `makeMove` returns a new game instead of changing the old one.
- **Legal moves**: each piece's moves are generated, then a move is kept only if its own king is not attacked afterwards. This one check covers check (only moving the king, blocking or capturing the attacker), pins and double check (only king moves).
- **Special moves**:
  - Kingside and queenside castling: the king and that rook have not moved, the squares between them are empty, and the king is not in check and does not pass through or land on an attacked square.
  - En passant: only on the move right after the enemy pawn's double step.
  - Promotion: a dialog lets the player choose queen, rook, bishop or knight.
- **Game end**: checkmate and stalemate. Draws end the game automatically, without a claim: insufficient material, the fifty-move rule (100 half-moves without a capture or pawn move) and threefold repetition (same pieces, player to move, castling rights and possible en passant). Players can also resign (the player to move) or agree to a draw.
- **Notation**: every move is written in SAN, with disambiguation (`Nbd2`), captures, promotion (`e8=Q`), castling (`O-O`, `O-O-O`), check (`+`) and mate (`#`). The move list shows piece symbols instead of the letters.
- **Saving** (`play/play.js`): when the game ends, the page sends `{ resultado, adversario: "humano", cor, lances }` to `POST /partidas/cadastrar/:idUsuario`, with the result from the user's side. It shows the opening the API identified, or an error with a "Tentar salvar de novo" button. A game with no moves is not saved.
- **Layout** (`play/play.css`): on screens wider than 800px the page fits the window without scrolling, like the dashboard. The board is sized from the free height with container query units (`cqh`, `cqw` on `.play-area`), the moves list scrolls inside the side panel, and the footer is hidden. On phones the panel goes below the board and the page scrolls.
- **Checking the rules**: the move generator was checked with *perft* (counting every position to a given depth). The counts match the published values for the starting position (depth 4), "Kiwipete" (depth 3) and three other standard test positions that cover castling, en passant pins and promotions.

### Gallery photos

The gallery shows six photos, stored in `public/assets/` and referenced as `../assets/<file>`. Each one is a `<figure class="photo">` with an `<img>` (with an `alt` text) and a `<figcaption>` that shows on hover; the CSS crops the image to a square (`object-fit: cover`). One variation:

- `.photo-bottom` keeps the bottom of the photo in the square crop (`object-position: bottom`), for the OBMEP medal photo, whose medal sits at the bottom.

To add a photo, put the file in `public/assets/`, upright and small (`medalha-obmep.jpg` was resized to 900×1200, about 110 KB, from a 4 MB phone photo), add a `<figure>` to `gallery.html` and update the photo count in the profile. Some files are large (`geometria-dark.png` is about 1.5 MB and `chess-board.png` about 1 MB). The geometry photo is always the dark version, in both themes; smaller versions would make the page load faster.

Layout (`gallery/gallery.css`): on screens wider than 800px the page fits the window without scrolling, like the dashboard and the game page, and the footer is hidden. The photos sit in two rows of three inside `.photo-area`, and their size comes from its free width and height with container query units (`cqw`, `cqh`); `.grid` is exactly three photos wide, so a row never holds more. On phones the photos follow the width and the page scrolls when needed. The layout is made for six photos: a seventh would start a third row, which no longer fits the window.

## 4. Back-end

The API contracts (routes, bodies, replies and error messages) are in [`04-api.md`](04-api.md).

The back-end was rebuilt on 2026-10-15 from the legacy template's code. It keeps the template's structure and drops every resource Chess Life does not use:

```
app.js                       Loads the environment file, serves public/ and mounts /usuarios and /partidas
src/
├── routes/                  URL → controller function
│   ├── usuarios.js
│   └── partidas.js
├── controllers/             Read the request, validate it and reply (status and message)
│   ├── usuarioController.js Sign-up, login
│   └── partidaController.js List and save games
├── models/                  Build and run the SQL
│   ├── usuarioModel.js
│   ├── partidaModel.js      Saves a game and its moves in one transaction
│   ├── aberturaModel.js     Reads the opening list from the abertura table
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

- **Profile**: the `perfil` table exists, but no route or page uses it yet.
