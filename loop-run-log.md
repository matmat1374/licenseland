# Loop Run Log — YOUR_PROJECT

Append one entry per run. Prune entries older than 30 days.

## Format

```json
{
  "run_id": "2026-06-09T08:15:00Z",
  "pattern": "daily-triage",
  "duration_s": 45,
  "items_found": 4,
  "actions_taken": 1,
  "escalations": 0,
  "tokens_estimate": 52000,
  "outcome": "report-only | fix-proposed | escalated | no-op"
}
```

## Recent Runs

<!-- Loop appends below this line -->
{ "run_id":"2026-09-15T16:39:14.623Z", "iteration":1, "axes":["۱-۲۰"], "items_found":7, "fixes":0, "verifier":"pending", "evidence":["docs/loop/backlog-1.json","https://liceno.ir/"], "tokens_estimate":0, "outcome":"discovery-complete" }

{ "run_id":"2026-09-15T18:11:13.737Z", "iteration":1, "axes":["۳ تأمین","۱۹ کاتالوگ"], "items_found":1, "fixes":1, "verifier":"pass", "evidence":["tsc --noEmit -p tsconfig.json: 0 errors in supplier.ts","identity match inserted in the catalogue import path (candidateRows + dedup_key)"], "tokens_estimate":0, "outcome":"fix-applied" }
