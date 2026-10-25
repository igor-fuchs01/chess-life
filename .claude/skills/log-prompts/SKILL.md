---
name: log-prompts
description: Logs in .docs/ every prompt the user sends and the decisions made while answering it. ALWAYS use it at the end of every task or answer in this repository - including questions, planning and tasks that change no code - and whenever a project decision is made or revised.
---

# Log prompts and decisions

Keeps a readable history of what was asked and what was decided in the project. Write the log at the end of each turn, once the requested work is done.

## Where to log

| File | Content |
| --- | --- |
| `.docs/prompts/YYYY-MM-DD.md` | One file per day, with all of that day's prompts in chronological order. |
| `.docs/decisions.md` | Running list of the project's lasting decisions. |

Create the day's file if it does not exist yet, with the title `# Prompts — YYYY-MM-DD`. Never rewrite or delete old entries: only append to the end.

Do not log prompts that only ask to commit (such as "commit as alterações"): they get no entry in the day's file. When a prompt asks to commit and also asks for other work, log only the other work.

## Prompt entry format

Append to the end of `.docs/prompts/YYYY-MM-DD.md`:

```markdown
## N. Short task title

**Prompt:**

> the prompt text, exactly as the user wrote it

**What was done:** one to three sentences with the outcome, naming the main files created or changed.

**Decisions:**

- Decision made — reason.
```

Rules:

- `N` is the sequential number of the entry within the day's file.
- Write the entry in English, but copy the prompt verbatim in the language it was written in, without fixing or summarizing it. If it is very long (a pasted file, a log), keep the request and replace the pasted part with `[...pasted content omitted: description...]`.
- If the user sends several messages about the same task, use a single entry and include each message as a separate quote, in order.
- Under **Decisions**, record the choices made by you and the ones made by the user, always with the reason. Include discarded alternatives when the choice is not obvious. If no decision was made, write `- None.`
- If something was left pending or failed, say so under **What was done**.

## Lasting decisions

When a decision holds beyond the current task (stack, architecture, convention, business rule, scope), also append a line to the end of `.docs/decisions.md`:

```markdown
- **YYYY-MM-DD** — Decision. Reason. ([prompt](prompts/YYYY-MM-DD.md), entry N)
```

If a new decision replaces an earlier one, do not delete the old one: append the new one and end the old one with `(superseded on YYYY-MM-DD)`.

## Cautions

- Never log secrets: passwords, tokens, API keys or personal data that appear in the prompt must be replaced with `[REDACTED]`.
- The log does not replace the answer to the user and does not need to be announced in detail; mentioning in one line that it was done is enough.
- The files in `.docs/` are versioned in git with the rest of the project and are committed by the `commit` skill when the user asks for a commit.
