import React from "react";
import { useGame } from "../game/GameContext";
import { getSpace, canBuildHouse, canBuildHotel, canMortgage } from "../game/gameUtils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

export function ManageProperties({ onClose }: { onClose: () => void }) {
  const { state, dispatch, myPeerId } = useGame();
  
  const me = state.players.find(p => p.id === myPeerId);
  if (!me) return null;

  const properties = me.properties.map(id => {
    const space = getSpace(id);
    const propState = state.properties.find(p => p.spaceId === id);
    return { space, propState };
  }).filter(p => p.space && p.propState);

  const colorClasses: Record<string, string> = {
    brown: "bg-[#8B4513]", lightblue: "bg-[#87CEEB]", pink: "bg-[#FF69B4]",
    orange: "bg-[#FFA500]", red: "bg-[#FF0000]", yellow: "bg-[#FFFF00]",
    green: "bg-[#008000]", darkblue: "bg-[#0000CD]", railroad: "bg-gray-400", utility: "bg-white"
  };

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-board-gold text-foreground h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-board-gold uppercase tracking-wider border-b border-board-gold/30 pb-4">
            Manage Portfolio
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center bg-background p-4 rounded border border-border mt-2">
          <span className="text-muted-foreground uppercase font-bold text-sm tracking-widest">Available Cash</span>
          <span className="text-2xl font-mono text-[#00cc44] font-bold">${me.money}</span>
        </div>

        <ScrollArea className="flex-1 mt-4 border rounded border-border bg-background/50 p-4">
          {properties.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground italic">
              You do not own any properties yet.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {properties.map(({ space, propState }) => {
                if (!space || !propState) return null;
                const bg = space.color ? colorClasses[space.color] : colorClasses[space.type] || "bg-gray-500";
                
                const canMort = canMortgage(space.id, state);
                const canBuildHs = canBuildHouse(space.id, state);
                const canBuildHt = canBuildHotel(space.id, state);

                return (
                  <div key={space.id} className={`flex flex-col border border-border rounded overflow-hidden bg-card ${propState.mortgaged ? "opacity-60" : ""}`}>
                    <div className={`${bg} h-3 w-full`} />
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold uppercase text-sm">{space.name}</span>
                        {propState.houses > 0 && (
                          <div className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded font-bold">
                            {propState.houses === 5 ? "HOTEL" : `${propState.houses} HOUSE${propState.houses > 1 ? 'S' : ''}`}
                          </div>
                        )}
                        {propState.mortgaged && (
                          <div className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded font-bold">MORTGAGED</div>
                        )}
                      </div>

                      <div className="mt-auto space-y-2 pt-4">
                        {space.type === "property" && !propState.mortgaged && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              disabled={!canBuildHs}
                              className="flex-1 text-xs"
                              onClick={() => dispatch({ type: "BUILD_HOUSE", spaceId: space.id, playerId: myPeerId! })}
                            >
                              + House (${space.houseCost})
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              disabled={propState.houses === 0 || propState.houses === 5}
                              className="flex-1 text-xs"
                              onClick={() => dispatch({ type: "SELL_HOUSE", spaceId: space.id, playerId: myPeerId! })}
                            >
                              - House (+${(space.houseCost||0)/2})
                            </Button>
                          </div>
                        )}
                        {space.type === "property" && !propState.mortgaged && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              disabled={!canBuildHt}
                              className="flex-1 text-xs"
                              onClick={() => dispatch({ type: "BUILD_HOTEL", spaceId: space.id, playerId: myPeerId! })}
                            >
                              + Hotel (${space.houseCost})
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              disabled={propState.houses !== 5}
                              className="flex-1 text-xs"
                              onClick={() => dispatch({ type: "SELL_HOTEL", spaceId: space.id, playerId: myPeerId! })}
                            >
                              - Hotel (+${(space.houseCost||0)/2})
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2 border-t border-border/50">
                          {propState.mortgaged ? (
                            <Button 
                              size="sm" 
                              className="w-full bg-[#00cc44] hover:bg-[#00b33c] text-white text-xs"
                              disabled={me.money < Math.ceil((space.mortgage||0)*1.1)}
                              onClick={() => dispatch({ type: "UNMORTGAGE", spaceId: space.id, playerId: myPeerId! })}
                            >
                              Unmortgage (${Math.ceil((space.mortgage||0)*1.1)})
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="w-full text-xs"
                              disabled={!canMort}
                              onClick={() => dispatch({ type: "MORTGAGE", spaceId: space.id, playerId: myPeerId! })}
                            >
                              Mortgage (+${space.mortgage})
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
