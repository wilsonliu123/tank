import React, { useState } from 'react';
import { 
  Shield, 
  Crosshair, 
  Trophy, 
  Terminal, 
  Play, 
  AlertTriangle, 
  Cpu, 
  Activity 
} from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { GameState, BriefingData } from './types';
import { generateMissionBriefing } from './services/geminiService';
import { LEVELS } from './data/levels';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);

  // Load Briefing
  const startLevelBriefing = async (level: number) => {
    setGameState(GameState.BRIEFING);
    setIsLoadingBriefing(true);
    try {
      const enemyCount = LEVELS[level - 1]?.enemyCount || 5;
      const data = await generateMissionBriefing(level, enemyCount);
      setBriefing(data);
    } catch (e) {
      setBriefing({ title: "System Error", content: "Proceed with caution. Communications compromised." });
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  const handleStartGame = () => {
    setCurrentLevel(1);
    setScore(0);
    startLevelBriefing(1);
  };

  const handleStartLevel = () => {
    setGameState(GameState.PLAYING);
  };

  const handleLevelComplete = () => {
    if (currentLevel >= 10) {
      setGameState(GameState.ALL_CLEARED);
    } else {
      setCurrentLevel(p => p + 1);
      startLevelBriefing(currentLevel + 1);
    }
  };

  const handleGameOver = () => {
    setGameState(GameState.GAME_OVER);
  };

  return (
    <div className="min-h-screen bg-grid flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-0 pointer-events-none" />
      
      {/* Header */}
      <header className="w-full max-w-6xl flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-900/30 border border-green-500/50 rounded box-glow">
            <Cpu className="text-green-400" size={32} />
          </div>
          <div>
             <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter font-retro text-glow">
               NEON TANK
             </h1>
             <div className="flex items-center gap-2 text-cyan-400 text-xs tracking-[0.3em] font-bold">
                <span className="animate-pulse">●</span> SYSTEM ONLINE
             </div>
          </div>
        </div>
        <div className="hidden md:block text-right">
           <div className="text-xs text-gray-500 font-mono mb-1">CURRENT OPERATION</div>
           <div className="text-xl text-white font-term border-b border-gray-700 pb-1">
             {gameState === GameState.PLAYING ? `LEVEL ${currentLevel} ACTIVE` : 'STANDBY'}
           </div>
        </div>
      </header>

      <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-8 z-10">
        
        {/* Left Panel: Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Decor Borders */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-cyan-500 z-20" />
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-cyan-500 z-20" />
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-cyan-500 z-20" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-cyan-500 z-20" />

          <div className="relative w-fit box-glow">
            <GameCanvas 
              gameState={gameState}
              setGameState={setGameState}
              currentLevel={currentLevel}
              onLevelComplete={handleLevelComplete}
              onGameOver={handleGameOver}
              onScoreUpdate={(pts) => setScore(s => s + pts)}
            />
            
            {/* Menu Overlay */}
            {gameState === GameState.MENU && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 z-30">
                <div className="border-2 border-green-500/30 p-8 bg-black/90 box-glow rounded-lg max-w-md w-full">
                   <h2 className="text-2xl text-green-400 font-bold mb-2 font-retro">COMMAND CENTER</h2>
                   <p className="text-gray-400 mb-8 font-term text-lg">
                     &gt; INITIALIZE COMBAT PROTOCOLS<br/>
                     &gt; DESTROY ALL HOSTILES
                   </p>
                   <button 
                     onClick={handleStartGame}
                     className="group relative w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-black py-4 font-bold text-xl transition-all hover:tracking-wider clip-path-button"
                   >
                     <Play size={24} className="fill-black group-hover:scale-110 transition-transform" /> 
                     <span>ENGAGE</span>
                     <div className="absolute inset-0 border border-white/20 pointer-events-none" />
                   </button>
                </div>
              </div>
            )}

            {/* Briefing Overlay */}
            {gameState === GameState.BRIEFING && (
              <div className="absolute inset-0 bg-black z-30 flex flex-col p-1">
                 <div className="flex-1 border border-green-800 bg-zinc-900/95 p-8 flex flex-col relative overflow-hidden">
                    {/* Scan line decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_15px_#0f0]" />
                    
                    <div className="flex items-center gap-3 text-green-400 mb-8 border-b border-green-800/50 pb-4">
                       <Terminal size={28} />
                       <span className="font-retro text-lg">ENCRYPTED TRANSMISSION</span>
                    </div>
                    
                    {isLoadingBriefing ? (
                      <div className="flex-1 flex items-center justify-center flex-col gap-4">
                         <div className="relative">
                            <div className="w-16 h-16 border-4 border-green-900 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                         </div>
                         <p className="text-green-400 animate-pulse font-term text-xl">DECRYPTING TACTICAL DATA...</p>
                         <div className="w-48 h-1 bg-green-900 rounded overflow-hidden mt-2">
                            <div className="h-full bg-green-500 animate-pulse w-2/3"></div>
                         </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="mb-6">
                           <div className="text-xs text-green-600 font-bold mb-1">OPERATION CODENAME</div>
                           <h2 className="text-3xl text-white font-bold uppercase tracking-wide font-retro text-glow-green">{briefing?.title}</h2>
                        </div>
                        <div className="flex-1 relative">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-800" />
                           <p className="text-green-300 font-term text-2xl leading-relaxed pl-6">
                             {briefing?.content}
                           </p>
                        </div>
                        <div className="mt-8">
                          <button 
                            onClick={handleStartLevel}
                            className="w-full bg-transparent border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-black py-4 font-bold text-xl tracking-widest font-retro transition-colors box-glow"
                          >
                            ACKNOWLEDGE & DEPLOY
                          </button>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {/* Game Over Overlay */}
            {gameState === GameState.GAME_OVER && (
              <div className="absolute inset-0 bg-red-950/90 z-30 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm border-4 border-red-600">
                <AlertTriangle size={80} className="text-red-500 mb-6 animate-bounce" />
                <h2 className="text-6xl font-bold text-white mb-2 font-retro text-shadow-red">KIA</h2>
                <p className="text-red-300 mb-8 font-term text-2xl tracking-widest">MISSION FAILED</p>
                <button onClick={() => setGameState(GameState.MENU)} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded font-retro text-sm transition-colors">
                  RETURN TO BASE
                </button>
              </div>
            )}

            {/* Victory Overlay */}
            {gameState === GameState.ALL_CLEARED && (
              <div className="absolute inset-0 bg-yellow-950/90 z-30 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm border-4 border-yellow-500">
                <Trophy size={80} className="text-yellow-400 mb-6" />
                <h2 className="text-5xl font-bold text-white mb-4 font-retro text-glow">VICTORY</h2>
                <div className="bg-black/50 p-6 rounded border border-yellow-700 mb-8 w-full max-w-sm">
                    <p className="text-yellow-500 text-sm font-bold mb-2">FINAL SCORE</p>
                    <p className="text-4xl text-white font-mono">{score}</p>
                </div>
                <button onClick={() => setGameState(GameState.MENU)} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded font-retro text-sm transition-colors">
                  PLAY AGAIN
                </button>
              </div>
            )}
            
            {/* Pause Overlay */}
            {gameState === GameState.PAUSED && (
               <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
                  <div className="border-y-2 border-white w-full py-4 text-center bg-black/50">
                     <h2 className="text-4xl text-white font-bold tracking-[0.5em] font-retro animate-pulse">PAUSED</h2>
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Right Panel: HUD */}
        <div className="w-full lg:w-80 flex flex-col gap-6 z-10">
          {/* Status Panel */}
          <div className="bg-black/80 backdrop-blur border border-zinc-700 p-1 relative overflow-hidden rounded-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="p-5">
               <h3 className="text-cyan-500 text-xs font-bold mb-4 flex items-center gap-2 tracking-widest">
                  <Activity size={14} /> UNIT STATUS
               </h3>
               
               <div className="space-y-4">
                 <div className="bg-zinc-900/80 border-l-4 border-yellow-500 p-3 flex justify-between items-center">
                    <div className="text-gray-400 text-xs font-bold">LEVEL</div>
                    <div className="text-2xl text-white font-term">{currentLevel.toString().padStart(2, '0')}</div>
                 </div>

                 <div className="bg-zinc-900/80 border-l-4 border-green-500 p-3 flex justify-between items-center">
                    <div className="text-gray-400 text-xs font-bold">SCORE</div>
                    <div className="text-2xl text-white font-term">{score.toString().padStart(6, '0')}</div>
                 </div>

                 <div className="bg-zinc-900/80 border-l-4 border-red-500 p-3 flex justify-between items-center">
                    <div className="text-gray-400 text-xs font-bold">THREATS</div>
                    <div className="text-white font-term flex gap-1">
                       {/* Visual bars for threats */}
                       {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-2 h-4 ${i < 3 ? 'bg-red-500' : 'bg-red-900'}`} />
                       ))}
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-black/80 backdrop-blur border border-zinc-700 flex-1 rounded-lg p-6 relative">
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-zinc-500" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-zinc-500" />
            
            <h3 className="text-zinc-500 text-xs font-bold mb-6 tracking-widest">MANUAL OVERRIDE</h3>
            
            <div className="grid grid-cols-1 gap-3">
               <div className="flex items-center justify-between text-sm text-gray-300 font-term border-b border-zinc-800 pb-2">
                  <span>MOVEMENT</span>
                  <span className="text-cyan-400">WASD / ARROWS</span>
               </div>
               <div className="flex items-center justify-between text-sm text-gray-300 font-term border-b border-zinc-800 pb-2">
                  <span>MAIN CANNON</span>
                  <span className="text-cyan-400">SPACE</span>
               </div>
               <div className="flex items-center justify-between text-sm text-gray-300 font-term border-b border-zinc-800 pb-2">
                  <span>PAUSE</span>
                  <span className="text-cyan-400">ESC</span>
               </div>
            </div>

            <div className="mt-8 p-4 bg-green-950/30 border border-green-900 rounded">
               <div className="text-[10px] text-green-600 font-bold mb-1">TACTICAL ADVISOR AI</div>
               <p className="text-green-400 font-term text-sm leading-tight">
                 Target unstable brick structures to create firing lanes. Steel fortifications require higher caliber weaponry.
               </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer decoration */}
      <div className="fixed bottom-4 left-8 text-[10px] text-zinc-700 font-mono hidden lg:block">
         SYS.VER.2.5.0 // CONNECTION STABLE
      </div>
    </div>
  );
};

export default App;