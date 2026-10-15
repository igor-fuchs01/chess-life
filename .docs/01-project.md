# Chess Life — Project specification

Development reference for Chess Life, a personal website about how chess shaped the author's life. It is built for the *Pesquisa e Inovação* course of the Análise e Desenvolvimento de Sistemas program at São Paulo Tech School (SPTech). This file covers only what is needed to build the project. The academic write-up stays outside the repository.

## 1. Overview

The site has two parts:

- **Public pages**: the author's story told as a timeline, a photo gallery with an Instagram-style design, and the sign-up and login forms.
- **Restricted area** for authenticated users: a dashboard with Chart.js statistics of the chess games each user played on the site, built from the database.
- **Complementary module**, built only after the main scope is done: playing chess against an AI.

The project has to show every layer of a web application working together: front-end, REST API, database on a virtual machine (VM), authentication and data visualization.

### Goals

1. Tell the author's chess story as a timeline.
2. Build a photo gallery in a grid.
3. Add sign-up, login and logout, with passwords stored securely.
4. Record the games authenticated users play on the site, with their moves and opening.
5. Show game statistics in Chart.js charts fed by the database.
6. Host the database and the application on a VM.
7. Keep requirements, assumptions, architecture and data model documented.
8. Complementary: find out whether a game against an AI is feasible, and build it.

## 2. Pages

| Page | UI name | Content | Access |
| --- | --- | --- | --- |
| Home | Início | Project introduction and navigation to every section | Public |
| My story | Minha história | Timeline of how chess started and what it changed in the author's life | Public |
| Gallery | Galeria | Photo grid, visual only | Public |
| Sign-up | Cadastro | Form with name, e-mail and password | Public |
| Login | Login | Form with e-mail and password | Public |
| Dashboard | Meu desempenho no xadrez | Indicators, Chart.js charts and the list of games played on the site | Restricted |
| Play | Jogar | Board with every rule of chess for a game between two people on the same computer; a game against the AI comes with the complementary module | Restricted |

UI copy is written in Portuguese (see the language convention in `.claude/CLAUDE.md`).

### Out of scope

- Likes, comments and followers in the gallery.
- Online games between two human users.
- Password recovery by e-mail.
- Native mobile app.
- Admin panel.

## 3. Assumptions and constraints

### Assumptions

If one of these stops being true, the plan has to be reviewed.

| ID | Assumption |
| --- | --- |
| P01 | The VM is available and reachable during development and the final presentation. |
| P02 | MySQL is installed and maintained on the VM itself. |
| P03 | The back-end is Node.js with Express, and it also serves the front-end files. |
| P04 | Users have an up-to-date browser and an internet connection. |
| P05 | The author provides the gallery photos and holds the rights to them. |
| P06 | The gallery only borrows the social-network look. It has no social interactions. |
| P07 | Users feed the chart data by playing games on the site. |
| P08 | Chart.js is loaded from a CDN or installed as a project dependency. |
| P09 | As an academic project, it has few users and little traffic. |
| P10 | The AI module is complementary and does not put the main scope at risk. |
| P11 | If the Gemini API is used, a valid key within the free quota is available. |

### Constraints

| ID | Constraint |
| --- | --- |
| R01 | The front-end is built with HTML, CSS and JavaScript. |
| R02 | Chart.js is mandatory for data visualization. |
| R03 | Data is persisted in a database hosted on a VM. |
| R04 | Front-end and back-end must be integrated. |
| R05 | The system must have sign-up, login and password. |
| R06 | Project documentation is mandatory. |
| R07 | The deadline is set by the *Pesquisa e Inovação* course. |
| R08 | Infrastructure is limited to the available VM, so HTTPS may stay out of scope. |

## 4. Requirements

### Functional requirements

Priorities: **Essential** (must ship), **Important** (should ship), **Desirable** (complementary AI module).

| ID | Description | Priority |
| --- | --- | --- |
| RF01 | Users can sign up with name, e-mail and password. | Essential |
| RF02 | Sign-up rejects an e-mail that is already registered. | Essential |
| RF03 | Users can log in with e-mail and password. | Essential |
| RF04 | Users can log out. | Essential |
| RF05 | Only authenticated users can access the dashboard. | Essential |
| RF06 | The "Minha história" page shows the author's story. | Essential |
| RF07 | The gallery shows photos in an Instagram-style grid. | Important |
| RF08 | A game played on the site is recorded when it ends, with its result, opponent, color and moves; the API identifies the opening from the moves. | Essential |
| RF09 | Chart.js charts are built from database data. | Essential |
| RF10 | Users can list and delete the games they recorded. | Important |
| RF11 | Forms show error and success messages. | Important |
| RF12 | The home page links to every section. | Essential |
| RF13 | Authenticated users can start a game against the AI. | Desirable |
| RF14 | Moves are validated against the rules of chess. | Desirable |
| RF15 | The system detects check, checkmate, draw and game end. | Desirable |
| RF16 | The result of a game against the AI is saved and shows in the charts. | Desirable |

### Business rules

| ID | Rule |
| --- | --- |
| RN01 | A user's e-mail is unique. |
| RN02 | Passwords have at least 8 characters. |
| RN03 | Users can only see and delete their own games. |
| RN04 | A game result is one of: win, loss or draw. |
| RN05 | A recorded game cannot have a future date: the database sets it to the moment the game is saved. |
| RN06 | Unauthenticated users can only reach home, story, gallery, sign-up and login. |
| RN07 | In a game against the AI, a move is accepted only if it is legal. |

Validate business rules on the server. Client-side validation only improves the user experience (RF11).

## 5. Architecture

Client-server application in three layers:

1. **Browser**: HTML, CSS, JavaScript and Chart.js. Pages call the REST API with `fetch` and render the JSON responses.
2. **Application server**: Node.js with Express. It exposes the REST API, applies the business rules, queries the database and serves the front-end's static files from the same server.
3. **Database**: MySQL on the VM.

In the complementary module, the server also talks to the Gemini API or to a chess engine.

### Technologies

| Layer | Technology | Purpose |
| --- | --- | --- |
| Front-end | HTML5, CSS3, JavaScript | Page structure, style and interactivity |
| Visualization | Chart.js | Game statistics charts |
| Back-end | Node.js, Express | REST API, business rules, static files |
| Database | MySQL 8.0+ | Users, profiles, games, moves and openings; modeled in [`03-database.md`](03-database.md) |
| Security | bcrypt; JWT or session | Password hashing and access control |
| Infrastructure | Linux VM | Hosts the database and the application |
| Version control | Git, GitHub | Source control |
| Chess rules | Own JavaScript code (`play/rules.js`), board as an 8×8 matrix | Legal moves, check, special moves and game end |
| Complementary | Gemini API or Stockfish | AI moves |

### Security

- Store passwords only as bcrypt hashes (`senha_hash`). Never store or log the plain-text password.
- Use parameterized queries for every SQL statement.
- Protect restricted pages and their API routes on the server. Hiding links in the UI is not enough.
- Scope every game query to the authenticated user (RN03).
- Keep secrets such as the database credentials, the JWT secret and the Gemini key in server environment variables. Never put them in front-end code or commit them.

## 6. Data model

The database is modeled in MySQL. The full model (entity-relationship diagram, data dictionary, constraints, legacy changes and DDL) is in [`03-database.md`](03-database.md). Summary:

| Table | Columns | Notes |
| --- | --- | --- |
| `usuario` | `id` (PK), `nome`, `email` (unique), `senha_hash`, `data_cadastro` | Access data |
| `perfil` | `id` (PK), `fk_usuario` (FK → `usuario.id`, unique), `rating`, `ano_inicio`, `bio`, `fk_abertura_favorita` (FK → `abertura.id`) | Optional chess details of a user: 1:1 with `usuario`, non-identifying relationship |
| `abertura` | `id` (PK), `nome`, `lances` (unique) | Known openings and the moves that define them |
| `partida` | `id` (PK), `fk_usuario` (FK → `usuario.id`), `fk_abertura` (FK → `abertura.id`), `resultado`, `adversario`, `cor`, `data_partida` | A game played on the site. One user plays many games; one opening appears in many games (non-identifying relationships) |
| `lance` | `fk_partida` (PK, FK → `partida.id`), `numero` (PK), `san` | One move of a game: weak entity, 1:N with `partida`, identifying relationship, deleted with its game |

Gallery photos are not stored in the database: they stay in `public/gallery/` and in the page's HTML.

## 7. Dashboard charts

The dashboard, titled "Meu desempenho no xadrez", fetches the user's games from the API and shows:

- **Indicators**:
  - Games played today, compared with yesterday.
  - Win rate of all games, compared with the win rate of the games played until yesterday (in percentage points).
  - Favorite opening (the most played), with its number of games and win rate.
- **Stacked bar chart**: games per week over the last 8 weeks (weeks start on Monday), split into wins, losses and draws.
- **Pie chart**: share of wins, losses and draws.
- **Bar chart**: most played openings.
- **Table**: the games, with date and time, opening, opponent, color and result, and a button to delete each one (RF10).
- **With the AI module**: performance against human opponents compared with performance against the AI (`adversario`).

Games are not typed in by hand: they reach the dashboard only by being played on the site.

## 8. Complementary module: chess against an AI

The user moves pieces on an on-screen board and the AI replies. Start it only after the main scope is finished.

### Options for the AI opponent

- **Gemini API**: the server sends the current position in FEN and asks for the next move. Language models can suggest illegal moves, so each move needs validation and a retry.
- **Stockfish**: an open-source chess engine that can run in the browser or on the server. Its moves are always legal, and its difficulty can be adjusted.
- **Combined**: Stockfish picks the move and Gemini comments on the game in natural language.

In every option, the game page's own rules (`play/rules.js`, see [`02-site-pessoal.md`](02-site-pessoal.md)) validate moves and detect the end of the game. The Gemini key lives only on the server.

### Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| AI suggests an illegal move | Game stalls or becomes wrong | Validate with `play/rules.js` and request a new move |
| API usage limit reached | AI stops answering | Fall back to Stockfish |
| API key exposed | Account misuse | Keep the key in a server environment variable |
| Not enough time | Module left unfinished | Treat it as complementary, after the main scope |

## 9. Development plan

| Stage | Activities | Deliverable |
| --- | --- | --- |
| 1 | Documentation, requirements and screen prototypes | Document and wireframes |
| 2 | VM setup and database creation | MySQL running on the VM |
| 3 | Sign-up, login and logout API | Working authentication |
| 4 | Home, story and gallery pages | Public pages |
| 5 | Games API (opening identification) and Chart.js dashboard | Charts fed by the database |
| 6 | Deployment to the VM and testing | Site online and tested |
| 7 | Game against the AI (complementary) | Playable board |

## 10. Content for "Minha história"

Facts the story timeline is built from. The page text itself is written in Portuguese.

- Started in the 4th grade of elementary school, through a selection for students interested in chess.
- That same year, won all six of his games in a competition, which helped his school win the gold medal.
- Chess sparked his interest in geometry and angles. That logical and spatial reasoning contributed to a bronze medal in the OBMEP (Brazilian Public Schools Mathematics Olympiad).
- Studied openings, especially the Sicilian Defense (Accelerated Dragon variation) and the Italian Game.
- Ratings: about 1500 in 10-minute games and about 1400 in games without increment.
- Inspirations: grandmasters Krikor Mekhitarian and Evandro Barbosa (Brazil); Hikaru Nakamura, Magnus Carlsen and Andrea Botez (international).

## 11. Open decisions

- Authentication mechanism: JWT or server session.
- Authentication mechanism (JWT or server session): until it is chosen, the API trusts the user id in the URL. See section 4 of [`04-api.md`](04-api.md).
- AI opponent: Gemini, Stockfish or both.
- HTTPS on the VM (R08).
- Non-functional requirements: the original specification mentions them but does not list any.

## References

- Chart.js — https://www.chartjs.org/docs/latest/
- Express — https://expressjs.com/
- MySQL — https://dev.mysql.com/doc/
- Stockfish — https://stockfishchess.org/
- Gemini API — https://ai.google.dev/gemini-api/docs
