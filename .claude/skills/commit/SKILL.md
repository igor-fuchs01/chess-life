---
name: commit
description: Commits finished work following this project's commit conventions - a type prefix such as "feat:" with no scope in parentheses, small single-purpose commits, no Co-Authored-By line and no push. Use after finishing any task that changed files in this repository, and whenever the user asks to commit.
---

# Commit

After finishing any task, commit the work following the rules below.

## Rules

- Every commit message starts with `feat: ` or another type (`fix`, `chore`, `docs`, `refactor`…), with no scope in parentheses, whatever the kind of change.
  Example: `feat: stop sending answers left blank`
- Always prefer small commits: split each group of changes into the smallest meaningful units (one component, one fix, one config change, one doc topic), and make sure every commit builds and passes lint on its own.
- Never mix unrelated changes (for example a new feature and a bug fix) in the same commit.
- Never add `Co-Authored-By` lines to commit messages.
- Never push without prior authorization.

## Message format

```
<type>: <description>
```

| Type | Use for |
| --- | --- |
| `feat` | A new feature or behavior |
| `fix` | A bug fix |
| `docs` | Documentation only, including `.docs/` |
| `style` | Formatting with no change in behavior |
| `refactor` | Restructuring with no change in behavior |
| `perf` | A performance improvement |
| `test` | Adding or fixing tests |
| `build` | Build tooling or dependencies |
| `ci` | CI/CD configuration |
| `chore` | Maintenance that fits no other type |
| `revert` | Reverting an earlier commit |

- Write `feat: add castling validation`, never `feat(board): add castling validation`.
- Write the description in English, in the imperative, lowercase, with no trailing period.
- Add a body, separated by a blank line, only when the reason for the change is not obvious from the description.

## Steps

1. Run the `log-prompts` skill first, so the log entries for the task are part of the commits.
2. Run `git status` and `git diff` to see everything that changed, including untracked files.
3. Group the changes into the smallest meaningful units and order them so that each commit works on its own.
4. For each unit, stage only its files by path (`git add <path>`, or `git add -p` when one file holds unrelated changes) and commit. Do not use `git add -A` or `git add .`.
5. When the project has build, lint or test commands, run them before each commit. If one fails, fix the problem instead of committing.
6. Finish with `git log --oneline` and report the commits made. Leave them local.

Do not commit files that look like secrets (`.env`, keys, tokens); point them out to the user instead.
