import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;

  // Movement input direction from client (server-only)
  inputDx: number = 0;
  inputDy: number = 0;
}

export class ArenaState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

