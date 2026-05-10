import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CANVAS_SIZE, 
  CELL_SIZE, 
  COLORS, 
  DIRECTIONS, 
  KEY_MAP, 
  PLAYER_SPEED, 
  TANK_SIZE, 
  BULLET_SPEED, 
  BULLET_SIZE 
} from '../constants';
import { Direction, Entity, GameState, TileType, Bullet, LevelConfig } from '../types';
import { LEVELS } from '../data/levels';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  currentLevel: number;
  onLevelComplete: () => void;
  onGameOver: () => void;
  onScoreUpdate: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  currentLevel, 
  onLevelComplete, 
  onGameOver,
  onScoreUpdate 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  
  // Game State Refs (Mutable for performance)
  const playerRef = useRef<Entity>({
    id: 'player',
    x: 9 * CELL_SIZE + (CELL_SIZE - TANK_SIZE) / 2,
    y: 18 * CELL_SIZE + (CELL_SIZE - TANK_SIZE) / 2,
    width: TANK_SIZE,
    height: TANK_SIZE,
    direction: Direction.UP,
    speed: PLAYER_SPEED,
    color: COLORS.PLAYER,
    type: 'PLAYER',
    isDead: false,
    cooldown: 0
  });
  
  const enemiesRef = useRef<Entity[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const mapRef = useRef<number[][]>([]);
  const enemiesToSpawnRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const activeLevelConfig = useRef<LevelConfig>(LEVELS[0]);

  // Audio Context for simple effects
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = (type: 'shoot' | 'explosion' | 'move') => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }
  };

  // --- Initialization ---
  const initLevel = useCallback(() => {
    const levelIndex = currentLevel - 1;
    if (levelIndex >= LEVELS.length) return;

    const config = LEVELS[levelIndex];
    activeLevelConfig.current = config;
    
    // Deep copy map
    mapRef.current = config.map.map(row => [...row]);
    
    // Reset Player
    playerRef.current = {
      id: 'player',
      x: 8 * CELL_SIZE + (CELL_SIZE - TANK_SIZE) / 2, // Slightly offset
      y: 18 * CELL_SIZE + (CELL_SIZE - TANK_SIZE) / 2,
      width: TANK_SIZE,
      height: TANK_SIZE,
      direction: Direction.UP,
      speed: PLAYER_SPEED,
      color: COLORS.PLAYER,
      type: 'PLAYER',
      isDead: false,
      cooldown: 0
    };

    enemiesRef.current = [];
    bulletsRef.current = [];
    enemiesToSpawnRef.current = config.enemyCount;
    spawnTimerRef.current = 0;
  }, [currentLevel]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      initLevel();
    }
  }, [gameState, currentLevel, initLevel]);

  // --- Helper Functions ---
  const getRect = (entity: Entity | Bullet) => {
    return { x: entity.x, y: entity.y, w: entity.width, h: entity.height };
  };

  const checkCollision = (rect1: any, rect2: any) => {
    return (
      rect1.x < rect2.x + rect2.w &&
      rect1.x + rect1.w > rect2.x &&
      rect1.y < rect2.y + rect2.h &&
      rect1.y + rect1.h > rect2.y
    );
  };

  // Check map collision for an entity
  const checkMapCollision = (entity: Entity | Bullet, nextX: number, nextY: number): boolean => {
    // Canvas boundaries
    if (nextX < 0 || nextX + entity.width > CANVAS_SIZE || nextY < 0 || nextY + entity.height > CANVAS_SIZE) {
      return true;
    }

    // Grid Check
    // We check the 4 corners of the entity against the grid
    const corners = [
      { x: nextX, y: nextY },
      { x: nextX + entity.width - 1, y: nextY },
      { x: nextX, y: nextY + entity.height - 1 },
      { x: nextX + entity.width - 1, y: nextY + entity.height - 1 },
    ];

    for (const corner of corners) {
      const cX = Math.floor(corner.x / CELL_SIZE);
      const cY = Math.floor(corner.y / CELL_SIZE);
      
      if (cY >= 0 && cY < 20 && cX >= 0 && cX < 20) {
        const tile = mapRef.current[cY][cX];
        // Water blocks tanks but not bullets. Steel/Brick block both (bullets handle destroy separately)
        if (tile === TileType.STEEL || tile === TileType.BRICK || tile === TileType.BASE) {
             return true;
        }
        // Tanks cannot cross water
        if ('type' in entity && tile === TileType.WATER) {
            return true;
        }
      }
    }
    return false;
  };

  const spawnEnemy = () => {
    const spawnPoints = [{x: 0, y: 0}, {x: 10, y: 0}, {x: 19, y: 0}];
    const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    const x = point.x * CELL_SIZE + (CELL_SIZE - TANK_SIZE) / 2;
    const y = point.y * CELL_SIZE + (CELL_SIZE - TANK_SIZE) / 2;

    // Check if spawn point is clear
    const isBlocked = enemiesRef.current.some(e => checkCollision({x, y, w: TANK_SIZE, h: TANK_SIZE}, getRect(e))) || 
                      checkCollision({x, y, w: TANK_SIZE, h: TANK_SIZE}, getRect(playerRef.current));
    
    if (!isBlocked) {
      enemiesRef.current.push({
        id: `enemy_${Date.now()}`,
        x,
        y,
        width: TANK_SIZE,
        height: TANK_SIZE,
        direction: Direction.DOWN,
        speed: activeLevelConfig.current.enemySpeed,
        color: Math.random() > 0.5 ? COLORS.ENEMY_TIER_1 : COLORS.ENEMY_TIER_2,
        type: 'ENEMY',
        isDead: false,
        cooldown: 60 // Initial delay
      });
      enemiesToSpawnRef.current--;
    }
  };

  // --- Game Loop Update ---
  const update = () => {
    if (gameState !== GameState.PLAYING) return;
    
    frameCountRef.current++;

    // 1. Player Movement
    const player = playerRef.current;
    if (!player.isDead) {
        let dx = 0;
        let dy = 0;
        let newDir = player.direction;
        let isMoving = false;

        if (keysPressed.current.has(Direction.UP)) { dy = -player.speed; newDir = Direction.UP; isMoving = true; }
        else if (keysPressed.current.has(Direction.DOWN)) { dy = player.speed; newDir = Direction.DOWN; isMoving = true; }
        else if (keysPressed.current.has(Direction.LEFT)) { dx = -player.speed; newDir = Direction.LEFT; isMoving = true; }
        else if (keysPressed.current.has(Direction.RIGHT)) { dx = player.speed; newDir = Direction.RIGHT; isMoving = true; }

        if (isMoving) {
            // Align to grid when turning
            if (newDir !== player.direction) {
               // Simple snap to nearest cell center axis if turning 90 degrees
               // This is a simplified mechanic compared to original Battle City which had complex sliding
               const centerX = Math.floor((player.x + player.width/2) / CELL_SIZE) * CELL_SIZE + (CELL_SIZE - player.width)/2;
               const centerY = Math.floor((player.y + player.height/2) / CELL_SIZE) * CELL_SIZE + (CELL_SIZE - player.height)/2;
               
               if (newDir === Direction.UP || newDir === Direction.DOWN) {
                   player.x = centerX; // Snap X
               } else {
                   player.y = centerY; // Snap Y
               }
            }

            player.direction = newDir;
            if (!checkMapCollision(player, player.x + dx, player.y + dy)) {
                // Also check tank-tank collision
                let tankCollision = false;
                for (const enemy of enemiesRef.current) {
                    if (checkCollision({...getRect(player), x: player.x + dx, y: player.y + dy}, getRect(enemy))) {
                        tankCollision = true;
                        break;
                    }
                }
                if (!tankCollision) {
                    player.x += dx;
                    player.y += dy;
                }
            }
        }

        // Player Shooting
        if (keysPressed.current.has('SHOOT')) {
            if (player.cooldown <= 0) {
                bulletsRef.current.push({
                    id: `b_${Date.now()}`,
                    x: player.x + player.width / 2 - BULLET_SIZE / 2,
                    y: player.y + player.height / 2 - BULLET_SIZE / 2,
                    width: BULLET_SIZE,
                    height: BULLET_SIZE,
                    direction: player.direction,
                    speed: BULLET_SPEED,
                    owner: 'PLAYER'
                });
                player.cooldown = 30; // Reload time
                playSound('shoot');
            }
        }
        if (player.cooldown > 0) player.cooldown--;
    }

    // 2. Enemy Logic (Simple AI)
    // Spawning
    if (enemiesToSpawnRef.current > 0) {
        spawnTimerRef.current++;
        if (spawnTimerRef.current > 120) { // Spawn every ~2 seconds if needed
            spawnEnemy();
            spawnTimerRef.current = 0;
        }
    } else if (enemiesRef.current.length === 0 && !player.isDead) {
        // Victory Condition
        onLevelComplete();
        return;
    }

    enemiesRef.current.forEach(enemy => {
        if (enemy.isDead) return;

        // Move
        let dx = 0; let dy = 0;
        if (enemy.direction === Direction.UP) dy = -enemy.speed;
        if (enemy.direction === Direction.DOWN) dy = enemy.speed;
        if (enemy.direction === Direction.LEFT) dx = -enemy.speed;
        if (enemy.direction === Direction.RIGHT) dx = enemy.speed;

        let moved = false;
        if (!checkMapCollision(enemy, enemy.x + dx, enemy.y + dy)) {
             // Check collision with player
             if (!checkCollision({...getRect(enemy), x: enemy.x + dx, y: enemy.y + dy}, getRect(player))) {
                 // Check collision with other enemies
                 const hitOther = enemiesRef.current.some(other => other !== enemy && checkCollision({...getRect(enemy), x: enemy.x + dx, y: enemy.y + dy}, getRect(other)));
                 if (!hitOther) {
                    enemy.x += dx;
                    enemy.y += dy;
                    moved = true;
                 }
             }
        }

        // Change direction if blocked or randomly
        if (!moved || Math.random() < 0.02) {
            enemy.direction = DIRECTIONS[Math.floor(Math.random() * 4)];
        }

        // Shoot randomly
        if (enemy.cooldown <= 0) {
            // Simple raycast check to see if shooting is worth it? Nah, just random for arcade feel.
            if (Math.random() < 0.05) { // Chance to shoot per frame
                bulletsRef.current.push({
                    id: `eb_${enemy.id}_${Date.now()}`,
                    x: enemy.x + enemy.width / 2 - BULLET_SIZE / 2,
                    y: enemy.y + enemy.height / 2 - BULLET_SIZE / 2,
                    width: BULLET_SIZE,
                    height: BULLET_SIZE,
                    direction: enemy.direction,
                    speed: BULLET_SPEED,
                    owner: 'ENEMY'
                });
                enemy.cooldown = activeLevelConfig.current.enemyFireRate;
            }
        } else {
            enemy.cooldown--;
        }
    });

    // 3. Bullet Logic
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        let bx = b.x;
        let by = b.y;

        if (b.direction === Direction.UP) by -= b.speed;
        if (b.direction === Direction.DOWN) by += b.speed;
        if (b.direction === Direction.LEFT) bx -= b.speed;
        if (b.direction === Direction.RIGHT) bx += b.speed;

        b.x = bx;
        b.y = by;

        // Screen Bounds
        if (bx < 0 || bx > CANVAS_SIZE || by < 0 || by > CANVAS_SIZE) {
            bulletsRef.current.splice(i, 1);
            continue;
        }

        // Map Collision (Destruction)
        // Check center point of bullet
        const cx = bx + b.width/2;
        const cy = by + b.height/2;
        const colX = Math.floor(cx / CELL_SIZE);
        const colY = Math.floor(cy / CELL_SIZE);

        if (colX >= 0 && colX < 20 && colY >= 0 && colY < 20) {
            const tile = mapRef.current[colY][colX];
            if (tile === TileType.BRICK) {
                mapRef.current[colY][colX] = TileType.EMPTY; // Destroy brick
                bulletsRef.current.splice(i, 1);
                playSound('explosion');
                continue;
            } else if (tile === TileType.STEEL) {
                bulletsRef.current.splice(i, 1); // Steel stops bullet
                playSound('shoot'); // Clink sound
                continue;
            } else if (tile === TileType.BASE) {
                mapRef.current[colY][colX] = TileType.EMPTY; // Destroy base
                playerRef.current.isDead = true; // Game Over
                bulletsRef.current.splice(i, 1);
                onGameOver();
                continue;
            }
        }

        // Bullet vs Entity Collision
        let hit = false;
        if (b.owner === 'PLAYER') {
            for (let eIdx = enemiesRef.current.length - 1; eIdx >= 0; eIdx--) {
                const enemy = enemiesRef.current[eIdx];
                if (checkCollision(getRect(b), getRect(enemy))) {
                    enemiesRef.current.splice(eIdx, 1);
                    bulletsRef.current.splice(i, 1);
                    onScoreUpdate(100);
                    playSound('explosion');
                    hit = true;
                    break;
                }
            }
        } else { // Enemy bullet
             if (checkCollision(getRect(b), getRect(playerRef.current))) {
                 playerRef.current.isDead = true;
                 bulletsRef.current.splice(i, 1);
                 onGameOver();
                 hit = true;
             }
        }
        
        // Bullet vs Bullet (optional, classic mechanic)
        if(!hit) {
           for(let j=0; j<bulletsRef.current.length; j++) {
              if(i!==j && bulletsRef.current[j].owner !== b.owner) {
                 if(checkCollision(getRect(b), getRect(bulletsRef.current[j]))) {
                     bulletsRef.current.splice(Math.max(i,j), 1);
                     bulletsRef.current.splice(Math.min(i,j), 1);
                     hit = true;
                     break;
                 }
              }
           }
        }
    }
  };

  // --- Render Loop ---
  const draw = (ctx: CanvasRenderingContext2D) => {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Slight grid on floor for tactical look
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let i=0; i<=CANVAS_SIZE; i+=CELL_SIZE) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
    }

    // Map
    mapRef.current.forEach((row, y) => {
      row.forEach((tile, x) => {
        const pX = x * CELL_SIZE;
        const pY = y * CELL_SIZE;
        
        if (tile === TileType.BRICK) {
          ctx.fillStyle = '#b45309'; // Darker brick
          ctx.fillRect(pX + 1, pY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          ctx.fillStyle = '#d97706'; // Lighter Brick
          ctx.fillRect(pX + 4, pY + 4, CELL_SIZE - 8, CELL_SIZE/2 - 4);
        } else if (tile === TileType.STEEL) {
          ctx.fillStyle = '#475569'; // Dark slate
          ctx.fillRect(pX, pY, CELL_SIZE, CELL_SIZE);
          ctx.fillStyle = '#94a3b8'; // Shine
          ctx.fillRect(pX + 4, pY + 4, CELL_SIZE/2, CELL_SIZE/2);
          ctx.strokeStyle = '#e2e8f0';
          ctx.strokeRect(pX+2, pY+2, CELL_SIZE-4, CELL_SIZE-4);
        } else if (tile === TileType.WATER) {
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(pX, pY, CELL_SIZE, CELL_SIZE);
        } else if (tile === TileType.GRASS) {
          // Drawn later on top
        } else if (tile === TileType.BASE) {
           // Eagle Base
           ctx.fillStyle = COLORS.BASE;
           ctx.beginPath();
           ctx.moveTo(pX + CELL_SIZE/2, pY);
           ctx.lineTo(pX + CELL_SIZE, pY + CELL_SIZE);
           ctx.lineTo(pX, pY + CELL_SIZE);
           ctx.fill();
           // Eye
           ctx.fillStyle = '#fff';
           ctx.fillRect(pX + 12, pY + 12, 8, 8);
        }
      });
    });

    // Entities
    const drawTank = (t: Entity) => {
        ctx.fillStyle = t.color;
        // Main body
        ctx.fillRect(t.x, t.y, t.width, t.height);
        // Tracks
        ctx.fillStyle = '#000';
        if (t.direction === Direction.UP || t.direction === Direction.DOWN) {
            ctx.fillRect(t.x, t.y, 4, t.height);
            ctx.fillRect(t.x + t.width - 4, t.y, 4, t.height);
        } else {
            ctx.fillRect(t.x, t.y, t.width, 4);
            ctx.fillRect(t.x, t.y + t.height - 4, t.width, 4);
        }
        // Turret / Barrel
        ctx.fillStyle = '#fff';
        const cx = t.x + t.width/2;
        const cy = t.y + t.height/2;
        const bLen = 14;
        ctx.beginPath();
        if (t.direction === Direction.UP) ctx.rect(cx - 2, cy - bLen, 4, bLen);
        if (t.direction === Direction.DOWN) ctx.rect(cx - 2, cy, 4, bLen);
        if (t.direction === Direction.LEFT) ctx.rect(cx - bLen, cy - 2, bLen, 4);
        if (t.direction === Direction.RIGHT) ctx.rect(cx, cy - 2, bLen, 4);
        ctx.fill();
    };

    if (!playerRef.current.isDead) drawTank(playerRef.current);
    enemiesRef.current.forEach(drawTank);

    // Bullets
    bulletsRef.current.forEach(b => {
        ctx.fillStyle = b.owner === 'PLAYER' ? '#facc15' : '#f87171';
        ctx.beginPath();
        ctx.arc(b.x + b.width/2, b.y + b.height/2, b.width/2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Grass Overlay (Top layer)
    mapRef.current.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (tile === TileType.GRASS) {
                ctx.fillStyle = COLORS.GRASS;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.globalAlpha = 1.0;
            }
        });
    });
  };

  // --- Main Loop ---
  const loop = useCallback(() => {
    update();
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            draw(ctx);
        }
    }
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (KEY_MAP[e.key]) {
            if (KEY_MAP[e.key] === 'PAUSE') {
                setGameState(gameState === GameState.PAUSED ? GameState.PLAYING : GameState.PAUSED);
            } else {
                keysPressed.current.add(KEY_MAP[e.key]);
            }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (KEY_MAP[e.key]) {
            keysPressed.current.delete(KEY_MAP[e.key]);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, setGameState]);

  return (
    <div className="relative bg-black overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 border-zinc-800 rounded-md">
       {/* CRT Overlay inside the canvas container */}
       <div className="absolute inset-0 crt-overlay z-10 pointer-events-none"></div>
       <div className="scan-bar z-20 pointer-events-none"></div>
       
       <canvas 
         ref={canvasRef} 
         width={CANVAS_SIZE} 
         height={CANVAS_SIZE} 
         className="block relative z-0"
       />
    </div>
  );
};

export default GameCanvas;