# site-pessoal — Application

`site-pessoal/` holds the Chess Life application. The specification it implements is in [`project.md`](project.md).

The folder started as a copy of SPTech's **web-data-viz** template (`BandTec/web-data-viz`, built for the "AquaTech" sample project). Its back-end (`app.js` and `src/`) is legacy code to be reused and adapted. Its legacy front-end was removed and rebuilt for Chess Life.

## Running

```
cd site-pessoal
npm install
npm start        # or: npm run dev (restarts on file changes, uses nodemon)
```

- `app.js` picks the environment file on its first lines: `.env` for `producao` (remote database) and `.env.dev` for `desenvolvimento` (local database).
- Both files hold `AMBIENTE_PROCESSO`, `DB_HOST`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `APP_PORT` and `APP_HOST`. They contain credentials and are ignored by git, so never commit them.
- The site runs at `http://APP_HOST:APP_PORT`. Variables already set in the shell win over the file, for example `APP_PORT=3399 npm start`.
- The tables the legacy API expects are in `src/database/script-tabelas.sql`.

There are no automated tests or lint setup yet.

## Structure

```
site-pessoal/
├── app.js                  Express server: static files from public/ and API routers
├── package.json            express, mysql2, dotenv, cors, nodemon
├── src/                    Legacy back-end (routes → controllers → models)
│   ├── database/config.js  MySQL connection; executar(sql) runs one query
│   ├── routes/             URL → controller function
│   ├── controllers/        Reads the request, validates and replies
│   └── models/             Builds and runs the SQL; openingBook.js identifies openings
└── public/                 Chess Life front-end, one folder per feature
    ├── index.html          Home page
    ├── shared/             Used by every page
    │   ├── style.css       Design tokens and base styles (classic design)
    │   ├── logo.svg        Logo emblem (king in a green seal), used in the header and as the favicon
    │   ├── session.js      Session in sessionStorage
    │   └── layout.js       Header, footer and form messages
    ├── home/               Home page styles and the opening board
    ├── story/              "Minha história" page
    ├── gallery/            Photo gallery page
    ├── auth/               Login and sign-up pages
    └── dashboard/          Restricted dashboard: indicators, charts and games played on the site
```

## Front-end

### Design

The site uses the "classic" direction chosen by the user: cream paper (`--paper`), deep green (`--green`) and brass (`--brass`), a serif for headings (`--font-heading`: Georgia) and a sans-serif for text (`--font-body`: Segoe UI or the system font). Only fonts already installed on the user's system are used, with no web fonts. Colors and fonts are CSS variables in the `:root` block of `shared/style.css`; feature styles only use those variables.

### Pages

| URL | Feature folder | Access | API used |
| --- | --- | --- | --- |
| `/` | `index.html`, `home/` | Public | — |
| `/story/story.html` | `story/` | Public | — |
| `/gallery/gallery.html` | `gallery/` | Public | — |
| `/auth/login.html` | `auth/` | Public | `POST /usuarios/autenticar` |
| `/auth/signup.html` | `auth/` | Public | `POST /usuarios/cadastrar` |
| `/dashboard/dashboard.html` | `dashboard/` | Restricted | `GET /partidas/listar`, `DELETE /partidas/deletar` |

### Conventions

- Every page has empty `<header id="site-header">` and `<footer id="site-footer">` elements. It loads `shared/session.js` and then `shared/layout.js`, which fills them. The navigation shows "Entrar" to visitors, and "Dashboard" and "Sair" to logged-in users.
- Session: `startSession`, `getSessionUser`, `endSession` and `requireSession` in `shared/session.js`, stored in `sessionStorage` (`USER_ID`, `USER_NAME`, `USER_EMAIL`). Restricted pages call `requireSession()` in `<head>`, which sends visitors to the login page.
- Form feedback uses `showMessage(element, text, "error" | "success")` from `shared/layout.js` (RF11).
- Pages use relative paths for their files, so they also open straight from disk. Scripts build links from `SITE_ROOT` (`shared/session.js`). API calls only work when the site is served by `app.js`.
- Forms are validated on the client too, for a quick reply: password of at least 8 characters (RN02), valid e-mail and matching confirmation. The server must repeat these checks.
- User-provided text goes into the page with `textContent`, never `innerHTML`.
- Chart.js 4.4.1 is loaded from cdnjs only on the dashboard.
- Code and identifiers are in English; text shown to users is in Portuguese.

### Gallery photos

The gallery currently shows colored placeholder tiles. To use a photo, add the image under `public/gallery/` and put an `<img>` inside its `<figure class="photo">`. The CSS already fills the tile with it.

## Legacy API

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

## Games API (RF08–RF10, RF16)

The `partida` resource is built: `routes/partidas.js` → `controllers/partidaController.js` → `models/partidaModel.js`, with parameterized queries. Its table is in `src/database/script-tabelas.sql`.

| Method and path | Body | Reply |
| --- | --- | --- |
| `GET /partidas/listar/:idUsuario` | — | 200 with `[{ id, resultado, adversario, cor, abertura, data_partida }]`, newest first, or 204 when there are none |
| `POST /partidas/cadastrar/:idUsuario` | `{ resultado, adversario, cor, lances }` | 201 with `{ id, abertura }`; 400 with the validation message |
| `DELETE /partidas/deletar/:idUsuario/:idPartida` | — | 200; 404 when the game does not exist or belongs to another user (RN03) |

- `resultado` is one of `vitoria`, `derrota` or `empate` (RN04).
- `adversario` is `humano` or `ia`; `cor` is `brancas` or `pretas`, the color the user played.
- `lances` is the list of moves in standard algebraic notation (SAN), as chess.js writes them, such as `["e4", "c5", "Nf3"]`. The server checks the format of each move, not its legality: the game page validates moves while the game is played (RF14). The moves are stored joined by spaces.
- The client does not send a date: `data_partida` is set by the database when the game is saved (RN05). It is a `DATETIME`, so the dashboard groups games by day in the user's time zone.
- **Opening identification**: `models/openingBook.js` holds about 50 known openings, each with the SAN moves that define it, and `identifyOpening(moves)` returns the one with the longest sequence the game starts with, such as "Giuoco Piano" over "Abertura Italiana". A game that matches none is "Abertura irregular". To recognize a new opening, add a line to `OPENINGS`.
- The listing leaves out `lances`, which the dashboard does not use.
- Until the game page exists, nothing calls `POST /partidas/cadastrar`, so the dashboard stays empty.

## Planned adaptation

Nothing in this section is built yet. Each change to `src/` or `app.js` needs the user's approval first.

### Users (RF01–RF05)

- **Sign-up**: drop `cpfServer` and `idEmpresaVincularServer`, reject a duplicate e-mail (RF02, RN01) and require a password of at least 8 characters (RN02). The new front-end already sends only `nomeServer`, `emailServer` and `senhaServer`, so sign-up returns 400 until this change is made.
- **Login**: stop looking up aquariums and return `{ id, nome, email }` with 200. Today a Chess Life user has no company, so login returns 204 and the front-end shows an error.
- **Passwords**: store a bcrypt hash in `senha_hash` instead of plain text, and never return it.
- **Access control**: protect the restricted API routes on the server (JWT or session; still an open decision), so every user only reaches their own games (RN03).


### Database

Replace the AquaTech tables with the MySQL model in [`database.md`](database.md): `usuario`, `abertura` and `partida`. Its section 8 lists the code changes this brings, such as `partida.abertura` becoming `fk_abertura`.

### Legacy code to remove

Once the user approves: the `aquario`, `medida` and `empresa` resources, and the `aviso` resource after `partida` has replaced it.

## Known issues in the legacy back-end

These were found while reviewing `src/`. Fix them as part of the adaptation.

- **SQL injection**: every model builds SQL by interpolating request values into template strings. Use parameterized queries (`mysql2` placeholders).
- **Plain-text passwords**: `usuario.senha` is stored and compared as plain text. Login and the `aviso` listings return the password to the client.
- `aquarioModel.cadastrar` has invalid SQL (`INSERT INTO (…) aquario`), and its parameters are passed in the wrong order.
- `aquarioController.buscarAquariosPorEmpresa` reads `req.params.idUsuario`, but the route defines `:empresaId`.
- `routes/index.js` calls `res.render("index")` with no view engine set. It works only because `express.static` serves `public/index.html` first.
- `database/config.js` logs every query result, and the models log every SQL statement, including passwords.
