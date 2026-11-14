import * as Phaser from "phaser";
import { DUNGEON_FRAMES, RENDER_DEPTH } from "./constants";

export interface PlayerSpriteEntity {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  nameText: Phaser.GameObjects.Text;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  facingLeft: boolean;
}

const CHARACTER_FRAMES = [
  DUNGEON_FRAMES.HERO_KNIGHT,
  DUNGEON_FRAMES.HERO_WIZARD,
  DUNGEON_FRAMES.HERO_WARRIOR,
  DUNGEON_FRAMES.HERO_ROGUE,
];

const SLOT_TINTS = [
  0xffffff, // Slot 0: White / Natural
  0xfde68a, // Slot 1: Amber Gold
  0xa7f3d0, // Slot 2: Emerald Green
  0xfbcfe8, // Slot 3: Rose
];

export function createPlayerSprite(
  scene: Phaser.Scene,
  player: { id: string; name: string; x: number; y: number },
  slotIndex: number,
  isLocal: boolean
): PlayerSpriteEntity {
  const container = scene.add.container(player.x, player.y);

  // 1. Character sprite at 2x scale
  const frame = CHARACTER_FRAMES[slotIndex % CHARACTER_FRAMES.length];
  const sprite = scene.add.sprite(0, 0, "dungeon", frame).setScale(2);

  const tint = SLOT_TINTS[slotIndex % SLOT_TINTS.length];
  if (tint !== 0xffffff) {
    sprite.setTint(tint);
  }

  // 2. Name label with square box and ember/gold accent
  const labelColor = isLocal ? "#ff5722" : "#fcd34d";
  const nameText = scene.add
    .text(0, -24, player.name || "Player", {
      fontSize: "11px",
      color: labelColor,
      fontFamily: "var(--font-pixel), monospace",
      backgroundColor: "rgba(8, 8, 10, 0.85)",
      padding: { x: 5, y: 2 },
    })
    .setOrigin(0.5);

  // Subtle ember indicator under local player
  if (isLocal) {
    const indicator = scene.add.circle(0, 16, 2.5, 0xff5722).setAlpha(0.9);
    container.add(indicator);
  }

  container.add([sprite, nameText]);
  container.setDepth(RENDER_DEPTH.PLAYER);

  return {
    container,
    sprite,
    nameText,
    currentX: player.x,
    currentY: player.y,
    targetX: player.x,
    targetY: player.y,
    facingLeft: false,
  };
}
