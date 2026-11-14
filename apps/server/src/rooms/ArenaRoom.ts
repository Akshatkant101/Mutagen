import { Room, Client } from "colyseus";
import { ArenaState, Player } from "../schema/ArenaState.js";
import {
  TICK_RATE,
  PLAYER_SPEED,
  PLAYER_RADIUS,
  MESSAGE_TYPES,
  InputPayloadSchema,
  resolveCircleMovement,
  SPAWN_POINTS,
} from "@mutagen/shared";

export class ArenaRoom extends Room<{ state: ArenaState }> {
  maxClients = 4;

  onCreate(options: any) {
    this.setState(new ArenaState());

    // Handle client input (direction changes only)
    this.onMessage(MESSAGE_TYPES.INPUT, (client, data: unknown) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const parsed = InputPayloadSchema.safeParse(data);
      if (!parsed.success) return;

      player.inputDx = parsed.data.dx;
      player.inputDy = parsed.data.dy;
    });

    // Fixed 20 Hz simulation tick loop (1000 / 20 = 50ms)
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 1000 / TICK_RATE);
  }

  update(deltaTime: number) {
    const dt = deltaTime / 1000;

    this.state.players.forEach((player: Player) => {
      const { inputDx, inputDy } = player;
      const length = Math.hypot(inputDx, inputDy);

      if (length > 0) {
        // Normalize direction so diagonal speed equals straight speed
        const normX = inputDx / length;
        const normY = inputDy / length;

        const deltaX = normX * PLAYER_SPEED * dt;
        const deltaY = normY * PLAYER_SPEED * dt;

        // Resolve movement against wall tiles (moves x then y separately to allow sliding)
        const resolved = resolveCircleMovement(
          player.x,
          player.y,
          deltaX,
          deltaY,
          PLAYER_RADIUS
        );

        player.x = resolved.x;
        player.y = resolved.y;
      }
    });
  }

  private printRoster(header: string) {
    console.log(`\n========================================`);
    console.log(`[ArenaRoom] ${header}`);
    console.log(`[ArenaRoom] Total Players: ${this.state.players.size} / ${this.maxClients}`);
    if (this.state.players.size === 0) {
      console.log(`  (Room is currently empty)`);
    } else {
      let idx = 1;
      this.state.players.forEach((p, sessionId) => {
        const isMoving = p.inputDx !== 0 || p.inputDy !== 0;
        const status = isMoving ? "MOVING" : "IDLE";
        console.log(
          `  #${idx++}: "${p.name}" (ID: ${sessionId}) | Pos: (${Math.round(p.x)}, ${Math.round(p.y)}) | Status: ${status}`
        );
      });
    }
    console.log(`========================================\n`);
  }

  onJoin(client: Client, options?: { name?: string }) {
    const player = new Player();
    player.id = client.sessionId;
    player.name =
      options?.name && typeof options.name === "string" && options.name.trim().length > 0
        ? options.name.trim().slice(0, 20)
        : `Player ${this.state.players.size + 1}`;

    // Select balanced spawn point from shared SPAWN_POINTS
    const spawnIdx = this.state.players.size % SPAWN_POINTS.length;
    const spawn = SPAWN_POINTS[spawnIdx];
    player.x = spawn.x;
    player.y = spawn.y;

    this.state.players.set(client.sessionId, player);
    this.printRoster(`PLAYER JOINED: "${player.name}" (${client.sessionId})`);
  }

  onLeave(client: Client, code?: number) {
    const player = this.state.players.get(client.sessionId);
    const playerName = player?.name || client.sessionId;
    this.state.players.delete(client.sessionId);
    this.printRoster(`PLAYER LEFT: "${playerName}" (ID: ${client.sessionId}, code: ${code})`);
  }
}
