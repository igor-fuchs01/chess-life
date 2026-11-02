# Chess Life — API contracts

The REST API of Chess Life, served by `site-pessoal/app.js` together with the site, on the same address. This document is the contract between the front-end and the back-end: a route changes here first, and every change keeps the front-end working.

The code follows `routes/<resource>.js` → `controllers/<resource>Controller.js` → `models/<resource>Model.js` (see section 4 of [`02-site-pessoal.md`](02-site-pessoal.md)). The tables are described in [`03-database.md`](03-database.md).

## 1. Conventions

- **Request bodies** are JSON, sent with `Content-Type: application/json`.
- **Successful replies** carry JSON, or no body (`204`).
- **Error replies** carry a short plain-text message in Portuguese, written to be shown to the user as is, such as `E-mail e/ou senha inválidos.`. They never carry SQL errors or stack traces; the server logs the cause instead.
- **Field names** are in Portuguese and follow the database (`resultado`, `abertura`). The user fields keep the names of the legacy template (`nomeServer`, `emailServer`, `senhaServer`), which the sign-up and login pages already send.
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

Body (every field is required, the profile ones too):

```json
{
  "nomeServer": "Igor",
  "emailServer": "igor@exemplo.com",
  "senhaServer": "Senhaforte1!",
  "rating": 1650,
  "ano_inicio": 2014,
  "bio": "Aprendi na escola e nunca mais parei.",
  "fk_abertura_favorita": 27
}
```

| Field | Rule |
| --- | --- |
| `nomeServer` | Required, up to 80 characters |
| `emailServer` | Required, a valid e-mail, up to 120 characters. Unique, ignoring upper and lower case (RN01) |
| `senhaServer` | Required, 8 to 100 characters, with an uppercase letter (`A-Z`), a lowercase letter (`a-z`), a digit and a special character (anything other than `A-Z`, `a-z` and `0-9`) (RN02). Stored as plain text |
| `rating`, `ano_inicio`, `bio`, `fk_abertura_favorita` | Required: the profile fields, with the rules of `PUT /perfis/atualizar/:idUsuario` |

| Reply | Body |
| --- | --- |
| `201` | `{ "id": 1 }` |
| `400` | `Preencha o nome, o e-mail e a senha.`, `O nome pode ter no máximo 80 caracteres.`, `Informe um e-mail válido.`, `A senha pode ter no máximo 100 caracteres.`, or one of the password strength errors: `A senha precisa ter no mínimo 8 caracteres.`, `A senha precisa ter pelo menos uma letra maiúscula.`, `A senha precisa ter pelo menos uma letra minúscula.`, `A senha precisa ter pelo menos um número.`, `A senha precisa ter pelo menos um caractere especial.`, or one of the profile errors: `Preencha o rating, o ano de início, a abertura favorita e a bio.`, `Rating inválido.`, `Ano de início inválido.`, `A bio pode ter no máximo 50 caracteres.`, `Abertura inválida.` (also when the id is not in `abertura`) |
| `409` | `Este e-mail já está cadastrado.` |
| `500` | `Não foi possível criar a conta.` |

### `POST /usuarios/autenticar` — log in (RF03)

Used by `public/auth/login.js`, which saves the reply in the user's session in the browser with `startSession` (see "Authentication" in section 3 of [`02-site-pessoal.md`](02-site-pessoal.md)). The game routes then take the user id from that session.

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

## 3. Games — `/partidas`

### `GET /partidas/listar/:idUsuario` — list a user's games (RF09, RF10)

Used by `public/dashboard/dashboard.js`.

| Reply | Body |
| --- | --- |
| `200` | The games, newest first |
| `204` | No body: the user has no games |
| `400` | `Usuário inválido.` |
| `500` | `Não foi possível listar as partidas.` |

```json
[
  {
    "id": 1,
    "resultado": "vitoria",
    "adversario": "humano",
    "cor": "brancas",
    "abertura": "Siciliana: Dragão Acelerado",
    "data_partida": "2026-10-15T19:15:25.000Z"
  }
]
```

- `abertura` is the opening's name, from the `abertura` table.
- `data_partida` is an ISO date in UTC. The dashboard shows it, and groups games by day, in the user's time zone.
- The moves are not listed: no page uses them yet.

### `POST /partidas/cadastrar/:idUsuario` — save a finished game (RF08, RF16)

Used by `public/play/play.js` when a game ends.

Body:

```json
{
  "resultado": "vitoria",
  "adversario": "humano",
  "cor": "brancas",
  "lances": ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "g6"]
}
```

| Field | Rule |
| --- | --- |
| `resultado` | `vitoria`, `derrota` or `empate`, from the user's side (RN04) |
| `adversario` | `humano` or `ia` |
| `cor` | `brancas` or `pretas`, the color the user played |
| `lances` | At least one move, each in standard algebraic notation (SAN), such as `Nf3`, `exd5`, `O-O`, `e8=Q+`. The server checks the format, not the legality: the game page only allows legal moves (RF14) |

The client sends no date: the database sets `data_partida` when the game is saved (RN05).

The server identifies the opening from the moves: among the rows of the `abertura` table, it picks the longest sequence the game starts with, such as "Giuoco Piano" over "Abertura Italiana". A game that matches none gets "Abertura irregular". The game and its numbered moves (`lance` table) are saved in one transaction.

| Reply | Body |
| --- | --- |
| `201` | `{ "id": 1, "abertura": "Siciliana: Dragão Acelerado" }` |
| `400` | `Usuário inválido.`, `Resultado inválido.`, `Adversário inválido.`, `Cor inválida.`, `Informe os lances da partida.` or `Lance inválido: <lance>` |
| `404` | `Usuário não encontrado.` |
| `500` | `Não foi possível registrar a partida.` |

## 4. Profiles — `/perfis`

A user has zero or one profile (`perfil` table, 1:1 with `usuario`). Every field is required when the profile is created or updated. The profile is created with the account, by `POST /usuarios/cadastrar`; these routes read and update it, used by `public/play/profile.js` on the start screen of the game (`play/play.html`).

### `GET /perfis/buscar/:idUsuario` — read a user's profile (RF17)

| Reply | Body |
| --- | --- |
| `200` | The profile |
| `204` | No body: the user has no profile (an account created before 2026-11-02; the `perfil` table in [`03-database.md`](03-database.md) shows how to give those accounts a profile) |
| `400` | `Usuário inválido.` |
| `500` | `Não foi possível buscar o perfil.` |

```json
{
  "rating": 1650,
  "ano_inicio": 2014,
  "bio": "Aprendi na escola e nunca mais parei.",
  "fk_abertura_favorita": 27,
  "abertura_favorita": "Siciliana: Dragão Acelerado"
}
```

- An empty profile, given by SQL to an account created before 2026-11-02, has every field `null`.
- `abertura_favorita` is the name of the favorite opening, from the `abertura` table.

### `PUT /perfis/atualizar/:idUsuario` — update a profile (RF17)

Replaces every field. Every field is required, so a profile can never be emptied.

Body:

```json
{ "rating": 1650, "ano_inicio": 2014, "bio": "Aprendi na escola e nunca mais parei.", "fk_abertura_favorita": 27 }
```

| Field | Rule |
| --- | --- |
| `rating` | Required. A whole number from 0 to 3500 |
| `ano_inicio` | Required. A whole number from 1901 (the first year MySQL's `YEAR` accepts) to the current year |
| `bio` | Required, not blank. Up to 50 characters, a limit of the API (the column holds 280); spaces at the ends are removed |
| `fk_abertura_favorita` | Required. The id of a row of the `abertura` table, from `GET /aberturas/listar` |

| Reply | Body |
| --- | --- |
| `204` | No body: the profile was updated |
| `400` | `Usuário inválido.`, `Preencha o rating, o ano de início, a abertura favorita e a bio.`, `Rating inválido.`, `Ano de início inválido.`, `A bio pode ter no máximo 50 caracteres.` or `Abertura inválida.` (also when the id is not in `abertura`) |
| `404` | `Perfil não encontrado.`: the user has no profile to update |
| `500` | `Não foi possível atualizar o perfil.` |

## 5. Openings — `/aberturas`

### `GET /aberturas/listar` — list the known openings

Used by `public/shared/profile-form.js` to fill the favorite opening options, on the sign-up page and in the profile dialog.

| Reply | Body |
| --- | --- |
| `200` | The openings, in alphabetical order: `[{ "id": 9, "nome": "Abertura Italiana" }]` |
| `500` | `Não foi possível listar as aberturas.` |

## 6. Security

- Passwords are stored as plain text in `usuario.senha`, without hashing, by the author's choice. Anyone who can read the table sees every password.
- The API connects to MySQL as `chess_life_user`, which may only run this document's statements (see "Application user" in section 7 of [`03-database.md`](03-database.md)). A route that needs another statement also needs its `GRANT`.
- Every query uses `?` placeholders, so request values are never read as SQL.
- Error replies and logs never include passwords or SQL.
- **Authentication**: done by the user's session in the browser (`sessionStorage`), described with examples in "Authentication" in section 3 of [`02-site-pessoal.md`](02-site-pessoal.md). The API checks the e-mail and password only at `POST /usuarios/autenticar`; it sends no token or cookie, and the page keeps the reply.
- **Known limit**: the routes do not check who is calling. The game and profile routes trust the user id in the URL, which the page takes from the session, so anyone who sends another id to the API can read that user's games and profile, or save games and change the profile in their name. This is accepted for the academic project.

## 7. Removed routes

The legacy template's routes were deleted on 2026-10-15, since no page used them: `/avisos/*`, `/medidas/*`, `/aquarios/*`, `/empresas/*` and the `/` route of `routes/index.js`. The home page is served by `express.static` from `public/index.html`.

`POST /perfis/cadastrar/:idUsuario` was removed on 2026-11-02, the day it was created: the profile is now created by `POST /usuarios/cadastrar`, together with the account.
