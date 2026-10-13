# Project decisions

Running list of lasting decisions, in chronological order. Only append to the end; see the `log-prompts` skill for the format.

- **2026-10-13** — Every prompt and every decision is logged in `.docs/` by the `log-prompts` skill (named `registrar-prompts` at the time). Keeps a history of what was asked and why each choice was made. ([prompt](prompts/2026-10-13.md), entry 1)
- **2026-10-13** — Documentation and logs in `.docs/` are written in Portuguese. The user's working language. ([prompt](prompts/2026-10-13.md), entry 1) (superseded on 2026-10-13)
- **2026-10-13** — Logging is enforced by hooks in `.claude/settings.json`: `UserPromptSubmit` records the prompt and `Stop` keeps the turn from ending with a pending entry. The instruction in `CLAUDE.md` alone could be forgotten. (log entry since removed) (superseded on 2026-10-13)
- **2026-10-13** — Commits follow Conventional Commits, with the description in Portuguese. Requested by the user; the language was chosen for consistency with the documentation. (log entry since removed) (superseded on 2026-10-13)
- **2026-10-13** — The project languages are HTML, CSS and JavaScript. Defined by the user; frameworks, libraries and build are not decided yet. ([prompt](prompts/2026-10-13.md), entry 2)
- **2026-10-13** — Logging relies only on the `log-prompts` skill and the instruction in `CLAUDE.md`, with no hooks. The hook script and `.claude/settings.json` were removed from the repository. ([prompt](prompts/2026-10-13.md), entry 3)
- **2026-10-13** — All documentation is written in English, including `.docs/`; prompt quotes stay verbatim in the language they were written in. Requested by the user. ([prompt](prompts/2026-10-13.md), entry 3)
- **2026-10-13** — Commit messages start with a type (`feat`, `fix`, `chore`, `docs`, `refactor`…) and never carry a scope in parentheses; commits are small, never mix unrelated changes, carry no Co-Authored-By line and are not pushed without prior authorization. Rules given by the user; see the `commit` skill. ([prompt](prompts/2026-10-13.md), entry 3)
