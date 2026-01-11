import { useState, useEffect } from "react";
import { Play, FolderOpen, Volume2, VolumeX, Terminal, Radiation } from "lucide-react";

interface MainMenuProps {
  onNewGame: () => void;
  onLoadGame: () => void;
  hasSavedGame: boolean;
}

export function MainMenu({ onNewGame, onLoadGame, hasSavedGame }: MainMenuProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [bootSequence, setBootSequence] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  // Terminal boot sequence animation
  useEffect(() => {
    const bootTimer = setInterval(() => {
      setBootSequence((prev) => {
        if (prev >= 4) {
          clearInterval(bootTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(bootTimer);
  }, []);

  // Blinking cursor
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorTimer);
  }, []);

  const bootLines = [
    "VAULT-TEC INDUSTRIES TERMINAL v2.77.4",
    "INITIALIZING SYSTEM...",
    "LOADING WASTELAND REBUILDERS v0.2.0",
    "RADIATION LEVELS: ACCEPTABLE",
    "READY.",
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at center, hsl(120 10% 6%) 0%, hsl(120 8% 3%) 70%, hsl(120 5% 1%) 100%)`
      }}
    >
      {/* CRT scanlines overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-50"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.03) 0px,
            rgba(0, 0, 0, 0.03) 1px,
            transparent 1px,
            transparent 2px
          )`
        }}
      />

      {/* CRT vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.5) 100%)`
        }}
      />

      {/* Animated phosphor glow spots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 rounded-full animate-pulse"
          style={{
            top: '20%',
            left: '30%',
            background: 'radial-gradient(circle, hsl(120 100% 50% / 0.05) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animationDuration: '3s'
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full animate-pulse"
          style={{
            bottom: '30%',
            right: '25%',
            background: 'radial-gradient(circle, hsl(120 100% 50% / 0.08) 0%, transparent 70%)',
            filter: 'blur(30px)',
            animationDuration: '4s',
            animationDelay: '1s'
          }}
        />
      </div>

      {/* Main terminal frame */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        {/* Terminal window */}
        <div 
          className="relative"
          style={{
            background: 'linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)',
            border: '3px solid',
            borderColor: 'hsl(120 40% 25%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 40% 25%)',
            boxShadow: `
              0 0 40px hsl(120 100% 50% / 0.15),
              inset 0 0 60px hsl(120 100% 50% / 0.03),
              0 10px 40px rgba(0, 0, 0, 0.5)
            `
          }}
        >
          {/* Terminal header */}
          <div 
            className="flex items-center justify-between px-4 py-2"
            style={{
              background: 'linear-gradient(90deg, hsl(120 20% 10%) 0%, hsl(120 25% 14%) 50%, hsl(120 20% 10%) 100%)',
              borderBottom: '2px solid hsl(120 30% 20%)'
            }}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" style={{ color: 'hsl(120 100% 60%)' }} />
              <span 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ 
                  color: 'hsl(120 100% 70%)',
                  textShadow: '0 0 10px hsl(120 100% 50% / 0.6)'
                }}
              >
                ROBCO INDUSTRIES (TM) TERMLINK
              </span>
            </div>
            <Radiation 
              className="w-5 h-5 animate-pulse" 
              style={{ 
                color: 'hsl(120 100% 55%)',
                filter: 'drop-shadow(0 0 6px hsl(120 100% 50% / 0.6))'
              }} 
            />
          </div>

          {/* Terminal content */}
          <div className="p-6 space-y-6" style={{ minHeight: '400px' }}>
            {/* Boot sequence text */}
            <div className="space-y-1 font-mono text-sm" style={{ color: 'hsl(120 80% 55%)' }}>
              {bootLines.slice(0, bootSequence + 1).map((line, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2"
                  style={{
                    textShadow: '0 0 8px hsl(120 100% 50% / 0.4)',
                    opacity: i < bootSequence ? 0.6 : 1
                  }}
                >
                  <span style={{ color: 'hsl(120 60% 45%)' }}>&gt;</span>
                  <span>{line}</span>
                  {i === bootSequence && bootSequence < 4 && showCursor && (
                    <span className="inline-block w-2 h-4 ml-1" style={{ background: 'hsl(120 100% 60%)' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Main title - appears after boot */}
            {bootSequence >= 4 && (
              <div className="text-center space-y-4 pt-4 animate-in fade-in duration-500">
                <h1 
                  className="text-5xl md:text-6xl font-bold tracking-widest"
                  style={{ 
                    fontFamily: "'VT323', monospace",
                    color: 'hsl(120 100% 65%)',
                    textShadow: `
                      0 0 10px hsl(120 100% 50% / 0.8),
                      0 0 20px hsl(120 100% 50% / 0.5),
                      0 0 40px hsl(120 100% 50% / 0.3)
                    `
                  }}
                >
                  WASTELAND
                </h1>
                <h2 
                  className="text-2xl md:text-3xl tracking-[0.4em] font-light"
                  style={{ 
                    fontFamily: "'Share Tech Mono', monospace",
                    color: 'hsl(120 80% 55%)',
                    textShadow: '0 0 15px hsl(120 100% 50% / 0.4)'
                  }}
                >
                  REBUILDERS
                </h2>
                
                <p 
                  className="text-sm max-w-md mx-auto mt-6 leading-relaxed"
                  style={{ 
                    color: 'hsl(120 60% 50%)',
                    textShadow: '0 0 5px hsl(120 100% 50% / 0.3)'
                  }}
                >
                  The war is over. The wasteland awaits.
                  <br />
                  Rebuild civilization from the ashes.
                </p>
              </div>
            )}

            {/* Menu buttons - appear after boot */}
            {bootSequence >= 4 && (
              <div className="flex flex-col gap-3 max-w-xs mx-auto pt-6 animate-in slide-in-from-bottom duration-500 delay-200">
                <button
                  onClick={onNewGame}
                  className="fallout-btn w-full flex items-center justify-center gap-3 py-4"
                >
                  <Play className="w-5 h-5" />
                  <span>NEW GAME</span>
                </button>

                {hasSavedGame && (
                  <button
                    onClick={onLoadGame}
                    className="fallout-btn w-full flex items-center justify-center gap-3 py-4"
                    style={{ opacity: 0.9 }}
                  >
                    <FolderOpen className="w-5 h-5" />
                    <span>CONTINUE</span>
                  </button>
                )}

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm uppercase tracking-wider transition-all"
                  style={{ 
                    color: 'hsl(120 50% 45%)',
                    textShadow: '0 0 5px hsl(120 100% 50% / 0.3)'
                  }}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>SOUND OFF</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>SOUND ON</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Terminal footer */}
          <div 
            className="px-4 py-2 flex items-center justify-between text-xs"
            style={{
              background: 'hsl(120 10% 5%)',
              borderTop: '1px solid hsl(120 25% 18%)',
              color: 'hsl(120 50% 40%)'
            }}
          >
            <span>VAULT-TEC APPROVED</span>
            <span>v0.2.0</span>
          </div>
        </div>

        {/* Decorative corner brackets */}
        <div 
          className="absolute -top-2 -left-2 w-8 h-8"
          style={{
            borderLeft: '2px solid hsl(120 60% 40%)',
            borderTop: '2px solid hsl(120 60% 40%)',
            boxShadow: '-2px -2px 10px hsl(120 100% 50% / 0.2)'
          }}
        />
        <div 
          className="absolute -top-2 -right-2 w-8 h-8"
          style={{
            borderRight: '2px solid hsl(120 60% 40%)',
            borderTop: '2px solid hsl(120 60% 40%)',
            boxShadow: '2px -2px 10px hsl(120 100% 50% / 0.2)'
          }}
        />
        <div 
          className="absolute -bottom-2 -left-2 w-8 h-8"
          style={{
            borderLeft: '2px solid hsl(120 60% 40%)',
            borderBottom: '2px solid hsl(120 60% 40%)',
            boxShadow: '-2px 2px 10px hsl(120 100% 50% / 0.2)'
          }}
        />
        <div 
          className="absolute -bottom-2 -right-2 w-8 h-8"
          style={{
            borderRight: '2px solid hsl(120 60% 40%)',
            borderBottom: '2px solid hsl(120 60% 40%)',
            boxShadow: '2px 2px 10px hsl(120 100% 50% / 0.2)'
          }}
        />
      </div>
    </div>
  );
}
