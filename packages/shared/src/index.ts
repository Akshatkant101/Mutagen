import { z } from "zod";

export const ROOM_NAME = "arena";
export const TICK_RATE = 20;
export const TICK_DT = 1 / TICK_RATE; // 0.05 seconds (50 ms)

// Grid tile size (32 world units per tile = 16px Kenney tile at 2x scale)
export const GRID_TILE_SIZE = 32;

// Shared Arena Grid derived from official Kenney Tiny Dungeon map (sampleMap.json / sampleMap.tmx)
// 32 columns x 20 rows
// '#' = Solid wall, pit, or obstacle (blocks movement)
// '.' = Walkable floor corridor or room
export const ARENA_GRID = [
  "#.##############################", // 0
  "#.##############################", // 1
  "#.########.....#################", // 2
  "#....#####.#..##################", // 3
  "#.########..#..##.######.......#", // 4
  "#.###############.######.#.#.#.#", // 5
  "#.###############.######.......#", // 6
  "#.##....#########.....##.......#", // 7
  "#.##.........####.....##.......#", // 8
  "..#..........####.....##.......#", // 9 (stair connection to cemetery)
  "................................", // 10 (main central corridor)
  ".#.###.................#########", // 11
  "...###.......########..#########", // 12
  "######...############..#########", // 13
  "######...############..#########", // 14
  "######...######........#####....", // 15
  "#####......####........#####.#..", // 16
  "##.....................#####....", // 17
  "##..............................", // 18
  "##..............................", // 19
] as const;

export const GRID_COLS = ARENA_GRID[0].length; // 32
export const GRID_ROWS = ARENA_GRID.length; // 20

// ARENA_WIDTH and ARENA_HEIGHT derived directly from the tile grid
export const ARENA_WIDTH = GRID_COLS * GRID_TILE_SIZE; // 1024
export const ARENA_HEIGHT = GRID_ROWS * GRID_TILE_SIZE; // 640

export const PLAYER_SPEED = 250;
export const PLAYER_RADIUS = 14;

export interface SpawnPoint {
  x: number;
  y: number;
}

// 4 balanced spawn points spread across the Kenney dungeon corridors and rooms
export const SPAWN_POINTS: SpawnPoint[] = [
  { x: 528, y: 336 }, // Central Hallway intersection (tile 16, 10)
  { x: 848, y: 240 }, // Cemetery Room (tile 26, 7)
  { x: 560, y: 528 }, // Fountain Room (tile 17, 16)
  { x: 208, y: 560 }, // Minecart Track corridor (tile 6, 17)
];

/**
 * Returns true if the tile at (tx, ty) is a solid wall/obstacle or outside grid boundaries
 */
export function isWall(tx: number, ty: number): boolean {
  if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) {
    return true;
  }
  return ARENA_GRID[ty].charAt(tx) === "#";
}

/**
 * Resolves movement for a circle against the tile grid.
 * Moves X then Y separately so players slide along walls.
 */
export function resolveCircleMovement(
  currentX: number,
  currentY: number,
  deltaX: number,
  deltaY: number,
  radius: number = PLAYER_RADIUS
): { x: number; y: number } {
  let newX = currentX;
  let newY = currentY;

  // 1. Move along X axis and resolve wall collisions
  if (deltaX !== 0) {
    newX += deltaX;
    const minTy = Math.floor((newY - radius + 0.1) / GRID_TILE_SIZE);
    const maxTy = Math.floor((newY + radius - 0.1) / GRID_TILE_SIZE);

    if (deltaX > 0) {
      // Moving right: test leading right edge
      const leadingTx = Math.floor((newX + radius) / GRID_TILE_SIZE);
      for (let ty = minTy; ty <= maxTy; ty++) {
        if (isWall(leadingTx, ty)) {
          newX = leadingTx * GRID_TILE_SIZE - radius - 0.001;
          break;
        }
      }
    } else {
      // Moving left: test leading left edge
      const leadingTx = Math.floor((newX - radius) / GRID_TILE_SIZE);
      for (let ty = minTy; ty <= maxTy; ty++) {
        if (isWall(leadingTx, ty)) {
          newX = (leadingTx + 1) * GRID_TILE_SIZE + radius + 0.001;
          break;
        }
      }
    }
  }

  // 2. Move along Y axis and resolve wall collisions
  if (deltaY !== 0) {
    newY += deltaY;
    const minTx = Math.floor((newX - radius + 0.1) / GRID_TILE_SIZE);
    const maxTx = Math.floor((newX + radius) / GRID_TILE_SIZE);

    if (deltaY > 0) {
      // Moving down: test leading bottom edge
      const leadingTy = Math.floor((newY + radius) / GRID_TILE_SIZE);
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (isWall(tx, leadingTy)) {
          newY = leadingTy * GRID_TILE_SIZE - radius - 0.001;
          break;
        }
      }
    } else {
      // Moving up: test leading top edge
      const leadingTy = Math.floor((newY - radius) / GRID_TILE_SIZE);
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (isWall(tx, leadingTy)) {
          newY = (leadingTy + 1) * GRID_TILE_SIZE + radius + 0.001;
          break;
        }
      }
    }
  }

  // 3. Corner penetration resolver (prevents catching on diagonal corners)
  const minTx = Math.floor((newX - radius) / GRID_TILE_SIZE);
  const maxTx = Math.floor((newX + radius) / GRID_TILE_SIZE);
  const minTy = Math.floor((newY - radius) / GRID_TILE_SIZE);
  const maxTy = Math.floor((newY + radius) / GRID_TILE_SIZE);

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (isWall(tx, ty)) {
        const tileLeft = tx * GRID_TILE_SIZE;
        const tileRight = (tx + 1) * GRID_TILE_SIZE;
        const tileTop = ty * GRID_TILE_SIZE;
        const tileBottom = (ty + 1) * GRID_TILE_SIZE;

        const closestX = Math.max(tileLeft, Math.min(tileRight, newX));
        const closestY = Math.max(tileTop, Math.min(tileBottom, newY));

        const diffX = newX - closestX;
        const diffY = newY - closestY;
        const distSq = diffX * diffX + diffY * diffY;

        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const overlap = radius - dist;
            newX += (diffX / dist) * overlap;
            newY += (diffY / dist) * overlap;
          }
        }
      }
    }
  }

  // 4. World bounds clamp
  newX = Math.max(radius, Math.min(ARENA_WIDTH - radius, newX));
  newY = Math.max(radius, Math.min(ARENA_HEIGHT - radius, newY));

  return { x: newX, y: newY };
}

/**
 * Resolves static circle penetration against the grid.
 */
export function resolveCircleVsGrid(
  x: number,
  y: number,
  radius: number = PLAYER_RADIUS
): { x: number; y: number } {
  return resolveCircleMovement(x, y, 0, 0, radius);
}

export const MESSAGE_TYPES = {
  INPUT: "input",
} as const;

export const InputPayloadSchema = z.object({
  dx: z.number().min(-1).max(1),
  dy: z.number().min(-1).max(1),
});

export type InputPayload = z.infer<typeof InputPayloadSchema>;
