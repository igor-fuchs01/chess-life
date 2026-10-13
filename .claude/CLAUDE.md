# chess-life

## Project Context
Early-stage project: there is no code and there are no build commands yet. Update this file as those choices are made.

## Languages

The project is written in HTML, CSS and JavaScript. Do not introduce another language unless that has been decided first.

## Prompt and decision log

Every prompt and every decision is logged in `.docs/`. This also applies to questions, planning and tasks that change no code.

- At the end of every task or answer, use the `log-prompts` skill to record the prompt, what was done and the decisions made.

Files:

- `.docs/prompts/YYYY-MM-DD.md` — the day's prompts, with what was done and the decisions for each one.
- `.docs/decisions.md` — the project's lasting decisions (stack, architecture, conventions, scope).

## Commits

After finishing any task that changed files, use the `commit` skill. Commit messages start with a type and no scope in parentheses (`feat: add castling validation`).

## Language convention

- Code, identifiers, comments, commit messages, documentation (including `.docs/`): **English**.
- UI copy (labels, buttons, messages shown to the student) and mock/fixture
  *content* (subject names, plan items, student names, etc.): **Portuguese**,
  since the product is for Portuguese-speaking.

---

# Rules

* Follow existing project patterns before introducing new ones.
* Reuse existing services, components, utilities and abstractions whenever possible.
* Prefer modifying existing code over creating new files.
* Keep changes as small as possible.
* Document modifications according the docs, if needed.
* Do not refactor unrelated code.
* Do not introduce new dependencies without clear justification.
* Do not create abstractions for a single use case.
* Do not leave TODO comments.
* Do not leave commented code.

---

# File Creation Policy

Before creating a new file:

1. Search for an existing implementation.
2. Search for a similar component.
3. Verify that extending existing code is not possible.

Create new files only when there is no reasonable alternative.

---

# API Rules

* Never break existing public contracts.
* Maintain backward compatibility.
* Reuse existing DTO patterns.
* Follow existing validation conventions.

---

# Testing Rules

When modifying code:

* Update existing tests if necessary.
* Add tests for new behavior.
* Ensure all tests pass before considering the task complete.

---

# Documentation Rules

* Do not create documentation files outside /docs.
* Never forget to update the documentation, when necessary.
* If no relevant documentation exists, create it.
* Keep documentation synchronized with the current implementation.
* Documentation is considered part of the deliverable.

---

# Code Review Checklist

Before finishing any task verify:

* Project builds successfully.
* Tests pass.
* Lint passes.
* No unused imports.
* No dead code.
* No commented code.
* No debugging statements.
* No duplicated logic introduced.
* Folders are separated by feature.

---

# Forbidden Actions

* Never rewrite large sections of code without request.
* Never rename files solely for preference.
* Never change architecture without request.
* Never introduce new frameworks.
* Never modify environment configuration without request.
* Never modify CI/CD pipelines without request.
