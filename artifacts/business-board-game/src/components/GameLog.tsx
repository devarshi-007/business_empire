import React from "react";
import { useGame } from "../game/GameContext";

export function GameLog() {
  const { state } = useGame();

  return (
    <div className="h-48 md:h-64 flex flex-col bg-card border-t border-board-gold/30">
      <div className="px-4 py-2 bg-board-green/30 border-b border-border text-xs font-bold uppercase text-muted-foreground">
        Event Log
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 flex flex-col-reverse">
        {state.log.map((entry, i) => (
          <div key={i} className="text-sm text-foreground/80 border-b border-border/50 pb-1">
            <span className="text-board-gold opacity-50 mr-2">›</span>
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}
