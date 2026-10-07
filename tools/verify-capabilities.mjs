import assert from "node:assert/strict";

import { resolveLayoutCapabilities, resolvePanelAvailability } from "../src/engine/presets.js";

const photoState = (overrides = {}) => ({
  layout: "yt-panel",
  playerMeta: { timeRight: "3:42" },
  ytStats: { likes: "12", comments: "2", shares: "1" },
  ...overrides,
});

const staticCapabilities = resolveLayoutCapabilities({ layout: "mosaic" });
assert.equal(staticCapabilities.text, true);
assert.equal(staticCapabilities.player, false);
assert.equal(staticCapabilities.progressTrack, false);

const shortCapabilities = resolveLayoutCapabilities({ layout: "yt-short", lastPreset: "story" });
assert.equal(shortCapabilities.player, true);
assert.equal(shortCapabilities.videoControls, true);
assert.equal(shortCapabilities.interactionStats, true);
assert.equal(shortCapabilities.progressTrack, true);

const playerPanel = resolvePanelAvailability(photoState(), 1);
assert.equal(playerPanel.showPlayerPanel, true);
assert.equal(playerPanel.showProgressTrack, true);
assert.equal(playerPanel.hasDuration, true);
assert.equal(playerPanel.hasStats, true);

const noPhotos = resolvePanelAvailability(photoState(), 0);
assert.equal(noPhotos.showPlayerPanel, false);
assert.equal(noPhotos.showProgressTrack, false);
assert.equal(noPhotos.hasStats, false);

const noDuration = resolvePanelAvailability(photoState({ playerMeta: { timeRight: "" } }), 1);
assert.equal(noDuration.showPlayerPanel, true);
assert.equal(noDuration.hasDuration, false);

const noStats = resolvePanelAvailability(photoState({ ytStats: { likes: "", comments: "", shares: "" } }), 1);
assert.equal(noStats.hasStats, false);

const stalePreset = resolveLayoutCapabilities({ layout: "mosaic", lastPreset: "story" });
assert.equal(stalePreset.player, false);
assert.equal(stalePreset.text, true);

console.log("预设能力与动态面板专项自检");
console.log("✓ 静态布局隐藏播放器能力");
console.log("✓ 媒体、duration、互动数据缺失时按层级隐藏");
console.log("✓ 预设只在布局匹配时覆盖能力，切换后设置保留");
console.log("6 / 6 项通过");
