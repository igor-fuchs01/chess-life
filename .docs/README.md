# Chess Life — Documentation

Development documentation for Chess Life, a personal chess website built for the *Pesquisa e Inovação* course at SPTech. Start here: this page lists every document, in the order they are meant to be read.

## Documents

| # | Document | What it covers | Read it before |
| --- | --- | --- | --- |
| 01 | [`01-project.md`](01-project.md) | Specification: overview, pages, assumptions and constraints, requirements, business rules, architecture, data model summary, dashboard, AI module, development plan and open decisions | Implementing any feature |
| 02 | [`02-site-pessoal.md`](02-site-pessoal.md) | The application in `site-pessoal/`: how to run it, folder structure, front-end conventions, legacy API, games API, planned adaptation and known issues | Changing the application's code |
| 03 | [`03-database.md`](03-database.md) | MySQL data model: entities, ER diagram, data dictionary, constraints, naming conventions, changes from the legacy model and DDL | Changing a table or a query |

## Logs

The logs record history, so they are not numbered: they grow over time instead of being read in order.

| File | Content |
| --- | --- |
| [`decisions.md`](decisions.md) | The project's lasting decisions, in chronological order, each with its reason |
| [`prompts/`](prompts/) | One file per day (`YYYY-MM-DD.md`) with every prompt sent to the assistant, what was done and the decisions made |

Both are written by the `log-prompts` skill (`.claude/skills/log-prompts/`) at the end of every task.

## Conventions

- All documentation is written in English. Prompt quotes in the logs stay in the language they were written in, and UI copy quoted from the site stays in Portuguese.
- Documentation lives only in `.docs/`. The repository's root `README.md` is the public presentation of the project and links here.
- Reference documents are numbered with two digits (`NN-name.md`) in reading order, and their main sections are numbered too (`## 1. Overview`). A new reference document takes the next free number and gets a row in the table above.
- Documents link to each other with relative links, such as [`03-database.md`](03-database.md). When a document is renamed, its links in `.claude/CLAUDE.md`, the root `README.md` and the other documents are updated with it. Old log entries are left as they were written.
- Documentation is part of the deliverable: it changes in the same task as the code it describes.
