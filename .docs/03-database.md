# Chess Life — Database model

The logical data model of Chess Life. The database is modeled and implemented in **MySQL** (version 8.0 or later), hosted on the project's Linux VM (assumptions P02 and R03 in [`01-project.md`](01-project.md)). This is the preliminary model: it guides the adaptation of the legacy tables, and it changes here first whenever the data model changes.

## 1. Scope

The database stores only what the application reads and writes through the API:

- **Users**: sign-up and login (RF01–RF05).
- **Profiles**: optional chess details of each user (rating, year they started, bio, favorite opening).
- **Games played on the site**: result, opponent, color and opening, feeding the dashboard (RF08–RF10, RF16).
- **Moves**: every move of each game, in order.
- **Openings**: the list of known openings the API uses to identify the opening of each game.

Out of the database:

- **Gallery photos**: the image files and captions stay in `public/gallery/` and in the gallery's HTML. The page is visual only (P06), so the photos need no table.
- **Sessions**: the authentication mechanism is still an open decision. JWT needs no table; a server session stored in MySQL would add one, to be modeled here if it is chosen.

## 2. Entities and relationships

| Entity | Table | Kind | Description |
| --- | --- | --- | --- |
| User | `usuario` | Strong | A person with an account, who plays games on the site |
| Profile | `perfil` | Weak (depends on `usuario`) | Optional chess details of one user |
| Opening | `abertura` | Strong | A known chess opening, defined by its first moves |
| Game | `partida` | Strong | A game a user finished on the site |
| Move | `lance` | Weak (depends on `partida`) | One move of a game, at a given position |

### Relationship kinds

The model follows the MySQL Workbench convention:

- **Identifying relationship (strong)**: the parent's key is part of the child's primary key. The child is a weak entity: it has no identity of its own and cannot exist without the parent.
- **Non-identifying relationship (weak)**: the foreign key is an ordinary column. The child has its own `id`, so its identity does not depend on the parent.

| Relationship | Cardinality | Kind | Foreign key | Why |
| --- | --- | --- | --- | --- |
| `usuario` → `perfil` | 1:1 (one user has zero or one profile) | Identifying | `perfil.fk_usuario`, which is also the PK | Using the FK as the PK is what limits each user to one profile |
| `partida` → `lance` | 1:N (one game has one or many moves) | Identifying | `lance.fk_partida`, part of the PK `(fk_partida, numero)` | A move is only "move 12 of game 40": it has no meaning without its game |
| `usuario` → `partida` | 1:N (one user plays zero or many games) | Non-identifying | `partida.fk_usuario` | A game has its own `id`, used by the API to delete it |
| `abertura` → `partida` | 1:N (one opening appears in zero or many games) | Non-identifying | `partida.fk_abertura` | Each game has exactly one opening. A game that matches no known opening points to the "Abertura irregular" row |
| `abertura` → `perfil` | 1:N (one opening is the favorite of zero or many profiles) | Non-identifying, optional | `perfil.fk_abertura_favorita` | The favorite opening is optional, so the column accepts `NULL` |

In the diagram, a solid line is an identifying relationship and a dashed line is a non-identifying one.

```mermaid
erDiagram
    usuario ||--o| perfil : "tem"
    abertura |o..o{ perfil : "favorita de"
    usuario ||..o{ partida : "joga"
    abertura ||..o{ partida : "identificada em"
    partida ||--|{ lance : "composta por"

    usuario {
        INT id PK
        VARCHAR nome
        VARCHAR email UK
        CHAR senha_hash
        DATETIME data_cadastro
    }
    perfil {
        INT fk_usuario PK, FK
        INT rating
        YEAR ano_inicio
        VARCHAR bio
        INT fk_abertura_favorita FK
    }
    abertura {
        INT id PK
        VARCHAR nome
        VARCHAR lances UK
    }
    partida {
        INT id PK
        INT fk_usuario FK
        INT fk_abertura FK
        VARCHAR resultado
        VARCHAR adversario
        VARCHAR cor
        DATETIME data_partida
    }
    lance {
        INT fk_partida PK, FK
        INT numero PK
        VARCHAR san
    }
```

## 3. Data dictionary

### `usuario`

| Column | Type | Null | Key / default | Description |
| --- | --- | --- | --- | --- |
| `id` | `INT` | No | PK, `AUTO_INCREMENT` | User identifier |
| `nome` | `VARCHAR(80)` | No | | Name shown on the site |
| `email` | `VARCHAR(120)` | No | `UNIQUE` | Login e-mail; one account per e-mail (RN01) |
| `senha_hash` | `CHAR(60)` | No | | bcrypt hash of the password. bcrypt hashes are always 60 characters. The plain password is never stored (RN02 is checked before hashing) |
| `data_cadastro` | `DATETIME` | No | `CURRENT_TIMESTAMP` | When the account was created |

### `perfil`

| Column | Type | Null | Key / default | Description |
| --- | --- | --- | --- | --- |
| `fk_usuario` | `INT` | No | PK, FK → `usuario.id` | The profile's owner. As the PK, it allows at most one profile per user |
| `rating` | `INT` | Yes | | The user's chess rating, such as 1500 |
| `ano_inicio` | `YEAR` | Yes | | The year the user started playing chess |
| `bio` | `VARCHAR(280)` | Yes | | Short text about the user |
| `fk_abertura_favorita` | `INT` | Yes | FK → `abertura.id` | The opening the user names as their favorite |

- The profile is optional: a user may have no row in `perfil`.
- `fk_abertura_favorita` is what the user chooses. It is not the dashboard's "abertura favorita" indicator, which is computed from the games played.

### `abertura`

| Column | Type | Null | Key / default | Description |
| --- | --- | --- | --- | --- |
| `id` | `INT` | No | PK, `AUTO_INCREMENT` | Opening identifier |
| `nome` | `VARCHAR(60)` | No | | Opening name in Portuguese, such as "Defesa Siciliana" |
| `lances` | `VARCHAR(100)` | No | `UNIQUE` | The moves that define the opening, in SAN, separated by spaces, such as `e4 c5`. Empty for "Abertura irregular" |

- `nome` is not unique: one opening can be reached by more than one move order. "Sistema Londres", for example, has three rows (`d4 d5 Bf4`, `d4 Nf6 Bf4`, `d4 d5 Nf3 Nf6 Bf4`). The dashboard groups games by `nome`.
- A game's opening is the row whose `lances` is the longest sequence the game starts with. "Giuoco Piano" (`e4 e5 Nf3 Nc6 Bc4 Bc5`) wins over "Abertura Italiana" (`e4 e5 Nf3 Nc6 Bc4`).
- `lances` stays as text here, unlike a game's moves. It is a single value, the definition of the opening, compared by prefix, and not a list of separate facts.

### `partida`

| Column | Type | Null | Key / default | Description |
| --- | --- | --- | --- | --- |
| `id` | `INT` | No | PK, `AUTO_INCREMENT` | Game identifier |
| `fk_usuario` | `INT` | No | FK → `usuario.id` | Who played the game (RN03) |
| `fk_abertura` | `INT` | No | FK → `abertura.id` | Opening identified by the API from the game's moves |
| `resultado` | `VARCHAR(7)` | No | `CHECK` | `vitoria`, `derrota` or `empate`, from the user's side (RN04) |
| `adversario` | `VARCHAR(6)` | No | `CHECK` | `humano` or `ia` |
| `cor` | `VARCHAR(7)` | No | `CHECK` | `brancas` or `pretas`, the color the user played |
| `data_partida` | `DATETIME` | No | `CURRENT_TIMESTAMP` | When the game was saved. Set by the database, so it is never in the future (RN05) |

- Index `(fk_usuario, data_partida)`: the dashboard lists one user's games ordered by date.
- The moves are in `lance`, not in a column of `partida`, so each move is stored once (first normal form).

### `lance`

| Column | Type | Null | Key / default | Description |
| --- | --- | --- | --- | --- |
| `fk_partida` | `INT` | No | PK, FK → `partida.id`, `ON DELETE CASCADE` | The game the move belongs to |
| `numero` | `INT` | No | PK, `CHECK` | The move's position in the game, starting at 1. Each move of each side counts (a half-move): 1 is white's first move, 2 is black's reply |
| `san` | `VARCHAR(10)` | No | | The move in standard algebraic notation (SAN), such as `Nf3`, `exd5` or `O-O` |

- A game has at least one move. The database cannot require a child row, so the API rejects a game with no moves.
- `san` fits in 10 characters: the longest SAN moves, such as `Qh4xe1+` or `exd8=Q#`, have 7.

## 4. Business rules in the database

| Rule | How the model enforces it |
| --- | --- |
| RN01 — unique e-mail | `UNIQUE` on `usuario.email` |
| RN02 — password of at least 8 characters | Checked by the API before hashing; the table only stores `senha_hash` |
| RN03 — users only see and delete their own games | `partida.fk_usuario`; every query filters by it. Deleting a game deletes its moves (`ON DELETE CASCADE` on `lance`) |
| RN04 — result is win, loss or draw | `CHECK` on `partida.resultado` |
| RN05 — no future game date | `partida.data_partida` defaults to `CURRENT_TIMESTAMP` and the API never sends it |
| Every game has a user and an opening | `NOT NULL` foreign keys |
| A user has at most one profile | `perfil.fk_usuario` is the primary key |
| A position holds one move per game | Primary key `(fk_partida, numero)` on `lance` |
| Move positions start at 1 | `CHECK (numero >= 1)` on `lance` |

`CHECK` constraints are enforced from MySQL 8.0.16 onward. Older versions accept and ignore them, so the API validates the same values.

Delete behavior of the foreign keys:

- `lance.fk_partida` uses `ON DELETE CASCADE`: users delete games (RN03), and a move cannot exist without its game.
- Every other foreign key uses MySQL's default `RESTRICT`: a user with a profile or games, or an opening used by a game or a profile, cannot be deleted. The site has no account or opening deletion, so no other cascade is needed.

## 5. Naming conventions

- Table and column names are in Portuguese, lowercase, in `snake_case`, as in the original specification. Tables are singular (`partida`, not `partidas`).
- The primary key of a strong entity is `id`. A weak entity's primary key is made of its parent's foreign key, plus a column that tells its rows apart when the parent has many (`lance`: `fk_partida, numero`). In a 1:1 relationship, the foreign key alone is the primary key (`perfil.fk_usuario`).
- A foreign key is `fk_<table>`, such as `fk_usuario`. When the column has a role of its own, the role follows the table name, such as `fk_abertura_favorita`.
- Fixed value lists (`resultado`, `adversario`, `cor`) are `VARCHAR` with a `CHECK`, without accents, matching the values the API and the front-end already use.
- Tables use the `utf8mb4` character set, so names with accents ("Grünfeld", "Índia") are stored correctly.

## 6. What changes from the legacy model

The legacy template's tables (its `script-tabelas.sql`, now deleted) were built for the AquaTech sample project.

| Legacy table | In this model | Reason |
| --- | --- | --- |
| `usuario` | Kept, adapted | Drops `cpf` and `fk_empresa`; `senha` (plain text) becomes `senha_hash`; adds `data_cadastro` and a unique `email` |
| `empresa` | Removed | Chess Life users do not belong to companies |
| `aviso` | Removed | Notices are not part of Chess Life |
| `aquario` | Removed | AquaTech only |
| `medida` | Removed | AquaTech sensor readings only |
| — | `perfil`, new | Optional chess details of each user (1:1 with `usuario`) |
| — | `abertura`, new | Openings move from code to the database |
| `partida` (added on 2026-10-15) | Kept, adapted | The opening name in text (`abertura`) becomes a foreign key (`fk_abertura`), and the moves in text (`lances`) move to the `lance` table |
| — | `lance`, new | One row per move, replacing `partida.lances` |

What the back-end keeps from the legacy template: the `routes → controllers → models` structure and `src/database/config.js`, rewritten with a connection pool and `?` placeholders. The legacy `script-tabelas.sql` was deleted.

## 7. Physical model (MySQL scripts)

The physical model is implemented by two scripts in `site-pessoal/src/database/`. Run them in order:

| Script | What it does |
| --- | --- |
| `01-schema.sql` | Creates the `chess_life` database (`utf8mb4`) and the five tables, parents first, so every foreign key points to a table that already exists |
| `02-seed.sql` | Loads the 50 rows of `abertura`: "Abertura irregular" plus 49 known openings. This table is the API's opening list |

```
mysql -u <user> -p < site-pessoal/src/database/01-schema.sql
mysql -u <user> -p < site-pessoal/src/database/02-seed.sql
```

The same files can be opened and run in MySQL Workbench.

- **Running them again is safe**: `01-schema.sql` uses `CREATE ... IF NOT EXISTS`, and `02-seed.sql` uses `INSERT IGNORE`, which skips openings whose `lances` already exist. Neither script drops or changes existing data. A change to an existing table needs its own `ALTER TABLE`.
- **InnoDB** is set on every table, since foreign keys need it.
- **Constraint names**: `uq_<table>_<column>` for unique keys, `fk_<child>_<parent>` for foreign keys, `chk_<table>_<column>` for checks and `idx_<table>_<columns>` for indexes. MySQL ignores names given to primary keys and always calls them `PRIMARY`, so primary keys are not named.
- **Validated** on MySQL 8.0.46, in a temporary instance. Both scripts ran twice without errors and created every constraint. Each rule was rejected when broken: duplicate e-mail, second profile for a user, invalid `resultado`, unknown user, `numero` 0, duplicate move number, and deleting an opening in use. Deleting a game deleted its moves.
- The API uses these tables (section 8). The environment file must point to them with `DB_DATABASE=chess_life`.

Example query, the dashboard's game list:

```sql
SELECT p.id, p.resultado, p.adversario, p.cor, a.nome AS abertura, p.data_partida
FROM partida p
    JOIN abertura a ON a.id = p.fk_abertura
WHERE p.fk_usuario = ?
ORDER BY p.data_partida DESC;
```

Example query, the moves of one of the user's games in order. The join with `partida` keeps a user from reading another user's game (RN03):

```sql
SELECT l.numero, l.san
FROM lance l
    JOIN partida p ON p.id = l.fk_partida
WHERE l.fk_partida = ? AND p.fk_usuario = ?
ORDER BY l.numero;
```

The rows are joined into text in JavaScript, not with `GROUP_CONCAT`, because MySQL cuts `GROUP_CONCAT` results at 1024 bytes by default (`group_concat_max_len`), which a long game exceeds.

## 8. How the API uses the model

Built on 2026-10-15; the routes are in [`04-api.md`](04-api.md).

- **Connection**: `src/database/config.js` keeps one connection pool, with `query(sql, values)` for single statements and `transaction(runStatements)` for statements that must succeed or fail together.
- **`usuario`**: sign-up stores a bcrypt hash in `senha_hash`. A duplicate e-mail fails on `uq_usuario_email` (`ER_DUP_ENTRY`) and becomes a `409` reply. Login reads the user by e-mail and compares the hash.
- **`abertura`**: `aberturaModel.listOpenings` reads the rows, and `openingBook.identifyOpening` picks the longest `lances` the game starts with, or the row with empty `lances`. To recognize a new opening, insert a row: no code changes.
- **`partida` and `lance`**: `partidaModel.registerGame` inserts the game, then all its moves in one multi-row `INSERT`, numbered from 1, inside one transaction. A failure rolls both back, so no game is left without moves. A user id with no account fails on `fk_partida_usuario` (`ER_NO_REFERENCED_ROW_2`) and becomes a `404` reply.
- **Listing**: `listGames` joins `abertura` and returns its name as `abertura`. It does not read `lance`.
- **Deleting**: `deleteGame` filters by game and user (RN03). `ON DELETE CASCADE` removes the moves.
- **`perfil`**: no route uses it yet: no requirement in [`01-project.md`](01-project.md) asks for it so far.
