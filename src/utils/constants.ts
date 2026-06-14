/**
 * Central place for gameplay-tuning constants.
 * Keeping these in one file makes balancing the game much easier.
 */

export const GAME = {
  /** Initial forward speed of the player (units / second). */
  INITIAL_SPEED: 18,
  /** Hard cap on forward speed. */
  MAX_SPEED: 60,
  /** Acceleration applied every second while alive. */
  SPEED_RAMP: 0.35,
  /** How much a booster increases speed (multiplicative). */
  BOOST_MULTIPLIER: 1.6,
  /** Time a boost lasts, in seconds. */
  BOOST_DURATION: 1.8,

  /** Player's lateral movement speed (units / second). */
  LATERAL_SPEED: 6.5,
  /** Maximum lateral offset from the slide center. */
  LATERAL_LIMIT: 2.2,

  /** Points awarded per meter travelled. */
  SCORE_PER_METER: 1,
  /** Points awarded per coin. */
  COIN_VALUE: 25,
} as const;

export const SLIDE = {
  /** Radius of the slide tube cross-section. */
  TUBE_RADIUS: 3.2, // Increased for better proportions
  /** Number of chunks to keep alive ahead of the player. */
  LOOK_AHEAD_CHUNKS: 8,
  /** Number of chunks to keep behind the player before culling. */
  LOOK_BEHIND_CHUNKS: 2,
  /** Approximate length of a single chunk in world units. */
  CHUNK_LENGTH: 50, // Increased for smoother curves
  /** Tubular segments used per chunk. */
  TUBE_TUBULAR_SEGMENTS: 36, // Reduced from 64 for performance
  /** Radial segments of the tube cross-section. */
  TUBE_RADIAL_SEGMENTS: 10, // Reduced for performance
  /** Palette of bright "water park" colors used for chunks. */
  PALETTE: [
    '#ff5e8a',
    '#ffae00',
    '#1ad1f2',
    '#7cffb2',
    '#b181ff',
    '#ffd166',
  ],
  /** Length of a special Fork chunk. */
  FORK_CHUNK_LENGTH: 70,
} as const;

export const PLAYER = {
  /** Radius of the player ball. */
  RADIUS: 0.55,
  /** Ball color. */
  COLOR: '#ffffff',
  /** Emissive intensity for a subtle glow. */
  EMISSIVE_INTENSITY: 0.25,
} as const;

export const CAMERA = {
  /** Offset from the player (right, up, back). */
  OFFSET: { x: 0, y: 3.5, z: -8 },
  /** How far ahead of the player the camera looks. */
  LOOK_AHEAD: 6,
  /** Smoothing factor for position interpolation (higher = snappier). */
  POSITION_SMOOTH: 6,
  /** Smoothing factor for rotation / lookAt interpolation. */
  ROTATION_SMOOTH: 8,
} as const;

export const ENTITY = {
  /** Radius of the coin bounding sphere. */
  COIN_RADIUS: 0.45,
  /** Radius of the obstacle bounding sphere. */
  OBSTACLE_RADIUS: 0.8,
  /** Radius of the booster bounding sphere. */
  BOOSTER_RADIUS: 1.2,
  
  /** 
   * Multiplier for collision checks. 
   * A value < 1 makes collisions more forgiving (better for game feel).
   */
  FORGIVENESS: 0.85, 
  
  /** How far left/right entities can spawn from the center. */
  LANE_WIDTH: 1.6,
  
  /** Duration of the speed boost in milliseconds. */
  BOOST_DURATION_MS: 2500,
} as const;

export const DIFFICULTY = {
  /** How much speed increases per second. */
  SPEED_RAMP: 0.15,
  /** Maximum speed cap. */
  MAX_SPEED: 45,
  /** Base chance to spawn an obstacle (0 to 1). */
  BASE_OBSTACLE_CHANCE: 0.15,
  /** How much obstacle chance increases per chunk. */
  OBSTACLE_RAMP: 0.005,
  /** Max obstacle chance cap. */
  MAX_OBSTACLE_CHANCE: 0.6,
} as const;

