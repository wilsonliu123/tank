export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum TileType {
  EMPTY = 0,
  BRICK = 1,
  STEEL = 2,
  WATER = 3,
  GRASS = 4, // Visual cover
  BASE = 9,
}

export enum GameState {
  MENU = 'MENU',
  BRIEFING = 'BRIEFING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  ALL_CLEARED = 'ALL_CLEARED',
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  speed: number;
  color: string;
  type: 'PLAYER' | 'ENEMY';
  isDead: boolean;
  cooldown: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  speed: number;
  owner: 'PLAYER' | 'ENEMY';
}

export interface LevelConfig {
  levelNumber: number;
  map: number[][]; // 20x20 grid
  enemyCount: number;
  enemySpeed: number;
  enemyFireRate: number; // Higher is slower (frames)
}

export interface BriefingData {
  title: string;
  content: string;
}
