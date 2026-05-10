import { Direction } from "./types";

export const CELL_SIZE = 32;
export const GRID_SIZE = 20; // 20x20 grid
export const CANVAS_SIZE = CELL_SIZE * GRID_SIZE;

export const PLAYER_SPEED = 3; // Pixels per frame
export const BULLET_SPEED = 6;
export const TANK_SIZE = 28; // Slightly smaller than cell to allow movement
export const BULLET_SIZE = 6;

export const DIRECTIONS = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];

export const COLORS = {
  PLAYER: '#4ade80', // Tailwind green-400
  ENEMY_TIER_1: '#f87171', // Tailwind red-400
  ENEMY_TIER_2: '#e879f9', // Tailwind fuchsia-400
  BULLET: '#facc15', // Yellow
  BRICK: '#a16207', // Brown
  STEEL: '#94a3b8', // Slate
  WATER: '#3b82f6', // Blue
  GRASS: '#166534', // Green
  BASE: '#d946ef', // Magenta
  BACKGROUND: '#000000',
};

export const KEY_MAP: Record<string, string> = {
  ArrowUp: Direction.UP,
  ArrowDown: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
  ArrowRight: Direction.RIGHT,
  w: Direction.UP,
  s: Direction.DOWN,
  a: Direction.LEFT,
  d: Direction.RIGHT,
  ' ': 'SHOOT',
  Enter: 'START',
  Escape: 'PAUSE',
};
