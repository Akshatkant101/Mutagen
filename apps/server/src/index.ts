// Polyfill Symbol.metadata for @colyseus/schema on Node 22+
(Symbol as any).metadata ??= Symbol("Symbol.metadata");

import config, { listen } from "@colyseus/tools";
import cors from "cors";
import express from "express";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { ArenaRoom } from "./rooms/ArenaRoom.js";
import { ROOM_NAME } from "@mutagen/shared";

const serverOptions = config({
  initializeExpress: (app) => {
    const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
    app.use(cors({ origin: corsOrigin, credentials: true }));
    app.use(express.json());

    // Health check endpoint
    app.get("/health", (_req, res) => {
      res.json({ status: "ok" });
    });

    // Colyseus Monitor and Playground
    app.use("/colyseus", monitor());
    app.use("/playground", playground());
  },

  initializeGameServer: (gameServer) => {
    // Define the authoritative room using shared ROOM_NAME constant
    gameServer.define(ROOM_NAME, ArenaRoom);
  },

  beforeListen: () => {
    const port = Number(process.env.PORT) || 2567;
    console.log(`[Mutagen Server] Configured Port: ${port}`);
    console.log(`[Mutagen Server] Client URL: ws://localhost:${port}`);
    console.log(`[Mutagen Server] Registered rooms: [ "${ROOM_NAME}" ]`);
    console.log(`[Colyseus Monitor] http://localhost:${port}/colyseus`);
    console.log(`[Colyseus Playground] http://localhost:${port}/playground`);
  },
});

const port = Number(process.env.PORT) || 2567;
listen(serverOptions, port).catch((err: any) => {
  if (err?.code === "EADDRINUSE") {
    console.error(
      `[Mutagen Server] Port ${port} is busy. If restarting, wait 1-2s or check for background processes.`
    );
  } else {
    console.error(`[Mutagen Server] Failed to listen:`, err);
  }
});
