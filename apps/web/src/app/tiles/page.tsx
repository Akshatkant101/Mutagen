"use client";

import { useState } from "react";

const COLS = 12;
const ROWS = 11;
const TOTAL_TILES = COLS * ROWS; // 132 (0 to 131)
const TILE_SIZE = 16;
const SHEET_WIDTH = COLS * TILE_SIZE; // 192
const SHEET_HEIGHT = ROWS * TILE_SIZE; // 176

export default function TilesDebugPage() {
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(3); // 3x or 4x

  const tiles = Array.from({ length: TOTAL_TILES }, (_, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    return {
      index,
      col,
      row,
      bgX: -(col * TILE_SIZE),
      bgY: -(row * TILE_SIZE),
    };
  });

  return (
    <div className="min-h-screen bg-[#0d0d12] text-stone-200 p-6 font-mono select-none">
      <header className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-[#ff5722]">
            KENNEY TINY DUNGEON TILESET INSPECTOR (/tiles)
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            132 frames (12 columns × 11 rows, 16×16 px per tile). Click any tile to inspect.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Scale:</span>
            {[2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={`px-2.5 py-1 text-xs border ${
                  scale === s
                    ? "bg-[#ff5722] text-black border-[#ff5722] font-bold"
                    : "bg-[#181822] text-stone-300 border-stone-700 hover:border-stone-500"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <a
            href="/"
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 transition-colors"
          >
            ← Back to Game
          </a>
        </div>
      </header>

      {/* Selected Tile Details Banner */}
      {selectedFrame !== null && (
        <div className="max-w-6xl mx-auto mb-6 bg-[#161622] border-2 border-[#ff5722] p-4 flex items-center gap-6">
          <div
            style={{
              width: `${TILE_SIZE * 4}px`,
              height: `${TILE_SIZE * 4}px`,
              backgroundImage: "url('/assets/tilemap_packed.png')",
              backgroundPosition: `${-(selectedFrame % COLS) * TILE_SIZE * 4}px ${
                -Math.floor(selectedFrame / COLS) * TILE_SIZE * 4
              }px`,
              backgroundSize: `${SHEET_WIDTH * 4}px ${SHEET_HEIGHT * 4}px`,
              imageRendering: "pixelated",
            }}
            className="border border-stone-700 bg-stone-900"
          />
          <div>
            <div className="text-base font-bold text-[#ff5722]">
              FRAME {selectedFrame} (Index: {selectedFrame})
            </div>
            <div className="text-xs text-stone-300 mt-1">
              Column: {selectedFrame % COLS} | Row: {Math.floor(selectedFrame / COLS)}
            </div>
            <div className="text-xs text-stone-400 mt-1">
              File: <code className="text-emerald-400">tile_{String(selectedFrame).padStart(4, "0")}.png</code>
            </div>
            <div className="text-xs text-stone-500 mt-2">
              Constant syntax: <code className="text-amber-300">FRAME_NAME: {selectedFrame}</code>
            </div>
          </div>
        </div>
      )}

      {/* Grid of All 132 Tiles */}
      <main className="max-w-6xl mx-auto overflow-x-auto pb-8">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            width: `${COLS * (TILE_SIZE * scale + 16)}px`,
          }}
        >
          {tiles.map((tile) => {
            const isSelected = selectedFrame === tile.index;
            const tileSizeScaled = TILE_SIZE * scale;

            return (
              <div
                key={tile.index}
                onClick={() => setSelectedFrame(tile.index)}
                className={`flex flex-col items-center p-2 rounded-none cursor-pointer border transition-all ${
                  isSelected
                    ? "bg-[#201c24] border-[#ff5722] shadow-[0_0_10px_rgba(255,87,34,0.4)]"
                    : "bg-[#14141e] border-stone-800 hover:border-stone-600 hover:bg-[#1c1c28]"
                }`}
              >
                {/* Tile Frame Number Label */}
                <span
                  className={`text-[10px] font-bold mb-1.5 ${
                    isSelected ? "text-[#ff5722]" : "text-stone-400"
                  }`}
                >
                  #{tile.index}
                </span>

                {/* Scaled Tile Sprite */}
                <div
                  style={{
                    width: `${tileSizeScaled}px`,
                    height: `${tileSizeScaled}px`,
                    backgroundImage: "url('/assets/tilemap_packed.png')",
                    backgroundPosition: `${tile.bgX * scale}px ${tile.bgY * scale}px`,
                    backgroundSize: `${SHEET_WIDTH * scale}px ${SHEET_HEIGHT * scale}px`,
                    imageRendering: "pixelated",
                  }}
                  className="bg-black/40 border border-stone-900"
                />

                {/* Subtitle with Row/Col */}
                <span className="text-[9px] text-stone-600 mt-1">
                  r{tile.row} c{tile.col}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

