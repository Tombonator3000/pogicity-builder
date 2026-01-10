import { useState } from "react";
import { Play, FolderOpen, Settings, Radiation, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainMenuProps {
  onNewGame: () => void;
  onLoadGame: () => void;
  hasSavedGame: boolean;
}

export function MainMenu({ onNewGame, onLoadGame, hasSavedGame }: MainMenuProps) {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-wasteland-dark via-wasteland-bg to-wasteland-dark">
      {/* Animated background radiation particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-radiation/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-radiation/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full bg-amber/5 blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Logo/Title */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Radiation className="w-12 h-12 text-radiation animate-pulse" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-wider text-amber drop-shadow-[0_0_30px_rgba(243,156,18,0.3)]">
            WASTELAND
          </h1>
          <h2 className="text-3xl md:text-4xl font-light tracking-[0.3em] text-amber/80">
            REBUILDERS
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto mt-4">
            Rebuild civilization from the ashes. Manage resources, protect survivors, and reclaim the wasteland.
          </p>
        </div>

        {/* Menu buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs mt-8">
          <Button
            onClick={onNewGame}
            size="lg"
            className="w-full h-14 text-lg bg-amber hover:bg-amber/90 text-wasteland-dark font-bold tracking-wide shadow-lg shadow-amber/20 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 mr-2" />
            NEW GAME
          </Button>

          {hasSavedGame && (
            <Button
              onClick={onLoadGame}
              size="lg"
              variant="outline"
              className="w-full h-14 text-lg border-amber/50 text-amber hover:bg-amber/10 hover:border-amber font-bold tracking-wide transition-all hover:scale-105"
            >
              <FolderOpen className="w-5 h-5 mr-2" />
              CONTINUE
            </Button>
          )}

          <Button
            size="lg"
            variant="ghost"
            className="w-full h-12 text-muted-foreground hover:text-amber hover:bg-amber/5 tracking-wide transition-all"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 mr-2" />
                SOUND OFF
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                SOUND ON
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 text-center text-sm text-muted-foreground/60">
          <p>A post-apocalyptic city builder</p>
          <p className="mt-1">v0.1.0 • Made with ☢️</p>
        </div>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-amber/30" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-amber/30" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-amber/30" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-amber/30" />
    </div>
  );
}
