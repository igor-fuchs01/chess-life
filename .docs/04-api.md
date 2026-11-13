# Chess Life — API contracts

The REST API of Chess Life, served by `web-data-viz/app.js` together with the site, on the same address. This document is the contract between the front-end and the back-end: a route changes here first, and every change keeps the front-end working.

The code follows `routes/<resource>.js` → `controllers/<resource>Controller.js` → `models/<resource>Model.js` (see section 4 of [`02-web-data-viz.md`](02-web-data-viz.md)). The tables are described in [`03-database.md`](03-database.md).

## 1. Conventions

- **Request bodies** are JSON, sent with `Content-Type: application/json`.
- **Successful replies** carry JSON, or no body (`204`).
- **Error replies** carry a short plain-text message in Portuguese, written to be shown to the user as is, such as `E-mail e/ou senha inválidos.`. They never carry SQL errors or stack traces; the server logs the cause instead.
- **Field names** are in Portuguese and follow the database (`acertou`, `fk_exercicio`). The user fields keep the names of the legacy template (`nomeServer`, `emailServer`, `senhaServer`), which the sign-up and login pages already send.
- **Ids in the URL** must be positive whole numbers, or the reply is `400`.

| Status | Meaning |
| --- | --- |
| `200` | Done, with the result in the body |
| `201` | Created, with the new id in the body |
| `204` | Done, nothing to return (a list with no items) |
| `400` | The request is invalid: missing or wrong field, invalid id |
| `403` | Wrong e-mail or password |
| `404` | The resource does not exist, or belongs to another user |
| `409` | Conflict with existing data: e-mail already registered |
| `500` | Unexpected server or database error |

## 2. Users — `/usuarios`

### `POST /usuarios/cadastrar` — create an account and its profile (RF01, RF02, RF17)

Used by `public/auth/signup.js`. It creates the user and their player profile (`perfil`) in one transaction: if either fails, neither is saved, so every account made here has a profile.

Body (every field is required except `abertura_favorita`):

```json
{
  "nomeServer": "Igor",
  "emailServer": "igor@exemplo.com",
  "senhaServer": "Senhaforte1!",
  "rating": 1650,
  "ano_inicio": 2014,
  "bio": "Aprendi na escola e nunca mais parei.",
  "abertura_favorita": "Siciliana: Dragão Acelerado"
}
```

| Field | Rule |
| --- | --- |
| `nomeServer` | Required, up to 80 characters |
| `emailServer` | Required, a valid e-mail, up to 120 characters. Unique, ignoring upper and lower case (RN01) |
| `senhaServer` | Required, 8 to 100 characters, with an uppercase letter (`A-Z`), a lowercase letter (`a-z`), a digit and a special character (anything other than `A-Z`, `a-z` and `0-9`) (RN02). Stored as plain text |
| `rating`, `ano_inicio`, `bio`, `abertura_favorita` | The profile fields, with the rules of `PUT /perfis/atualizar/:idUsuario`: the favorite opening is optional, the others are required |

| Reply | Body |
| --- | --- |
| `201` | `{ "id": 1 }` |
| `400` | `Preencha o nome, o e-mail e a senha.`, `O nome pode ter no máximo 80 caracteres.`, `Informe um e-mail válido.`, `A senha pode ter no máximo 100 caracteres.`, or one of the password strength errors: `A senha precisa ter no mínimo 8 caracteres.`, `A senha precisa ter pelo menos uma letra maiúscula.`, `A senha precisa ter pelo menos uma letra minúscula.`, `A senha precisa ter pelo menos um número.`, `A senha precisa ter pelo menos um caractere especial.`, or one of the profile errors: `Preencha o rating, o ano de início e a bio.`, `Rating inválido.`, `Ano de início inválido.`, `A bio pode ter no máximo 50 caracteres.`, `Abertura inválida.` (when it is not text or is longer than 50 characters) |
| `409` | `Este e-mail já está cadastrado.` |
| `500` | `Não foi possível criar a conta.` |

### `POST /usuarios/autenticar` — log in (RF03)

Used by `public/auth/login.js`, which saves the reply in the user's session in the browser with `startSession` (see "Authentication" in section 3 of [`02-web-data-viz.md`](02-web-data-viz.md)). The other routes then take the user id from that session.

Body:

```json
{ "emailServer": "igor@exemplo.com", "senhaServer": "Senhaforte1!" }
```

| Reply | Body |
| --- | --- |
| `200` | `{ "id": 1, "nome": "Igor", "email": "igor@exemplo.com" }`. The password is never returned |
| `400` | `Informe o e-mail e a senha.` The password strength is not checked at login, so users whose password was saved before RN02 can still log in |
| `403` | `E-mail e/ou senha inválidos.` The same reply for an unknown e-mail and a wrong password, so it does not reveal which accounts exist |
| `500` | `Não foi possível entrar.` |

## 3. Lists — `/listasExercicios`

### `GET /listasExercicios/listar/:idUsuario` — list the exercise lists with the user's progress (RF08, RF09)

Used by `public/play/play.js` on the start screen. The dashboard reads the lists from `GET /dashboard/listasExercicios/:idUsuario` (section 7), which counts only a period.

| Reply | Body |
| --- | --- |
| `200` | The lists, in their order |
| `204` | No body: there are no lists (the seed was not loaded) |
| `400` | `Usuário inválido.` |
| `500` | `Não foi possível listar as listas de exercícios.` |

```json
[
  { "id": 1, "nome": "Mate em 1", "descricao": "Um lance para dar xeque-mate.", "total_exercicios": 5, "resolvidos": 2 }
]
```

- `resolvidos` counts the list's exercises the user has solved at least once in this list.

## 4. Exercises — `/exercicios`

### `GET /exercicios/listar/:idLista/:idUsuario` — list the exercises of a list (RF08)

Used by `public/play/play.js` to show a list's exercises and by `public/play/game.js` to find the next exercise.

| Reply | Body |
| --- | --- |
| `200` | The list's exercises, in their order |
| `204` | No body: the list has no exercises, or does not exist |
| `400` | `Lista inválida.` or `Usuário inválido.` |
| `500` | `Não foi possível listar os exercícios.` |

```json
[
  { "id": 6, "titulo": "Mate de Légal", "ordem": 1, "resolvido": true }
]
```

- `resolvido` is `true` when the user has solved the exercise at least once in this list.

### `GET /exercicios/buscar/:idExercicio` — read an exercise to solve (RF08)

Used by `public/play/game.js` to set up the board.

| Reply | Body |
| --- | --- |
| `200` | The exercise |
| `400` | `Exercício inválido.` |
| `404` | `Exercício não encontrado.` |
| `500` | `Não foi possível buscar o exercício.` |

```json
{
  "id": 6,
  "titulo": "Mate de Légal",
  "posicao": "Ke1 Ra1 Rh1 Bc1 Bc4 Nc3 Ne5 Pa2 Pb2 Pc2 Pd2 Pf2 Pg2 Ph2 Pe4 ke8 qd8 ra8 rh8 bd1 bf8 nb8 ng8 pd6 pg6 pa7 pb7 pc7 pf7 ph7",
  "solucao": ["Bxf7+", "Ke7", "Nd5#"]
}
```

- `posicao` is the position: each piece with its square, separated by spaces (uppercase is White, lowercase is Black, `P`/`p` is a pawn). White is always to move: the user plays White.
- `solucao` is the whole line in SAN: the user's moves at even indexes (0, 2, …) and the opponent's replies at odd indexes. The page compares each move with it and plays the replies itself. Sending the solution keeps the page simple; the API checks it again when the attempt is saved.

## 5. Attempts — `/tentativas`

### `POST /tentativas/cadastrar/:idUsuario` — save an attempt (RF08, RF10)

Used by `public/play/game.js` when an attempt ends: after the last solution move, or right after a wrong move.

Body:

```json
{ "fk_lista": 2, "fk_exercicio": 6, "lances": ["Bxf7+", "Ke7", "Nd5#"] }
```

| Field | Rule |
| --- | --- |
| `fk_lista` | The list the exercise was opened from: a positive whole number |
| `fk_exercicio` | The exercise: a positive whole number, in that list |
| `lances` | Every move of the attempt, the opponent's replies included, up to the last one played. At least one, each in standard algebraic notation (SAN), such as `Nf3`, `exd5`, `O-O`, `e8=Q+`. The server checks the format, not the legality: the page only allows the moves each piece can make |

The server reads the exercise's solution and saves `acertou = true` only when `lances` is exactly the whole solution (RN04). The client sends no date: the database sets `data_tentativa` (RN05).

| Reply | Body |
| --- | --- |
| `201` | `{ "id": 1, "acertou": true }` |
| `400` | `Usuário inválido.`, `Lista inválida.`, `Exercício inválido.`, `Informe os lances da tentativa.` or `Lance inválido: <lance>` |
| `404` | `Exercício não encontrado.` (no solution for the exercise) or `Usuário, lista ou exercício não encontrado.` (the user does not exist, or the exercise is not in the list) |
| `500` | `Não foi possível registrar a tentativa.` |

### `GET /tentativas/listar/:idUsuario` — list a user's attempts (RF09, RF10)

Lists every attempt, with no period. No page uses it since 2026-11-10, when the dashboard moved to `GET /dashboard/tentativas/:idUsuario` (section 7); it is kept so the contract does not break.

| Reply | Body |
| --- | --- |
| `200` | The attempts, newest first |
| `204` | No body: the user has no attempts |
| `400` | `Usuário inválido.` |
| `500` | `Não foi possível listar as tentativas.` |

```json
[
  { "id": 1, "acertou": true, "data_tentativa": "2026-11-09T19:15:25.000Z", "lista": "Mate em 2", "exercicio": "Mate de Légal" }
]
```

- `data_tentativa` is an ISO date in UTC. The dashboard shows it, and groups attempts by day, in the user's time zone.

## 6. Profiles — `/perfis`

A user has zero or one profile (`perfil` table, 1:1 with `usuario`). Rating, starting year and bio are required when the profile is created or updated; the favorite opening is optional. The profile is created with the account, by `POST /usuarios/cadastrar`; these routes read and update it, used by `public/play/profile.js` on the start screen of the exercises (`play/play.html`).

### `GET /perfis/buscar/:idUsuario` — read a user's profile (RF17)

| Reply | Body |
| --- | --- |
| `200` | The profile |
| `204` | No body: the user has no profile. The sign-up always creates one, so only a row removed or added by hand in the database leads here |
| `400` | `Usuário inválido.` |
| `500` | `Não foi possível buscar o perfil.` |

```json
{
  "rating": 1650,
  "ano_inicio": 2014,
  "bio": "Aprendi na escola e nunca mais parei.",
  "abertura_favorita": "Siciliana: Dragão Acelerado"
}
```

- `abertura_favorita` is the name of the favorite opening, as saved, `null` when there is none. The page offers the openings mocked in the front-end (`public/shared/profile-form.js`).

### `PUT /perfis/atualizar/:idUsuario` — update a profile (RF17)

Replaces every field. Rating, starting year and bio are required, so they can never be emptied; the favorite opening sent as `null` (or left out) is cleared.

Body:

```json
{ "rating": 1650, "ano_inicio": 2014, "bio": "Aprendi na escola e nunca mais parei.", "abertura_favorita": "Siciliana: Dragão Acelerado" }
```

| Field | Rule |
| --- | --- |
| `rating` | Required. A whole number from 0 to 3500 |
| `ano_inicio` | Required. A whole number from 1901 (the first year MySQL's `YEAR` accepts) to the current year |
| `bio` | Required, not blank. Up to 50 characters, a limit of the API (the column holds 280); spaces at the ends are removed |
| `abertura_favorita` | Optional (`null` or empty, for a user with no favorite opening). The opening's name, as text of up to 50 characters; the page sends one of the openings mocked in the front-end |

| Reply | Body |
| --- | --- |
| `204` | No body: the profile was updated |
| `400` | `Usuário inválido.`, `Preencha o rating, o ano de início e a bio.`, `Rating inválido.`, `Ano de início inválido.`, `A bio pode ter no máximo 50 caracteres.` or `Abertura inválida.` (when it is not text or is longer than 50 characters) |
| `404` | `Perfil não encontrado.`: the user has no profile to update |
| `500` | `Não foi possível atualizar o perfil.` |

## 7. Dashboard — `/dashboard`

The data of the "Desempenho no Xadrez" page, always limited to a period. Used only by `public/dashboard/dashboard.js`, which sends the period chosen on the page: the current week (the default), the previous week, or a custom interval. The routes have their own controller and model (`dashboardController`, `dashboardModel`), apart from the lists and attempts ones.

Both routes require the period in the query string, `?data_inicio=2026-11-09&data_fim=2026-11-15`:

| Parameter | Rule |
| --- | --- |
| `data_inicio` | Required. The first day of the period, a real day written `YYYY-MM-DD` |
| `data_fim` | Required. The last day, written the same way, not before `data_inicio` |

Both days are included: an attempt counts when its `data_tentativa` is from the start of `data_inicio` to the end of `data_fim`, compared in the database's time. A wrong period is a `400`: `Informe a data de início e a data de fim.` (one or both missing), `Data inválida.` (not a real `YYYY-MM-DD` day, such as `2026-02-30`) or `A data de início não pode ser depois da data de fim.`

### `GET /dashboard/tentativas/:idUsuario` — list the user's attempts in a period (RF09, RF10)

| Reply | Body |
| --- | --- |
| `200` | The attempts of the period, newest first |
| `204` | No body: the user has no attempts in the period |
| `400` | `Usuário inválido.` or a period error |
| `500` | `Não foi possível listar as tentativas.` |

The body is the same as in `GET /tentativas/listar/:idUsuario` (section 5):

```json
[
  { "id": 1, "acertou": true, "data_tentativa": "2026-11-09T19:15:25.000Z", "lista": "Mate em 2", "exercicio": "Mate de Légal" }
]
```

### `GET /dashboard/listasExercicios/:idUsuario` — list the exercise lists with what the user solved in a period (RF09)

| Reply | Body |
| --- | --- |
| `200` | The lists, in their order |
| `204` | No body: there are no lists (the seed was not loaded) |
| `400` | `Usuário inválido.` or a period error |
| `500` | `Não foi possível listar as listas de exercícios.` |

The body is the same as in `GET /listasExercicios/listar/:idUsuario` (section 3):

```json
[
  { "id": 1, "nome": "Mate em 1", "descricao": "Um lance para dar xeque-mate.", "total_exercicios": 5, "resolvidos": 2 }
]
```

- `resolvidos` counts the list's exercises the user solved at least once in this list during the period. `total_exercicios` does not depend on the period.

## 8. Security

- Passwords are stored as plain text in `usuario.senha`, without hashing, by the author's choice. Anyone who can read the table sees every password.
- The API connects to MySQL as `chess_life_user`, which may only run this document's statements (see "Application user" in section 7 of [`03-database.md`](03-database.md)). A route that needs another statement also needs its `GRANT`.
- Every query uses `?` placeholders, so request values are never read as SQL.
- Error replies and logs never include passwords or SQL.
- **Authentication**: done by the user's session in the browser (`sessionStorage`), described with examples in "Authentication" in section 3 of [`02-web-data-viz.md`](02-web-data-viz.md). The API checks the e-mail and password only at `POST /usuarios/autenticar`; it sends no token or cookie, and the page keeps the reply.
- **Known limit**: the routes do not check who is calling. The list, exercise, attempt, profile and dashboard routes trust the user id in the URL, which the page takes from the session, so anyone who sends another id to the API can read that user's progress, attempts and profile, or save attempts and change the profile in their name. The exercise route also sends the solution, so a user can read it before solving. This is accepted for the academic project.

## 9. Removed routes

The legacy template's routes were deleted on 2026-10-15, since no page used them: `/avisos/*`, `/medidas/*`, `/aquarios/*`, `/empresas/*` and the `/` route of `routes/index.js`. The home page is served by `express.static` from `public/index.html`.

`POST /perfis/cadastrar/:idUsuario` was removed on 2026-11-02, the day it was created: the profile is now created by `POST /usuarios/cadastrar`, together with the account.

`GET /partidas/listar/:idUsuario` and `POST /partidas/cadastrar/:idUsuario` were removed on 2026-11-09, with the `partida` and `lance` tables and the opening identification: the site no longer saves games between two people. The lists, exercises and attempts routes (sections 3 to 5) took their place.

`GET /aberturas/listar` was removed on 2026-11-09, with the `abertura` table: the openings are mocked in the front-end, and the profile keeps the chosen name as text.
