# Sophia's Jungle — Audit Playbook

Re-runnable manual + scripted audit for deployment readiness.

The repo gitignores `screenshots/`, `pi-readiness.md`, `visual-review.md`
so the generated outputs stay local. This README + `audit.js` (the
in-page harness) are committed so the audit can be re-run on any
machine.

## What the audit checks

1. **Console errors** — fresh load, scene transitions, full playthrough
2. **State integrity** — save-state shape after playthrough
3. **Particle / tween counts** — at PERF_TIER=low vs mid vs high
4. **Layout** — every modal/overlay fits inside the 800x600 internal
   canvas at all PERF_TIER values
5. **Visual review** — Claude reads each captured screenshot and
   writes findings to `visual-review.md`
6. **Pi readiness verdict** — written to `pi-readiness.md`

## How to run

```
# 1. Start a static server
npm.cmd exec --yes http-server -- -p 8080 -c-1 --cors

# 2. Open the game with the audit harness loaded
http://localhost:8080/?audit=1
# (Adds runAudit() to window. See audit.js for usage.)

# 3. From the browser devtools console:
> runAudit()
# Walks through scenes, dumps state and FPS samples to console.
# Pause at each named step for screenshot capture.
```

To force PERF_TIER for testing:
```
http://localhost:8080/?perf=low
http://localhost:8080/?perf=mid
http://localhost:8080/?perf=high
```

## Outputs

After running, three artefacts are produced locally (gitignored):

- `screenshots/<perf>/<step>.png` — one per stop / scene / modal
- `pi-readiness.md` — verdict + recommended Pi settings + known risks
- `visual-review.md` — Claude's per-screenshot assessment

The latter two are written into the final session report so the
results survive even though the files don't ship.
