# Changelog

Format: Keep a Changelog. Versioning: SemVer.

## [1.0.0] — 2026-08-19

### Added

- `feat(money)`: integer minor-unit money primitives, bps arithmetic and
  half-up `mulDivHalfUp`. Floats are rejected at the type and runtime level.
- `feat(pricing)`: dynamic markup engine with deterministic rule resolution
  (product override, then category rule, then global) and a chained pipeline
  (absolute margin floor, floor/cap, tax, rounding, scheduled campaign).
  Emits an auditable `QuoteStep[]` and typed warnings.
- `feat(pricing)`: `psychological`, `nearest`, `up` and `none` rounding modes
  with a margin-preserving correction when rounding down would break the floor.
- `feat(pricing)`: immutable price snapshots with a verification function so a
  supplier price change cannot mutate an open order.
- `feat(pricing)`: catalog dry-run assessment with negative-margin detection.
- `feat(wallet)`: double-entry ledger. Balances are derived from entries;
  unbalanced transactions are rejected.
- `feat(orders)`: explicit order state machine with an audit record per
  transition and terminal-state protection.
- `feat(idempotency)`: `runOnce` with request fingerprinting, replay detection
  and an in-flight guard.
- `feat(supplier)`: typed `SupplierProvider` interface, server-side-only HTTP
  client, HTTP status to domain error mapping, exponential backoff with jitter,
  timeout and circuit breaker.
- `feat(supplier)`: contract parsing for both unit and `per_1000` pricing
  units, including required-input validation.
- `feat(security)`: AES-256-GCM envelope encryption for license delivery and
  constant-time HMAC-SHA256 webhook signature verification.
- `feat(fulfillment)`: compensating saga covering supplier failure, automatic
  wallet refund, admin ticket creation and dead-letter queueing.
- `test`: 101 tests across 10 files. 100.00% line, 99.60% branch coverage.
  Pricing, wallet and fulfillment modules are at 100.00% branch coverage.
- `docs`: audit, supplier contract, architecture, nine ADRs, security model,
  verification, unit economics, traceability, roadmap, go-live checklist.
- `ci`: workflow running typecheck, lint, coverage, dependency audit, secret
  scan of full history, client-bundle key-leak assertion and E2E.

### Fixed

- `fix(supplier)`: `usdToCents` now rejects non-string, non-number payload
  values instead of throwing a `TypeError`. Found by a failing test, not by
  inspection.

### Security

- Documented live exposure in the target repository: a tracked `.env`, a
  tracked SQLite database and a personal access token pasted into chat. See
  `docs/SECURITY.md` section 5.0. All three require revocation and history
  purge.

### Not included

- Web layer, admin panel, database migrations, gateway integration and crypto
  rail. This release is the domain kernel only. Gates that require a running
  application are reported as NOT RUN in `docs/VERIFICATION.md`.
