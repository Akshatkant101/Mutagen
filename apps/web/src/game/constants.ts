// Kenney Tiny Dungeon (16x16 frames, 12 columns x 11 rows = 132 frames)
// Inspected and verified from official Kenney sample map
export const DUNGEON_FRAMES = {
  // Characters (Rows 7 and 8)
  HERO_KNIGHT: 96,
  HERO_WARRIOR: 85,
  HERO_WIZARD: 84,
  HERO_ROGUE: 98,

  // Floor: Clean warm sand matching the Kenney Tiny Dungeon sample
  FLOOR_SAND: 48, // Clean sand floor (92%)
  FLOOR_SAND_PEBBLE: 49, // Subtle tiny pebble variant (6%)
  FLOOR_SAND_DOT: 50, // Subtle dot variant (2%)
  DECAL_COBBLE: 30, // 4-square cobblestone paving patch

  // Wall Masonry (exact Kenney sample map pieces)
  WALL_CAP_LEFT: 36, // Top-left stone cap
  WALL_CAP_MID: 37, // Horizontal stone top capping
  WALL_CAP_RIGHT: 38, // Top-right stone cap
  WALL_FACE_GREY: 40, // Front facing grey stone bricks
  WALL_FACE_ALT: 14, // Alternate front facing stone bricks
  WALL_SIDE_LEFT: 57, // Left vertical stone wall with dark border
  WALL_SIDE_RIGHT: 59, // Right vertical stone wall with dark border

  // Wall Fixtures & Statues
  STATUE_GARGOYLE: 18, // Ancient carved stone gargoyle head (clean masonry, no liquid)
  PROP_TORCH: 129, // Lit ember flame torch

  // Wall-adjacent Decorative Props (strictly along perimeter walls, center clear)
  PROP_URN: 73, // Clay urn / pot
  PROP_TOMBSTONE_CROSS: 64, // Stone tombstone cross
  PROP_TOMBSTONE_ROUND: 65, // Round stone tombstone
  PROP_BARREL: 70, // Wooden barrel
  PROP_BONES: 66, // Skeleton skull and bones decal
} as const;

export const TILE_SIZE = 16;
export const TILE_SCALE = 2; // 1 tile = 32 world units
export const WORLD_TILE_SIZE = TILE_SIZE * TILE_SCALE; // 32

// Scene Render Depths
export const RENDER_DEPTH = {
  VOID: 0,
  FLOOR: 1,
  BOSS_DECAL: 2,
  FLOOR_DECAL: 3,
  WALL: 5,
  PROP: 10,
  STATUE: 12,
  TORCH: 14,
  TORCH_GLOW: 15,
  PLAYER: 20,
  VIGNETTE: 30,
} as const;
