# Chess Life — Project specification

Development reference for Chess Life, a personal website about how chess shaped the author's life. It is built for the *Pesquisa e Inovação* course of the Análise e Desenvolvimento de Sistemas program at São Paulo Tech School (SPTech). This file covers only what is needed to build the project. The academic write-up stays outside the repository.

## 1. Overview

The site has two parts:

- **Public pages**: the author's story told as a timeline, a photo gallery with an Instagram-style design, and the sign-up and login forms.
- **Restricted area** for authenticated users: a dashboard where each user records chess games and sees Chart.js statistics built from the database.
- **Complementary module**, built only after the main scope is done: playing chess against an AI.

The project has to show every layer of a web application working together: front-end, REST API, database on a virtual machine (VM), authentication and data visualization.

### Goals

1. Tell the author's chess story as a timeline.
2. Build a photo gallery in a grid.
3. Add sign-up, login and logout, with passwords stored securely.
4. Let authenticated users record their games.
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
| Dashboard | Dashboard | Game recording and Chart.js charts | Restricted |
| Play (complementary) | Jogar | Board for a game against the AI | Restricted |

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
| P07 | Users feed the chart data by recording their own games. |
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
| RF08 | Authenticated users can record a game (result, opening and date). | Essential |
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
| RN05 | A recorded game cannot have a future date. |
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
| Database | MySQL | Users, games and photos |
| Security | bcrypt; JWT or session | Password hashing and access control |
| Infrastructure | Linux VM | Hosts the database and the application |
| Version control | Git, GitHub | Source control |
| Complementary | chess.js; Gemini API or Stockfish | Chess rules and AI moves |

### Security

- Store passwords only as bcrypt hashes (`senha_hash`). Never store or log the plain-text password.
- Use parameterized queries for every SQL statement.
- Protect restricted pages and their API routes on the server. Hiding links in the UI is not enough.
- Scope every game query to the authenticated user (RN03).
- Keep secrets such as the database credentials, the JWT secret and the Gemini key in server environment variables. Never put them in front-end code or commit them.

## 6. Data model

One user records many games (one-to-many between `usuario` and `partida`).

| Table | Columns | Notes |
| --- | --- | --- |
| `usuario` | `id` (PK), `nome`, `email` (unique), `senha_hash`, `data_cadastro` | Access data |
| `partida` | `id` (PK), `fk_usuario` (FK → `usuario.id`), `resultado`, `abertura`, `adversario`, `data_partida` | `resultado` is win, loss or draw (RN04); `adversario` tells human from AI |
| `foto` | `id` (PK), `caminho`, `legenda`, `data_publicacao` | The image file stays on the server. The database only stores its path. |

Table and column names are in Portuguese, as in the original specification.

## 7. Dashboard charts

The dashboard fetches the user's data from the API and draws:

- **Pie chart**: share of wins, losses and draws.
- **Line chart**: number of games over time.
- **Bar chart**: most played openings.
- **With the AI module**: performance against human opponents compared with performance against the AI (`adversario`).

## 8. Complementary module: chess against an AI

The user moves pieces on an on-screen board and the AI replies. Start it only after the main scope is finished.

### Options for the AI opponent

- **Gemini API**: the server sends the current position in FEN and asks for the next move. Language models can suggest illegal moves, so each move needs validation and a retry.
- **Stockfish**: an open-source chess engine that can run in the browser or on the server. Its moves are always legal, and its difficulty can be adjusted.
- **Combined**: Stockfish picks the move and Gemini comments on the game in natural language.

In every option, chess.js applies the rules, validates moves and detects the end of the game. The Gemini key lives only on the server.

### Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| AI suggests an illegal move | Game stalls or becomes wrong | Validate with chess.js and request a new move |
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
| 5 | Game recording and Chart.js dashboard | Charts fed by the database |
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
- Chart.js loading: CDN or npm dependency.
- AI opponent: Gemini, Stockfish or both.
- HTTPS on the VM (R08).
- Non-functional requirements: the original specification mentions them but does not list any.

## References

- Chart.js — https://www.chartjs.org/docs/latest/
- Express — https://expressjs.com/
- MySQL — https://dev.mysql.com/doc/
- chess.js — https://github.com/jhlywa/chess.js
- Stockfish — https://stockfishchess.org/
- Gemini API — https://ai.google.dev/gemini-api/docs
