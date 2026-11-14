import * as Phaser from "phaser";
import { Client, Room, Callbacks } from "@colyseus/sdk";
import {
  ARENA_WIDTH,
  ARENA_HEIGHT,
  ROOM_NAME,
  MESSAGE_TYPES,
} from "@mutagen/shared";
import { buildArena } from "./buildArena";
import { createPlayerSprite, PlayerSpriteEntity } from "./createPlayerSprite";

export class ArenaScene extends Phaser.Scene {
  private client!: Client;
  private room?: Room;
  private playerName: string = "Player";
  private players: Map<string, PlayerSpriteEntity> = new Map();

  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private lastDx: number = 0;
  private lastDy: number = 0;
  private handleBlurOrHidden!: () => void;

  constructor() {
    super({ key: "ArenaScene" });
  }

  init(data: { playerName?: string }) {
    if (data?.playerName) {
      this.playerName = data.playerName;
    }
  }

  preload() {
    // 1. Preload Kenney Tiny Dungeon tilesheet image for Tilemap
    this.load.image("dungeon_tiles", "/assets/tilemap_packed.png");

    // 2. Preload Kenney Tiny Dungeon official sample map (Tiled JSON)
    this.load.tilemapTiledJSON("sample_map", "/assets/sampleMap.json");

    // 3. Preload spritesheet for player character sprites (16x16 frames)
    this.load.spritesheet("dungeon", "/assets/tilemap_packed.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    // Fixed camera size matching ARENA_WIDTH and ARENA_HEIGHT (1024x640)
    this.cameras.main.setZoom(1);
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // 2. Build arena from shared ARENA_GRID
    buildArena(this);

    // 3. Setup keyboard inputs (WASD and arrow keys)
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    // 4. Window blur and tab visibility change handlers
    this.setupWindowBlurHandler();

    // 5. Connect to Colyseus game server
    this.connectToServer();
  }

  private setupWindowBlurHandler() {
    this.handleBlurOrHidden = () => {
      if (document.hidden || !document.hasFocus()) {
        if (this.lastDx !== 0 || this.lastDy !== 0) {
          this.lastDx = 0;
          this.lastDy = 0;
          if (this.room) {
            this.room.send(MESSAGE_TYPES.INPUT, { dx: 0, dy: 0 });
          }
        }
      }
    };

    window.addEventListener("blur", this.handleBlurOrHidden);
    document.addEventListener("visibilitychange", this.handleBlurOrHidden);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
  }

  private async connectToServer() {
    try {
      const serverUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "ws://localhost:2567";
      console.log(
        `[ArenaScene] Connecting to server at ${serverUrl} for room "${ROOM_NAME}"...`
      );

      this.client = new Client(serverUrl);

      this.room = await this.client.joinOrCreate(ROOM_NAME, {
        name: this.playerName,
      });

      console.log(
        `[ArenaScene] Connected to room "${this.room.name}" (ID: ${this.room.roomId}, Session: ${this.room.sessionId})`
      );

      // State sync callbacks API (Colyseus 0.17 Callbacks strategy)
      const callbacks = Callbacks.get(this.room);

      const addPlayerEntity = (player: any, sessionId: string) => {
        if (this.players.has(sessionId)) return;

        const isLocal = sessionId === this.room?.sessionId;
        const slotIndex = this.players.size;

        console.log(
          `[ArenaScene] player added: ${player.name || "Player"} ${player.x} ${player.y} (id=${sessionId}, isLocal=${isLocal})`
        );

        const entity = createPlayerSprite(this, player, slotIndex, isLocal);
        this.players.set(sessionId, entity);

        // Listen for coordinate updates from server (20 Hz)
        callbacks.listen(player, "x", (newX: number) => {
          entity.targetX = newX;
        });

        callbacks.listen(player, "y", (newY: number) => {
          entity.targetY = newY;
        });

        callbacks.listen(player, "name", (newName: string) => {
          entity.nameText.setText(newName);
        });
      };

      // 1. Listen for new players added to collection (immediate: true triggers existing items)
      callbacks.onAdd(
        "players",
        (player: any, sessionId: any) => {
          addPlayerEntity(player, String(sessionId));
        },
        true
      );

      // 2. Explicit safeguard for existing players in room state (ensures local player is never missed)
      if (this.room.state?.players) {
        this.room.state.players.forEach((player: any, sessionId: any) => {
          addPlayerEntity(player, String(sessionId));
        });
      }

      // 3. Listen for player removals
      callbacks.onRemove("players", (_player: any, sessionId: any) => {
        const id = String(sessionId);
        console.log(`[ArenaScene] player removed: ${id}`);
        const entity = this.players.get(id);
        if (entity) {
          entity.container.destroy();
          this.players.delete(id);
        }
      });

      this.room.onLeave((code) => {
        console.log(`[ArenaScene] Disconnected from server (code: ${code})`);
      });
    } catch (err: any) {
      console.error("[ArenaScene] Connection error:", err);
    }
  }

  update(_time: number, delta: number) {
    // 1. Capture keyboard input and send direction ONLY on change
    if (this.room && document.hasFocus() && !document.hidden) {
      let dx = 0;
      let dy = 0;

      if (this.cursors) {
        if (this.cursors.left?.isDown || this.keyA?.isDown) dx -= 1;
        if (this.cursors.right?.isDown || this.keyD?.isDown) dx += 1;
        if (this.cursors.up?.isDown || this.keyW?.isDown) dy -= 1;
        if (this.cursors.down?.isDown || this.keyS?.isDown) dy += 1;
      }

      if (dx !== this.lastDx || dy !== this.lastDy) {
        this.lastDx = dx;
        this.lastDy = dy;
        this.room.send(MESSAGE_TYPES.INPUT, { dx, dy });
      }
    }

    // 2. Frame-rate independent exponential smoothing interpolation
    const dtSec = delta / 1000;
    const smoothingAlpha = 1 - Math.exp(-22 * dtSec);

    this.players.forEach((entity) => {
      // Flip sprite to face movement direction
      const diffX = entity.targetX - entity.currentX;
      if (Math.abs(diffX) > 0.5) {
        const shouldFaceLeft = diffX < 0;
        if (entity.facingLeft !== shouldFaceLeft) {
          entity.facingLeft = shouldFaceLeft;
          entity.sprite.setFlipX(shouldFaceLeft);
        }
      }

      // Exponential smoothing interpolation
      entity.currentX += (entity.targetX - entity.currentX) * smoothingAlpha;
      entity.currentY += (entity.targetY - entity.currentY) * smoothingAlpha;

      entity.container.setPosition(entity.currentX, entity.currentY);
    });
  }

  destroy() {
    if (this.handleBlurOrHidden) {
      window.removeEventListener("blur", this.handleBlurOrHidden);
      document.removeEventListener("visibilitychange", this.handleBlurOrHidden);
    }
    if (this.room) {
      try {
        this.room.leave();
      } catch {
        // already left
      }
      this.room = undefined;
    }
  }
}
