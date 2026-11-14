"use client";

import { useEffect, useRef } from "react";
import { ARENA_WIDTH, ARENA_HEIGHT } from "@mutagen/shared";

interface GameCanvasProps {
  playerName?: string;
}

export default function GameCanvas({ playerName = "Player" }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: any = null;
    let isCancelled = false;

    async function initPhaser() {
      if (!containerRef.current || isCancelled) return;

      const Phaser = await import("phaser");
      const { ArenaScene } = await import("../game/ArenaScene");

      if (isCancelled || !containerRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: ARENA_WIDTH, // 1216
        height: ARENA_HEIGHT, // 800
        pixelArt: true,
        roundPixels: true,
        backgroundColor: "#2f171e",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [ArenaScene],
      };

      game = new Phaser.Game(config);
      game.scene.start("ArenaScene", { playerName });
    }

    initPhaser();

    return () => {
      isCancelled = true;
      if (game) {
        try {
          const scene = game.scene.getScene("ArenaScene") as any;
          if (scene && typeof scene.destroy === "function") {
            scene.destroy();
          }
        } catch {
          // ignore
        }
        game.destroy(true);
        game = null;
      }
    };
  }, [playerName]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden select-none"
    />
  );
}
