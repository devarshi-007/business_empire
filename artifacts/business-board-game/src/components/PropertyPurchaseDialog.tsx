import React from "react";
import { useGame } from "../game/GameContext";
import { getSpace } from "../game/gameUtils";
import { Button } from "@/components/ui/button";

export function PropertyPurchaseDialog() {
  const { state, dispatch, myPeerId } = useGame();
  
  if (!state.pendingSpaceId) return null;
  const space = getSpace(state.pendingSpaceId);
  if (!space) return null;

  const colorClasses: Record<string, string> = {
    brown: "bg-[#8B4513] text-white",
    lightblue: "bg-[#87CEEB] text-black",
    pink: "bg-[#FF69B4] text-white",
    orange: "bg-[#FFA500] text-black",
    red: "bg-[#FF0000] text-white",
    yellow: "bg-[#FFFF00] text-black",
    green: "bg-[#008000] text-white",
    darkblue: "bg-[#0000CD] text-white",
  };

  const isUtility = space.type === "utility";
  const isRR = space.type === "railroad";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-black p-4 max-w-sm w-full rounded shadow-2xl flex flex-col items-center">
        
        {/* Deed Card Style */}
        <div className="w-full border-2 border-black p-2 mb-6 shadow-md bg-[#F5F5DC]">
          {space.color ? (
            <div className={`text-center py-4 border-2 border-black mb-4 ${colorClasses[space.color]}`}>
              <div className="text-xs uppercase tracking-widest mb-1 opacity-80">Title Deed</div>
              <div className="text-xl font-serif font-bold uppercase">{space.name}</div>
            </div>
          ) : (
            <div className="text-center py-4 mb-4">
              <div className="text-2xl font-serif font-bold uppercase">{space.name}</div>
            </div>
          )}

          <div className="text-center space-y-1 mb-4 text-sm px-4">
            {space.rent && (
              <>
                <div className="font-bold mb-2 text-base">Rent ${space.rent[0]}</div>
                <div className="flex justify-between"><span>With 1 House</span><span>${space.rent[1]}</span></div>
                <div className="flex justify-between"><span>With 2 Houses</span><span>${space.rent[2]}</span></div>
                <div className="flex justify-between"><span>With 3 Houses</span><span>${space.rent[3]}</span></div>
                <div className="flex justify-between"><span>With 4 Houses</span><span>${space.rent[4]}</span></div>
                <div className="font-bold mt-2 text-base">With HOTEL ${space.rent[5]}</div>
              </>
            )}
            {isRR && (
              <div className="space-y-2 mt-4 text-left">
                <div className="flex justify-between"><span>Rent</span><span>$25</span></div>
                <div className="flex justify-between"><span>If 2 R.R.'s are owned</span><span>$50</span></div>
                <div className="flex justify-between"><span>If 3 R.R.'s are owned</span><span>$100</span></div>
                <div className="flex justify-between"><span>If 4 R.R.'s are owned</span><span>$200</span></div>
              </div>
            )}
            {isUtility && (
              <div className="mt-4 text-left text-xs leading-relaxed">
                If one "Utility" is owned rent is 4 times amount shown on dice.
                <br/><br/>
                If both "Utilities" are owned rent is 10 times amount shown on dice.
              </div>
            )}
          </div>
          
          <div className="border-t border-black pt-2 text-center text-xs space-y-1 text-gray-700">
            {space.mortgage && <div>Mortgage Value ${space.mortgage}</div>}
            {space.houseCost && <div>Houses cost ${space.houseCost}. each</div>}
            {space.houseCost && <div>Hotels, ${space.houseCost}. plus 4 houses</div>}
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <Button 
            variant="outline"
            className="flex-1 border-black text-black hover:bg-gray-100"
            onClick={() => dispatch({ type: "DECLINE_PROPERTY" })}
          >
            Pass
          </Button>
          <Button 
            className="flex-2 bg-[#00cc44] text-white hover:bg-[#00b33c] text-lg font-bold border-2 border-black"
            onClick={() => dispatch({ type: "BUY_PROPERTY", spaceId: space.id, playerId: myPeerId! })}
          >
            Buy for ${space.price}
          </Button>
        </div>

      </div>
    </div>
  );
}
