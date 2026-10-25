# Chess Life — Project specification

Development reference for Chess Life, a personal website about how chess shaped the author's life. It is the author's answer to the semester's *Projeto Individual* challenge of the *Pesquisa e Inovação* (PI) course, in the Análise e Desenvolvimento de Sistemas program at São Paulo Tech School (SPTech). This file covers what is needed to build the project and how it meets the challenge's objectives (section 11). The academic write-up stays outside the repository.

## 1. Overview

The site has two parts:

- **Public pages**: the author's story told as a timeline, a photo gallery with an Instagram-style design, and the sign-up and login forms.
- **Restricted area** for authenticated users: a dashboard with Chart.js statistics of the chess games each user played on the site, built from the database.
- **Complementary module**, built only after the main scope is done: playing chess against an AI.

The project has to show every layer of a web application working together: front-end, REST API, database on a virtual machine (VM), authentication and data visualization.

### The individual project challenge

The PI challenge asks for a website with a sign-up form, on a theme that represents the student. Chess Life meets each point of it:

| The challenge asks for | In Chess Life |
| --- | --- |
| A theme that represents the student or something they like | Chess, and how it shaped the author's life (section 10) |
| HTML, CSS and form validation in JavaScript | The pages in `site-pessoal/public/`; sign-up and login validate their fields in `auth/signup.js` and `auth/login.js` before calling the API |
| A Node.js API to register and/or query data in the database | The Express API: sign-up and login (`/usuarios`), and saving, listing and deleting games (`/partidas`), described in [`04-api.md`](04-api.md) |
| Focus on individual learning and on applying the semester's technical courses | Section 11 maps each course to where the project applies it |

### Goals

1. Tell the author's chess story as a timeline.
2. Build a photo gallery in a grid.
3. Add sign-up, login and logout, with passwords.
4. Record the games authenticated users play on the site, with their moves and opening.
5. Show game statistics in Chart.js charts fed by the database.
6. Host the database on a Linux VM that holds only the database.
7. Keep requirements, assumptions, architecture and data model documented.
8. Complementary: find out whether a game against an AI is feasible, and build it.

## 2. Pages

| Page | UI name | Content | Access |
| --- | --- | --- | --- |
| Home | Minha história | Project introduction, the author's story timeline, the socio-emotional competencies, a thanks note to the author's father, mother and grandmother, and the inspirations. The menu calls it "Minha história"; there is no separate "Início" item | Public |
| Gallery | Galeria | Photo grid, visual only | Public |
| Sign-up | Cadastro | Form with name, e-mail and password | Public |
| Login | Login | Form with e-mail and password | Public |
| Dashboard | Desempenho no Xadrez | Indicators, Chart.js charts and the list of games played on the site | Restricted |
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
| R09 | The Linux VM holds only the database (*Introdução aos Sistemas Operacionais*). The application server runs outside it. |
| R10 | Code and its history live in a public Git repository, shared with the teachers on Moodle, with frequent commits. |
| R11 | A prompt diary records how AI assistants were used (section 11). |
| R12 | Nothing outside the course material without a justification and the teacher's prior approval. The legacy template's architecture is kept. |
| R13 | The author must be able to explain every layer (front-end, back-end, database) and how they talk to each other. Code the author cannot explain does not count as delivered. |
| R14 | The final presentation to the panel happens between 30/11 and 04/12 and lasts 10 minutes. |

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
| RF06 | The home page ("Minha história" in the menu) shows the author's story. | Essential |
| RF07 | The gallery shows photos in an Instagram-style grid. | Important |
| RF08 | A game played on the site is recorded when it ends, with its result, opponent, color and moves; the API identifies the opening from the moves. | Essential |
| RF09 | Chart.js charts are built from database data. | Essential |
| RF10 | Users can list the games they recorded. Games cannot be deleted. | Important |
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
| RN03 | Users can only see their own games. |
| RN04 | A game result is one of: win, loss or draw. |
| RN05 | A recorded game cannot have a future date: the database sets it to the moment the game is saved. |
| RN06 | Unauthenticated users can only reach home, gallery, sign-up and login. |
| RN07 | In a game against the AI, a move is accepted only if it is legal. |

Validate business rules on the server. Client-side validation only improves the user experience (RF11).

## 5. Architecture

Client-server application in three layers:

1. **Browser**: HTML, CSS, JavaScript and Chart.js. Pages call the REST API with `fetch` and render the JSON responses.
2. **Application server**: Node.js with Express. It exposes the REST API, applies the business rules, queries the database and serves the front-end's static files from the same server.
3. **Database**: MySQL on a Linux VM that holds only the database (R09). The application server connects to it over the network.

In the complementary module, the server also talks to the Gemini API or to a chess engine.

### Technologies

| Layer | Technology | Purpose |
| --- | --- | --- |
| Front-end | HTML5, CSS3, JavaScript | Page structure, style and interactivity |
| Visualization | Chart.js | Game statistics charts |
| Back-end | Node.js, Express | REST API, business rules, static files |
| Database | MySQL 8.0+ | Users, profiles, games, moves and openings; modeled in [`03-database.md`](03-database.md) |
| Authentication | `sessionStorage` | Login state and access to the restricted pages |
| Infrastructure | Linux VM | Hosts only the database (R09) |
| Version control | Git, GitHub | Source control |
| Chess rules | Own JavaScript code (`play/rules.js`), board as an 8×8 matrix | Legal moves, check, special moves and game end |
| Complementary | Gemini API or Stockfish | AI moves |

## 6. Data model

The database is modeled in MySQL. The full model (entity-relationship diagram, data dictionary, constraints, legacy changes and DDL) is in [`03-database.md`](03-database.md). Summary:

| Table | Columns | Notes |
| --- | --- | --- |
| `usuario` | `id` (PK), `nome`, `email` (unique), `senha`, `data_cadastro` | Access data |
| `perfil` | `id` (PK), `fk_usuario` (FK → `usuario.id`, unique), `rating`, `ano_inicio`, `bio`, `fk_abertura_favorita` (FK → `abertura.id`) | Optional chess details of a user: 1:1 with `usuario`, non-identifying relationship |
| `abertura` | `id` (PK), `nome`, `lances` (unique) | Known openings and the moves that define them |
| `partida` | `id` (PK), `fk_usuario` (FK → `usuario.id`), `fk_abertura` (FK → `abertura.id`), `resultado`, `adversario`, `cor`, `data_partida` | A game played on the site. One user plays many games; one opening appears in many games (non-identifying relationships) |
| `lance` | `fk_partida` (PK, FK → `partida.id`), `numero` (PK), `san` | One move of a game: weak entity, 1:N with `partida`, identifying relationship |

Gallery photos are not stored in the database: the image files stay in `public/assets/` and the captions in the gallery's HTML.

## 7. Dashboard charts

The dashboard, titled "Desempenho no Xadrez", fetches the user's games from the API and shows:

- **Indicators**:
  - Games played today, compared with yesterday.
  - Win rate of all games, compared with the win rate of the games played until yesterday (in percentage points).
  - Favorite opening (the most played), with its number of games and win rate.
- **Stacked bar chart**: games per week over the last 8 weeks (weeks start on Monday), split into wins, draws and losses.
- **Donut chart**: share of wins, draws and losses, with the win rate in its middle and the count of each result next to it.
- **Bar chart**: most played openings, with the number of games at the end of each bar; long names are shortened with "…" on the axis.
- **Table**: the games, with date and time, opening, opponent, color and result (RF10).
- **With the AI module**: performance against human opponents compared with performance against the AI (`adversario`).

Games are not typed in by hand: they reach the dashboard only by being played on the site.

The page uses the site's look: the paper background, white cards with a brass top edge for the indicators, Georgia numbers and titles, and result colors from `--win`, `--draw` and `--loss` (see "Themes" in [`02-site-pessoal.md`](02-site-pessoal.md)). On screens wider than 800px the dashboard fits the browser window and the page does not scroll: the indicators sit in a row on top, and the charts and the table fill two rows below them, each with a wide and a narrow panel. The footer is hidden on this page to give the charts more height. When there are more games than fit, only the table scrolls, inside its panel. On phones the panels stack and the page scrolls.

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
| 6 | Database on the VM and testing | Site working against the VM's database |
| 7 | Socio-emotional presentation (PPT) | Presentation for the final panel |
| 8 | Game against the AI (complementary) | Playable board |

The PI challenge sets this schedule. The stages above fit into it:

| PI item | Week | Stages |
| --- | --- | --- |
| Start of the individual project | 1 | — |
| Theme defined, documentation and Git started | 2 | 1 |
| Start of the site: home page | 3 | 4 |
| Data entry screens (sign-up and login), loops and arrays | 4 and 5 | 2, 3 |
| Dashboard | 6 | 5 |
| Presentation (PPT) | — | 7 |
| Final presentation to the panel | 30/11 to 04/12 | 6, 7 |

There are weekly inspections with teachers and monitors, with a report on Moodle.

## 10. Content for "Minha história" and the competencies

Facts the story timeline is built from. The page text itself is written in Portuguese.

- Started in the 4th grade of elementary school, through a selection for students interested in chess.
- That same year, won all six of his games in a competition, which helped his school win the gold medal.
- Chess sparked his interest in geometry and angles. That logical and spatial reasoning contributed to a bronze medal in the OBMEP (Brazilian Public Schools Mathematics Olympiad).
- Studied openings, especially the Sicilian Defense (Accelerated Dragon variation) and the Italian Game.
- Ratings: about 1500 in rapid games and about 1400 in blitz games.
- Inspirations: grandmasters Krikor Mekhitarian and Evandro Barbosa (Brazil); Hikaru Nakamura and Magnus Carlsen (international).

The "Competências socioemocionais" section of the home page links each competency of SPTech's socio-emotional evaluation model (*Desenvolvimento Socioemocional — Modelo de avaliação*) to the story. Each card is a chess piece whose move explains the competency, with the link to the story below it. The links were written from the facts above; the ones marked "general" rest on what chess demands rather than on a specific fact, and await the author's review.

| Competency | Piece and move | Linked to | Basis |
| --- | --- | --- | --- |
| Profundidade | Bishop: sees far along the diagonal | The deep study of the Sicilian Defense (Accelerated Dragon) and the Italian Game | Story fact |
| Conexão | Knight: jumps and links distant squares | Chess led to geometry and the OBMEP bronze medal | Story fact |
| Exposição | Queen: the piece everyone watches | Representing the school in a competition | General |
| Relacionamento | Pawns: in a chain, each protects the next | The six wins added up to the school's gold medal | Story fact |
| Pontualidade | Rook: firm in its place | The clock in rapid and blitz games | General |
| Iniciativa | King's pawn: the first move, e4 | The interest that led to the school's chess selection | Story fact |
| Resiliência | King: holds out until the end of the game | Keeping on playing and studying after losses to reach about 1500 in rapid games | General |
| Profissionalismo | Castling: a move with precise rules | The expected conduct in a competition: greeting the opponent, respecting the clock, silence | General |

## 11. Individual project (PI) objectives

The PI challenge (*Desafio do Semestre — Projeto Individual*) asks the project to apply what was learned in every course of the semester. Its goal is not the grade but showing the level of learning. This section maps each objective to the project.

### Courses applied

| Course | The challenge asks for | Where Chess Life applies it | Status |
| --- | --- | --- | --- |
| Tecnologia da Informação | Project document, planning in Trello, Git governance | This documentation (`.docs/`); Git with typed commit messages and small commits (`commit` skill); planning in Trello | Documentation and Git done; the Trello board is not linked from the repository yet |
| Banco de Dados | Logical model, relationships, SQL commands | [`03-database.md`](03-database.md): ER diagram, 1:1 and 1:N relationships, a weak entity (`lance`), constraints; the scripts in `src/database/` and the queries in `src/models/` | Done |
| Algoritmos | Variables, functions, math operations, conditionals, loops, arrays | `dashboard/dashboard.js` counts results, openings and games per week with loops over the games array; `play/rules.js` generates and checks the legal moves on an 8×8 matrix; `src/models/openingBook.js` picks the opening with a loop | Done |
| Arquitetura de Computadores and Matemática | Applying math calculations | Win rate as a percentage and its change in percentage points, games per week and per day (`dashboard/dashboard.js`); board coordinates and piece movement as row and column arithmetic (`play/rules.js`) | Done |
| Introdução aos Sistemas Operacionais | A Linux VM holding only the database | MySQL on the VM (R09), with its own application user (`src/database/03-app-user.sql`) | To do: the database still runs locally |
| Pesquisa e Inovação | Context, planning, dashboard and indicators | Context and planning in this document (sections 1 to 9); the "Desempenho no Xadrez" dashboard with three indicators and three Chart.js charts (section 7) | Done |
| Socioemocional | Applying the concepts worked in class | The home page's "Competências socioemocionais" section (section 10) and the presentation below | Section done; presentation to do |

### Socio-emotional presentation

The presentation must "sell the idea" of the site to the audience. Besides the site, it answers the questions below. The left column is what the challenge asks; the right column is what the project already has to answer it, or what the author still has to write.

| Question | Material |
| --- | --- |
| When, in the author's life, did the interest in the theme start? How is it part of daily life, and why this theme? | The 4th-grade chess selection and the gold medal won with the school (section 10, "Minha história" on the home page). How chess is part of daily life today: to be written by the author |
| Which of the author's values does the project represent? | The eight competencies on the home page, each linked to the story (section 10) |
| What was the hardest part of building the project or of the theme? | To be written by the author |
| What was the biggest achievement in this challenge? | To be written by the author |
| Is there someone who deserves thanks for the result? | The author's father, mother and grandmother, for their encouragement at decisive moments: the "Agradecimentos" section of the home page |

### Use of AI and the prompt diary

The challenge allows AI as support (answering questions, reviewing, generating tests and code within the proposed architecture), but the understanding cannot be outsourced. Generating the whole project, changing the proposed architecture, bringing technologies outside the material or delivering code the author cannot explain is not accepted.

The prompt diary is mandatory. It must record what was asked, used and changed, and which AI assistants were used; it may also link the shared conversations. In this repository the diary is `.docs/prompts/`, one file per day, with the decisions in `.docs/decisions.md` (see [`README.md`](README.md)).

### Validation with the teachers

In the inspections and at the panel, the teachers may ask the author to:

1. Explain any part of the code.
2. Make a change live.
3. Draw the flow front-end → back-end → database.

The flow, with login as an example:

```
login.html / login.js          app.js → routes/usuarios.js → usuarioController.js → usuarioModel.js          MySQL (VM)
validates the fields  --POST /usuarios/autenticar-->  checks the fields and compares the password  --SELECT-->  usuario
saves the user in     <--200 { id, nome, email }---  replies with the user, or 403                <--row----
sessionStorage
```

Saving a game follows the same path: `play.js` sends `POST /partidas/cadastrar/:idUsuario`, `partidaController.js` validates it and identifies the opening, and `partidaModel.js` inserts the game and its moves into `partida` and `lance` in one transaction. The contracts are in [`04-api.md`](04-api.md), and the authentication flow is in section 3 of [`02-site-pessoal.md`](02-site-pessoal.md).

## References

- Chart.js — https://www.chartjs.org/docs/latest/
- Express — https://expressjs.com/
- MySQL — https://dev.mysql.com/doc/
- Stockfish — https://stockfishchess.org/
- Gemini API — https://ai.google.dev/gemini-api/docs
