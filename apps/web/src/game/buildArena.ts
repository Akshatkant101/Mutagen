import * as Phaser from "phaser";
import { ARENA_WIDTH, ARENA_HEIGHT } from "@mutagen/shared";

/**
 * Builds the game environment using the official Kenney Tiny Dungeon Tiled map.
 * Renders all 3 official layers (Dungeon, Carts, Objects) at 2x pixel-art scale.
 */
export function buildArena(scene: Phaser.Scene) {
  // 1. Dark maroon void background matching Kenney Sample.png (#2f171e)
  scene.cameras.main.setBackgroundColor("#2f171e");

  // 2. Load Tiled map preloaded from /assets/sampleMap.json
  const map = scene.make.tilemap({ key: "sample_map" });

  // 3. Link tileset image ("tileset" name in Tiled JSON -> "dungeon_tiles" Phaser texture)
  const tileset = map.addTilesetImage("tileset", "dungeon_tiles");

  if (!tileset) {
    console.error("[buildArena] Could not link tileset 'tileset' with 'dungeon_tiles'");
    return;
  }

  // 4. Render official Kenney layers in correct visual stacking order:
  // Layer 1: Dungeon (corridors, rooms, stone walls, sand floor, voids, pits, stairs)
  const dungeonLayer = map.createLayer("Dungeon", tileset, 0, 0);
  if (dungeonLayer) {
    dungeonLayer.setScale(2).setDepth(0);
  }

  // Layer 2: Carts (minecart tracks and minecarts)
  const cartsLayer = map.createLayer("Carts", tileset, 0, 0);
  if (cartsLayer) {
    cartsLayer.setScale(2).setDepth(1);
  }

  // Layer 3: Objects (chests, barrels, crates, torches, gravestones, fountains, doors)
  const objectsLayer = map.createLayer("Objects", tileset, 0, 0);
  if (objectsLayer) {
    objectsLayer.setScale(2).setDepth(2);
  }

  // 5. Subtle ambient torch flicker glows at torch locations
  addAmbientTorchGlows(scene);
}

function addAmbientTorchGlows(scene: Phaser.Scene) {
  // World positions for torches from Objects layer:
  // (25, 7) -> world (816, 240)
  // (26, 8) -> world (848, 272)
  // (21, 11) -> world (688, 368)
  const torchPositions = [
    { x: 25 * 32 + 16, y: 7 * 32 + 16 },
    { x: 26 * 32 + 16, y: 8 * 32 + 16 },
    { x: 21 * 32 + 16, y: 11 * 32 + 16 },
  ];

  torchPositions.forEach((pos, idx) => {
    const glow = scene.add
      .circle(pos.x, pos.y, 28, 0xff7043, 0.18)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3);

    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.12, to: 0.24 },
      scale: { from: 0.94, to: 1.06 },
      duration: 800 + idx * 150,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  });
}
