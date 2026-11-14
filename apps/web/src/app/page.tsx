"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("../components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-[#08080a] text-stone-500 font-pixel text-xs tracking-wider">
      LOADING ARENA...
    </div>
  ),
});

export default function ArenaPage() {
  const [name, setName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [inArena, setInArena] = useState(false);

  // Hydration fix: generate default player name only on client mount
  useEffect(() => {
    setMounted(true);
    setName(`Hero-${Math.floor(100 + Math.random() * 900)}`);
  }, []);

  const handleEnterArena = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    setInArena(true);
  };

  const handleLeaveArena = () => {
    setInArena(false);
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#08080a] text-stone-100 flex flex-col font-pixel select-none relative">
      {!inArena ? (
        /* Title Screen */
        <div className="h-full w-full flex flex-col items-center justify-center p-6 relative">
          {/* Subtle background dungeon ambient grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, rgba(255,87,34,0.15) 0%, transparent 70%)",
            }}
          />

          <div className="z-10 flex flex-col items-center text-center max-w-sm w-full">
            <h1 className="text-4xl md:text-5xl font-bold tracking-widest text-[#ff5722] drop-shadow-[0_0_15px_rgba(255,87,34,0.35)]">
              MUTAGEN
            </h1>
            <p className="text-[10px] md:text-xs text-stone-500 tracking-[0.25em] mt-2 uppercase">
              Adaptive Boss AI Arena
            </p>

            <form
              onSubmit={handleEnterArena}
              className="mt-8 flex flex-col items-center gap-3 w-full"
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={mounted ? "ENTER NAME..." : ""}
                maxLength={16}
                autoFocus
                className="w-full bg-[#111116] border-2 border-stone-800 text-stone-200 text-xs px-4 py-3 rounded-none text-center focus:outline-none focus:border-[#ff5722] transition-colors tracking-wider placeholder:text-stone-700"
              />

              <button
                type="submit"
                disabled={!mounted || !name.trim()}
                className="w-full bg-[#ff5722] hover:bg-[#ff7043] disabled:opacity-50 text-black font-bold text-xs py-3 px-6 rounded-none uppercase tracking-widest transition-all active:translate-y-0.5 cursor-pointer shadow-[0_4px_12px_rgba(255,87,34,0.25)]"
              >
                Enter Arena
              </button>
            </form>

            <p className="text-[10px] text-stone-600 tracking-wider mt-6">
              WASD / ARROW KEYS TO MOVE
            </p>
          </div>
        </div>
      ) : (
        /* In-Game Full Viewport View */
        <div className="h-full w-full relative flex items-center justify-center overflow-hidden">
          {/* In-Game Minimal HUD */}
          <header className="absolute top-3 left-3 z-50 flex items-center gap-3 bg-[#0c0c12]/90 border border-stone-800/80 px-3 py-1.5 text-[11px] text-stone-300 rounded-none backdrop-blur-sm">
            <span className="text-[#ff5722] font-bold tracking-wider">
              MUTAGEN
            </span>
            <span className="text-stone-700">|</span>
            <span className="text-stone-200 tracking-wide">{name}</span>
            <span className="text-stone-700">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-none animate-pulse" />
              ONLINE
            </span>
          </header>

          <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
            <div className="hidden sm:flex bg-[#0c0c12]/90 border border-stone-800/80 px-3 py-1.5 text-[10px] text-stone-500 rounded-none backdrop-blur-sm">
              <span className="text-stone-400 font-bold mr-1.5">WASD</span> TO MOVE
            </div>
            <button
              onClick={handleLeaveArena}
              className="bg-[#181820] hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 text-[10px] px-3 py-1.5 rounded-none uppercase tracking-wider transition-colors cursor-pointer"
            >
              Exit
            </button>
          </div>

          {/* Phaser Canvas (Scale.FIT fills viewport, centered, zero page scroll) */}
          <GameCanvas playerName={name} />
        </div>
      )}
    </main>
  );
}
