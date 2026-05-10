import { TileType, LevelConfig } from "../types";

// Helper to create a row
const R = (str: string): number[] => {
  return str.split('').map(c => parseInt(c));
};

// 0: Empty, 1: Brick, 2: Steel, 3: Water, 4: Grass, 9: Base
const createMap = (pattern: string[]): number[][] => {
  return pattern.map(rowStr => R(rowStr));
};

const BASE_MAP_TEMPLATE = [
  "00000000000000000000",
  "00000000000000000000",
  "01010101010101010100",
  "01010101010101010100",
  "01010102010102010100",
  "01010102010102010100",
  "01010101000001010100",
  "00000000000000000000",
  "00000033300333000000",
  "00000033300333000000",
  "01010000000000001010",
  "01010000000000001010",
  "01010101222201010100",
  "00000000000000000000",
  "00010000000000001000",
  "00010000000000001000",
  "01010100000000101010",
  "01010100111100101010",
  "00000000191000000000", // Base at bottom center (191 protection)
  "00000000111000000000"
];

// Simple function to generate varied maps based on the template but modifying blocks
const generateLevel = (level: number): LevelConfig => {
  // Clone template
  let map = BASE_MAP_TEMPLATE.map(row => row.split('').map(Number));
  
  // Modify map based on level to add difficulty
  if (level > 1) {
    // Add more steel as levels progress
    for (let y = 2; y < 10; y += 2) {
       for (let x = 2; x < 18; x+= 3) {
          if (level % 3 === 0) map[y][x] = TileType.STEEL;
          if (level > 5 && x % 2 === 0) map[y][x] = TileType.WATER;
       }
    }
  }

  if (level > 4) {
      // Add forest cover
      for(let y=5; y<15; y++) {
          map[y][5] = TileType.GRASS;
          map[y][14] = TileType.GRASS;
      }
  }

  if (level === 10) {
      // Boss level - Lots of steel fortress
      for(let y=5; y<15; y++) {
          map[y][10] = TileType.STEEL;
          map[y][9] = TileType.STEEL;
      }
  }

  return {
    levelNumber: level,
    map: map,
    enemyCount: 4 + Math.floor(level * 1.5), // Increasing enemies
    enemySpeed: level > 5 ? 1.5 : 1,
    enemyFireRate: Math.max(30, 120 - (level * 8)), // Faster shooting
  };
};

export const LEVELS: LevelConfig[] = Array.from({ length: 10 }, (_, i) => generateLevel(i + 1));
