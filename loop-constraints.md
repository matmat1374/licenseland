# Loop Constraints

> Add rules below with `/constraints <rule>` in your agent.
> The `loop-constraints` skill reads this file at the start of every run.
> Constraints here are **binding** — the agent MUST follow them.

## Push & Merge
- Don't push before telling me
- Never auto-merge to main without human approval
- Always create a draft PR first; let me review before marking ready

## Paths
- Never edit .env, .env.*, auth/, payments/, secrets/, credentials/
- Never edit infrastructure configs without human approval

## Code
- Always run tests before proposing a fix
- Never disable tests to make CI green
- Never refactor unrelated code — one fix per run
- Max 3 fix attempts per item; escalate after
- Enforce the attempt limit mechanically: log each try to `loop-ledger.json` and run `loop-context --check` before retrying (see the `loop-guard` skill)

## Communication
- Always tell me what you're about to do before doing it
- Never close an issue or PR without my approval

## Budget
- If token spend hits 80% of daily cap, switch to report-only
- If loop-pause-all is active, exit immediately

---
<!-- Add your own rules below. Use plain English. The loop reads this verbatim. -->

## HARD RULE - LOCAL ONLY (owner decision, 2026-09-16)
- NEVER run `git push`, `git remote add|set-url|remove`, `gh`, or anything that writes to a remote.
- NEVER run deploy scripts (`deploy*.js`, `deploy*.mjs`, deploy helpers), never ssh/scp/rsync to the production server, never rebuild or upload a deploy bundle.
- NEVER run `git config` against the remote or read/modify `.git/config`.
- Production deployment is the owner's action, always. The loop ends at a local commit + artifacts.
- If something cannot be verified without deploying, it stays a written proposal - do not find another route to production.
