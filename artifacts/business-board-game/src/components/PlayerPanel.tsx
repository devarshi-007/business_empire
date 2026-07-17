import React from "react";
import { useGame } from "../game/GameContext";

const tokenColors = ["bg-red-500", "bg-blue-500", "bg-yellow-400", "bg-purple-500", "bg-orange-500", "bg-teal-400"];

export function PlayerPanel() {
  const { state, myPeerId } = useGame();

  return (
    <div className="flex-1 flex flex-col bg-card border-b border-board-gold overflow-y-auto">
      <div className="p-4 bg-board-green/50 border-b border-board-gold/30">
        <h2 className="text-xl font-serif text-board-gold uppercase tracking-widest text-center">Portfolio</h2>
      </div>
      
      <div className="flex-1 p-2 space-y-2">
        {state.players.map((p, i) => {
          const isCurrent = state.currentPlayerIndex === i;
          const isMe = p.id === myPeerId;
          const tColor = tokenColors[i % tokenColors.length];

          return (
            <div 
              key={p.id} 
              className={`p-3 rounded border ${
                isCurrent ? "border-board-gold shadow-[0_0_10px_rgba(200,169,110,0.3)] bg-board-gold/5" : "border-border bg-background/50"
              } ${p.isBankrupt ? "opacity-50 grayscale" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${tColor}`} />
                  <span className={`font-bold ${isMe ? "text-board-gold" : "text-foreground"}`}>
                    {p.name} {isMe && "(You)"}
                  </span>
                </div>
                <div className="font-mono text-lg text-[#00cc44] font-bold">
                  ${p.money}
                </div>
              </div>

              {p.isBankrupt ? (
                <div className="text-center text-destructive font-bold uppercase text-sm border border-destructive/30 py-1 bg-destructive/10 rounded">Bankrupt</div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-muted-foreground mr-1">Props:</span>
                    {p.properties.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">None</span>
                    ) : (
                      <div className="flex gap-[2px] flex-wrap">
                        {p.properties.map(spaceId => {
                          const prop = state.properties.find(pr => pr.spaceId === spaceId);
                          // We'll just show little colored squares for properties
                          const spaceDef = require("../game/gameData").BOARD_SPACES.find((s:any) => s.id === spaceId);
                          const colorMap:any = {
                            brown: "bg-[#8B4513]", lightblue: "bg-[#87CEEB]", pink: "bg-[#FF69B4]",
                            orange: "bg-[#FFA500]", red: "bg-[#FF0000]", yellow: "bg-[#FFFF00]",
                            green: "bg-[#008000]", darkblue: "bg-[#0000CD]", railroad: "bg-gray-400", utility: "bg-white"
                          };
                          const bg = colorMap[spaceDef?.color] || colorMap[spaceDef?.type] || "bg-gray-500";
                          return (
                            <div 
                              key={spaceId} 
                              className={`w-3 h-3 border border-black ${bg} ${prop?.mortgaged ? "opacity-30" : ""}`}
                              title={spaceDef?.name}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {p.inJail && (
                    <div className="mt-2 text-xs font-bold text-orange-400 uppercase">In Jail ({3 - p.jailTurns} turns left)</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
