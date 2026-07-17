import React from "react";
import { useGame } from "../game/GameContext";
import { getSpace } from "../game/gameUtils";
import { BOARD_SPACES } from "../game/gameData";

const colorClasses: Record<string, string> = {
  brown: "bg-[#8B4513]",
  lightblue: "bg-[#87CEEB]",
  pink: "bg-[#FF69B4]",
  orange: "bg-[#FFA500]",
  red: "bg-[#FF0000]",
  yellow: "bg-[#FFFF00]",
  green: "bg-[#008000]",
  darkblue: "bg-[#0000CD]",
};

const tokenColors = ["bg-red-500", "bg-blue-500", "bg-yellow-400", "bg-purple-500", "bg-orange-500", "bg-teal-400"];

export function GameBoard() {
  const { state } = useGame();

  // Map 0-39 spaces to grid positions (11x11 grid)
  // Grid coordinates: col 1-11, row 1-11
  // Bottom row: row 11, col 11 to 1 (spaces 0-10)
  // Left col: col 1, row 11 to 1 (spaces 10-20)
  // Top row: row 1, col 1 to 11 (spaces 20-30)
  // Right col: col 11, row 1 to 11 (spaces 30-0)

  const getGridArea = (id: number) => {
    if (id >= 0 && id <= 10) return `${11} / ${11 - id} / ${12} / ${12 - id}`;
    if (id > 10 && id <= 20) return `${21 - id} / 1 / ${22 - id} / 2`;
    if (id > 20 && id <= 30) return `${1} / ${id - 19} / 2 / ${id - 18}`;
    if (id > 30 && id < 40) return `${id - 29} / 11 / ${id - 28} / 12`;
    return "1 / 1 / 2 / 2";
  };

  const getOrientation = (id: number) => {
    if (id > 0 && id < 10) return "bottom";
    if (id > 10 && id < 20) return "left";
    if (id > 20 && id < 30) return "top";
    if (id > 30 && id < 40) return "right";
    return "corner";
  };

  return (
    <div className="w-[800px] h-[800px] max-w-[95vmin] max-h-[95vmin] bg-board-green border-[16px] border-board-mahogany rounded-sm shadow-2xl relative shrink-0 aspect-square select-none">
      <div 
        className="absolute inset-0 grid bg-board-green"
        style={{
          gridTemplateColumns: "2fr repeat(9, 1fr) 2fr",
          gridTemplateRows: "2fr repeat(9, 1fr) 2fr",
          gap: "2px",
          padding: "2px",
          backgroundColor: "#c8a96e" // border lines
        }}
      >
        {BOARD_SPACES.map(space => {
          const propState = state.properties.find(p => p.spaceId === space.id);
          const orientation = getOrientation(space.id);
          const ownerIdx = propState?.ownerId ? state.players.findIndex(p => p.id === propState.ownerId) : -1;
          
          return (
            <div 
              key={space.id}
              className={`bg-[#E6E6E8] relative flex flex-col justify-between overflow-hidden ${
                orientation === "corner" ? "items-center justify-center p-2" : ""
              }`}
              style={{ gridArea: getGridArea(space.id) }}
            >
              {/* Color Bar */}
              {space.color && orientation !== "corner" && (
                <div 
                  className={`absolute ${colorClasses[space.color]} border-black`}
                  style={{
                    ...(orientation === "bottom" && { top: 0, left: 0, right: 0, height: "25%", borderBottomWidth: "2px" }),
                    ...(orientation === "top" && { bottom: 0, left: 0, right: 0, height: "25%", borderTopWidth: "2px" }),
                    ...(orientation === "left" && { top: 0, bottom: 0, right: 0, width: "25%", borderLeftWidth: "2px" }),
                    ...(orientation === "right" && { top: 0, bottom: 0, left: 0, width: "25%", borderRightWidth: "2px" }),
                  }}
                />
              )}

              {/* Space Content */}
              <div 
                className={`w-full h-full flex flex-col items-center text-black px-1 py-1 z-10 ${
                  orientation === "bottom" ? "pt-[30%]" :
                  orientation === "top" ? "pb-[30%] rotate-180" :
                  orientation === "left" ? "pr-[30%] rotate-90" :
                  orientation === "right" ? "pl-[30%] -rotate-90" : ""
                }`}
                style={{ fontSize: "clamp(6px, 1.2cqw, 12px)", lineHeight: 1.1 }}
              >
                <div className="font-bold text-center uppercase break-words w-full px-[2px]">
                  {space.name.replace("Railroad", "RR")}
                </div>
                
                {space.price && (
                  <div className="mt-auto font-mono font-medium">${space.price}</div>
                )}
                {space.amount && (
                  <div className="mt-auto font-mono font-medium">Pay ${space.amount}</div>
                )}

                {/* Owner indicator */}
                {ownerIdx !== -1 && (
                  <div className={`absolute bottom-0 w-full h-[4px] ${tokenColors[ownerIdx % tokenColors.length]}`} />
                )}

                {/* Houses / Hotel */}
                {propState && propState.houses > 0 && orientation !== "corner" && (
                  <div className={`absolute flex gap-[1px] ${
                    orientation === "bottom" ? "top-[2px] left-1/2 -translate-x-1/2" :
                    orientation === "top" ? "bottom-[2px] left-1/2 -translate-x-1/2" :
                    orientation === "left" ? "right-[2px] top-1/2 -translate-y-1/2 flex-col" :
                    "left-[2px] top-1/2 -translate-y-1/2 flex-col"
                  }`}>
                    {propState.houses === 5 ? (
                      <div className="w-3 h-3 bg-red-600 border border-black shadow-sm" />
                    ) : (
                      Array.from({ length: propState.houses }).map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-green-600 border border-black shadow-sm" />
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Player Tokens Container */}
              <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-[2px] pointer-events-none p-1 z-20">
                {state.players.filter(p => p.position === space.id).map((p, i) => {
                  const pIdx = state.players.findIndex(player => player.id === p.id);
                  return (
                    <div 
                      key={p.id}
                      className={`w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[8px] md:text-xs font-bold text-white transition-all duration-500 ease-in-out ${tokenColors[pIdx % tokenColors.length]}`}
                      title={p.name}
                    >
                      {p.token.charAt(0).toUpperCase()}
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
