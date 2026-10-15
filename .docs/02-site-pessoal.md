# site-pessoal — Application

`site-pessoal/` holds the Chess Life application. The specification it implements is in [`01-project.md`](01-project.md).

The folder started as a copy of SPTech's **web-data-viz** template (`BandTec/web-data-viz`, built for the "AquaTech" sample project). Its back-end (`app.js` and `src/`) is legacy code to be reused and adapted. Its legacy front-end was removed and rebuilt for Chess Life.

## 1. Running

```
cd site-pessoal
npm install
npm start        # or: npm run dev (restarts on file changes, uses nodemon)
```

- `app.js` picks the environment file on its first lines: `.env` for `producao` (remote database) and `.env.dev` for `desenvolvimento` (local database).
- Both files hold `AMBIENTE_PROCESSO`, `DB_HOST`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `APP_PORT` and `APP_HOST`. They contain credentials and are ignored by git, so never commit them.
- The site runs at `http://APP_HOST:APP_PORT`. Variables already set in the shell win over the file, for example `APP_PORT=3399 npm start`.
- The tables the legacy API expects are in `src/database/script-tabelas.sql`. The Chess Life database is created by `src/database/01-schema.sql` and `02-seed.sql` (see section 7 of [`03-database.md`](03-database.md)); the API moves to it once the code is adapted.

There are no automated tests or lint setup yet.

## 2. Structure

```
site-pessoal/
├── app.js                  Express server: static files from public/ and API routers
├── package.json            express, mysql2, dotenv, cors, nodemon
├── src/                    Legacy back-end (routes → controllers → models)
│   ├── database/           config.js: MySQL connection, executar(sql, parametros) runs one query;
│   │                       01-schema.sql and 02-seed.sql: Chess Life database; script-tabelas.sql: legacy
│   ├── routes/             URL → controller function
│   ├── controllers/        Reads the request, validates and replies
│   └── models/             Builds and runs the SQL; openingBook.js identifies openings
└── public/                 Chess Life front-end, one folder per feature
    ├── index.html          Home page
    ├── shared/             Used by every page
    │   ├── style.css       Design tokens and base styles (classic design)
    │   ├── logo.svg        Logo emblem (king in a green seal), used in the header and as the favicon
    │   ├── theme.js        Light and dark theme, loaded in every page's <head>
    │   ├── session.js      Session in sessionStorage
    │   └── layout.js       Header, footer and form messages
    ├── home/               Home page styles and the opening board
    ├── story/              "Minha história" page
    ├── gallery/            Photo gallery page
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
  - `--green`: surfaces, such as buttons, the dashboard band and the board frame.
  - `--green-text`: green text on the page background. It is lighter in the dark theme.
  - `--light-ink`: text on green surfaces and photos, the same in both themes.
  - `--dark-ink`: pieces on the board and the dark photo tile, the same in both themes.
- The board squares keep their wood colors in both themes.
- The dashboard charts read their colors from the variables, and draw again on `themechange`.
- Every text color pair passes the WCAG contrast minimum in the dark theme (4.5:1 for text, 3:1 for large text and chart bars). In the light theme, `--brass` on `--paper` (2.7:1) is below 3:1, which predates the dark theme.

### Pages

| URL | Feature folder | Access | API used |
| --- | --- | --- | --- |
| `/` | `index.html`, `home/` | Public | — |
| `/story/story.html` | `story/` | Public | — |
| `/gallery/gallery.html` | `gallery/` | Public | — |
| `/auth/login.html` | `auth/` | Public | `POST /usuarios/autenticar` |
| `/auth/signup.html` | `auth/` | Public | `POST /usuarios/cadastrar` |
| `/play/play.html` | `play/` | Restricted | `POST /partidas/cadastrar` |
| `/dashboard/dashboard.html` | `dashboard/` | Restricted | `GET /partidas/listar`, `DELETE /partidas/deletar` |

### Conventions

- Every page has empty `<header id="site-header">` and `<footer id="site-footer">` elements. It loads `shared/theme.js` in `<head>`, then `shared/session.js` and `shared/layout.js`, which fills them. The navigation shows "Entrar" to visitors, and "Jogar", "Dashboard" and "Sair" to logged-in users.
- Session: `startSession`, `getSessionUser`, `endSession` and `requireSession` in `shared/session.js`, stored in `sessionStorage` (`USER_ID`, `USER_NAME`, `USER_EMAIL`). Restricted pages call `requireSession()` in `<head>`, which sends visitors to the login page.
- Form feedback uses `showMessage(element, text, "error" | "success")` from `shared/layout.js` (RF11).
- Pages use relative paths for their files, so they also open straight from disk. Scripts build links from `SITE_ROOT` (`shared/session.js`). API calls only work when the site is served by `app.js`.
- Forms are validated on the client too, for a quick reply: password of at least 8 characters (RN02), valid e-mail and matching confirmation. The server must repeat these checks.
- User-provided text goes into the page with `textContent`, never `innerHTML`.
- Chart.js 4.4.1 is loaded from cdnjs only on the dashboard.
- The board's base style (`.board`, `.light`, `.dark`) is in `shared/style.css`, shared by the home page and the game page.
- Code and identifiers are in English; text shown to users is in Portuguese.

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
- **Checking the rules**: the move generator was checked with *perft* (counting every position to a given depth). The counts match the published values for the starting position (depth 4), "Kiwipete" (depth 3) and three other standard test positions that cover castling, en passant pins and promotions.

### Gallery photos

The gallery currently shows colored placeholder tiles. To use a photo, add the image under `public/gallery/` and put an `<img>` inside its `<figure class="photo">`. The CSS already fills the tile with it.

## 4. Legacy API

Every route below exists in `src/` as received. None of them has been changed yet. The only shared change is that `database.executar(sql, parametros)` now takes optional values for `?` placeholders; calls without them work as before.

| Method and path | Controller | Body or parameters | Reply |
| --- | --- | --- | --- |
| `POST /usuarios/cadastrar` | `usuarioController.cadastrar` | `nomeServer`, `emailServer`, `cpfServer`, `senhaServer`, `idEmpresaVincularServer` | 200 with the insert result; 400 if a field is missing |
| `POST /usuarios/autenticar` | `usuarioController.autenticar` | `emailServer`, `senhaServer` | 200 `{ id, email, nome, senha, aquarios }`; 204 when the user's company has no aquariums; 403 for wrong credentials |
| `GET /avisos/listar` | `avisoController.listar` | — | Every notice, joined with its user |
| `GET /avisos/listar/:idUsuario` | `avisoController.listarPorUsuario` | — | One user's notices |
| `GET /avisos/pesquisar/:descricao` | `avisoController.pesquisarDescricao` | — | Notices whose description matches |
| `POST /avisos/publicar/:idUsuario` | `avisoController.publicar` | `titulo`, `descricao` | Insert result |
| `PUT /avisos/editar/:idAviso` | `avisoController.editar` | `descricao` | Update result |
| `DELETE /avisos/deletar/:idAviso` | `avisoController.deletar` | — | Delete result |
| `GET /medidas/ultimas/:idAquario` | `medidaController` | — | AquaTech sensor readings |
| `GET /medidas/tempo-real/:idAquario` | `medidaController` | — | AquaTech sensor readings |
| `GET /aquarios/:empresaId`, `POST /aquarios/cadastrar` | `aquarioController` | — | AquaTech aquariums |
| `/empresas/*` | `empresaController` | — | AquaTech companies |

Pattern to follow when adapting or adding a resource: `routes/<resource>.js` → `controllers/<resource>Controller.js` → `models/<resource>Model.js`, with every query run through `database.executar`. The `aviso` resource is the template's full CRUD example and the model for `partida`.

## 5. Games API (RF08–RF10, RF16)

The `partida` resource is built: `routes/partidas.js` → `controllers/partidaController.js` → `models/partidaModel.js`, with parameterized queries. Its table is in `src/database/script-tabelas.sql`.

| Method and path | Body | Reply |
| --- | --- | --- |
| `GET /partidas/listar/:idUsuario` | — | 200 with `[{ id, resultado, adversario, cor, abertura, data_partida }]`, newest first, or 204 when there are none |
| `POST /partidas/cadastrar/:idUsuario` | `{ resultado, adversario, cor, lances }` | 201 with `{ id, abertura }`; 400 with the validation message |
| `DELETE /partidas/deletar/:idUsuario/:idPartida` | — | 200; 404 when the game does not exist or belongs to another user (RN03) |

- `resultado` is one of `vitoria`, `derrota` or `empate` (RN04).
- `adversario` is `humano` or `ia`; `cor` is `brancas` or `pretas`, the color the user played.
- `lances` is the list of moves in standard algebraic notation (SAN), as the game page writes them, such as `["e4", "c5", "Nf3"]`. The server checks the format of each move, not its legality: the game page validates moves while the game is played (RF14). The moves are stored joined by spaces.
- The client does not send a date: `data_partida` is set by the database when the game is saved (RN05). It is a `DATETIME`, so the dashboard groups games by day in the user's time zone.
- **Opening identification**: `models/openingBook.js` holds about 50 known openings, each with the SAN moves that define it, and `identifyOpening(moves)` returns the one with the longest sequence the game starts with, such as "Giuoco Piano" over "Abertura Italiana". A game that matches none is "Abertura irregular". To recognize a new opening, add a line to `OPENINGS`.
- The listing leaves out `lances`, which the dashboard does not use.
- The game page (`play/`) calls `POST /partidas/cadastrar` when a game ends.

## 6. Planned adaptation

Nothing in this section is built yet. Each change to `src/` or `app.js` needs the user's approval first.

### Users (RF01–RF05)

- **Sign-up**: drop `cpfServer` and `idEmpresaVincularServer`, reject a duplicate e-mail (RF02, RN01) and require a password of at least 8 characters (RN02). The new front-end already sends only `nomeServer`, `emailServer` and `senhaServer`, so sign-up returns 400 until this change is made.
- **Login**: stop looking up aquariums and return `{ id, nome, email }` with 200. Today a Chess Life user has no company, so login returns 204 and the front-end shows an error.
- **Passwords**: store a bcrypt hash in `senha_hash` instead of plain text, and never return it.
- **Access control**: protect the restricted API routes on the server (JWT or session; still an open decision), so every user only reaches their own games (RN03).


### Database

Replace the AquaTech tables with the MySQL model in [`03-database.md`](03-database.md): `usuario`, `perfil`, `abertura`, `partida` and `lance`. Its section 8 lists the code changes this brings, such as `partida.abertura` becoming `fk_abertura` and the moves moving to `lance`.

### Legacy code to remove

Once the user approves: the `aquario`, `medida` and `empresa` resources, and the `aviso` resource after `partida` has replaced it.

## 7. Known issues in the legacy back-end

These were found while reviewing `src/`. Fix them as part of the adaptation.

- **SQL injection**: every model builds SQL by interpolating request values into template strings. Use parameterized queries (`mysql2` placeholders).
- **Plain-text passwords**: `usuario.senha` is stored and compared as plain text. Login and the `aviso` listings return the password to the client.
- `aquarioModel.cadastrar` has invalid SQL (`INSERT INTO (…) aquario`), and its parameters are passed in the wrong order.
- `aquarioController.buscarAquariosPorEmpresa` reads `req.params.idUsuario`, but the route defines `:empresaId`.
- `routes/index.js` calls `res.render("index")` with no view engine set. It works only because `express.static` serves `public/index.html` first.
- `database/config.js` logs every query result, and the models log every SQL statement, including passwords.
