// Sophia's Jungle — in-page audit harness
// =========================================
// Loaded by the game when URL contains ?audit=1.
// Adds window.runAudit and window.auditState.
//
// Use the browser devtools console to walk the audit:
//   runAudit()          // print the run script (manual playbook)
//   auditState.scene('Title')
//   auditState.scene('TopDown')
//   auditState.scene('Stop', { stopId: 'snowy', returnTo:{x:0,y:0} })
//   auditState.completeAll()        // force all 5 stops complete
//   auditState.fpsSample(2000)      // returns avg FPS over 2 seconds
//   auditState.boundsCheck()        // logs any out-of-canvas elements
//   auditState.layoutReport()       // returns a layout report object

(function () {
  if (!/\baudit=1\b/.test(window.location.search)) return;

  window.runAudit = function () {
    /* eslint-disable no-console */
    console.log('%c Sophia\'s Jungle Audit', 'background:#ffeb3b;color:#4a2c1a;font-size:18px;padding:4px 8px;font-weight:bold;');
    console.log('Playbook:');
    [
      "1. auditState.scene('Title')              — Title screen",
      "2. auditState.scene('Opening')            — Opening story",
      "3. auditState.scene('TopDown')            — Map (fresh)",
      "4. auditState.scene('Stop', {stopId:'snowy', returnTo:{x:0,y:0}}) — Snowy",
      "5. auditState.scene('Stop', {stopId:'crab',  returnTo:{x:0,y:0}}) — Crab Speed Read",
      "6. auditState.scene('Stop', {stopId:'snake', returnTo:{x:0,y:0}}) — Snake",
      "7. auditState.scene('Stop', {stopId:'bat',   returnTo:{x:0,y:0}}) — Bat",
      "8. auditState.scene('Stop', {stopId:'parrot',returnTo:{x:0,y:0}}) — Parrot",
      "9. auditState.scene('Ending')             — Ending sequence",
      "10. auditState.completeAll(); auditState.scene('TopDown') — Party mode",
      "",
      "Layout / perf:",
      "  auditState.fpsSample(1500)              — avg FPS",
      "  auditState.layoutReport()               — modal bounds + tween count",
      "  auditState.openMyAdventure()            — My Adventure DOM panel",
      "  auditState.openParentMode()             — Parent Mode DOM panel"
    ].forEach(l => console.log(l));
  };

  window.auditState = {
    scene(name, data) {
      const all = window.game.scene.getScenes(false).map(s => s.scene.key);
      for (const k of all) {
        if (window.game.scene.getScene(k).sys.settings.status >= 4) {
          try { window.game.scene.stop(k); } catch (e) {}
        }
      }
      const s = window.game.scene.getScene(name);
      if (s && s.exiting !== undefined) s.exiting = false;
      window.game.scene.start(name, data || {});
      return 'started ' + name;
    },

    completeAll() {
      const save = SaveManager.load();
      Object.keys(save.puzzlesSolved).forEach(k => save.puzzlesSolved[k] = true);
      Object.keys(save.actsUnlocked).forEach(k => save.actsUnlocked[k] = true);
      save.partyItems = { bananas: 1, flowers: 1, stones: 1, musicNotes: 1, goldenBanana: true };
      save.stats.gameCompleted = true;
      save.stats.endingSeen = true;
      save.stats.openingSeen = true;
      save.speedReadBest = { defaultBank: 9, homeworkBank: 0 };
      SaveManager.save(save);
      return save;
    },

    openMyAdventure() { openMyAdventurePanel(() => {}); },
    openParentMode()  { openParentModePanel(() => {}); },

    async fpsSample(durationMs) {
      durationMs = durationMs || 1500;
      const game = window.game;
      const samples = [];
      let rafId;
      let last = performance.now();
      const start = last;
      return new Promise(resolve => {
        const tick = (t) => {
          const dt = t - last;
          if (dt > 0) samples.push(1000 / dt);
          last = t;
          if (t - start < durationMs) rafId = requestAnimationFrame(tick);
          else {
            cancelAnimationFrame(rafId);
            const avg = samples.reduce((a,b)=>a+b,0) / samples.length;
            const min = Math.min(...samples), max = Math.max(...samples);
            resolve({ avgFps: +avg.toFixed(1), minFps: +min.toFixed(1), maxFps: +max.toFixed(1), samples: samples.length });
          }
        };
        rafId = requestAnimationFrame(tick);
      });
    },

    layoutReport() {
      const game = window.game;
      const W = game.config.width, H = game.config.height;
      const report = { canvas: { W, H }, scenes: {} };
      game.scene.getScenes(true).forEach(s => {
        const list = s.children && s.children.list ? s.children.list : [];
        let outOfBounds = 0;
        let interactive = 0;
        for (const obj of list) {
          if (!obj || !obj.scrollFactorX !== undefined) {}
          // Only check elements pinned to camera (scrollFactor 0) — world-space
          // objects can validly extend outside the camera viewport.
          const isUI = (obj.scrollFactorX === 0 || obj.scrollFactorY === 0);
          if (isUI && obj.x !== undefined && obj.width) {
            const half = (obj.width || 0) / 2;
            if (obj.originX === 0.5) {
              if (obj.x - half < -20 || obj.x + half > W + 20) outOfBounds++;
            } else if (obj.originX === 0) {
              if (obj.x < -20 || obj.x + obj.width > W + 20) outOfBounds++;
            }
          }
          if (obj.input && obj.input.enabled) interactive++;
        }
        report.scenes[s.scene.key] = {
          children: list.length,
          interactive,
          uiOutOfBounds: outOfBounds,
          tweens: s.tweens ? s.tweens.getTweens().length : 0
        };
      });
      report.PERF_TIER = window.PERF_TIER;
      return report;
    }
  };

  console.log('[audit] harness loaded. Type runAudit() for playbook.');
})();
