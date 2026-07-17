import React from "react";
import { useGame } from "../game/GameContext";
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from "../game/gameData";
import { Button } from "@/components/ui/button";

export function CardDrawOverlay() {
  const { state, dispatch } = useGame();

  if (!state.pendingCardDeck) return null;

  // We need to resolve drawing the card if we haven't already. 
  // Wait, DRAW_CARD happens locally, but to be synced nicely: 
  // Actually, DRAW_CARD should be dispatched when landing. But we did: nextState.pendingAction = "card".
  // Let's ensure the card is drawn.
  
  React.useEffect(() => {
    if (!state.pendingCardId && state.pendingCardDeck) {
      // It's our turn, we should draw
      dispatch({ type: "DRAW_CARD", deck: state.pendingCardDeck, cardId: "" });
    }
  }, [state.pendingCardId, state.pendingCardDeck, dispatch]);

  if (!state.pendingCardId) return null;

  const deckType = state.pendingCardDeck;
  const cardDef = deckType === "chance" 
    ? CHANCE_CARDS.find(c => c.id === state.pendingCardId)
    : COMMUNITY_CHEST_CARDS.find(c => c.id === state.pendingCardId);

  if (!cardDef) return null;

  const isChance = deckType === "chance";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative animate-in zoom-in duration-300">
        
        {/* Card Style */}
        <div className={`w-[300px] h-[200px] md:w-[400px] md:h-[250px] p-6 rounded shadow-2xl flex flex-col items-center justify-center text-center border-4 border-board-gold ${
          isChance ? "bg-orange-100 text-orange-900" : "bg-yellow-100 text-yellow-900"
        }`}>
          
          <h2 className="absolute top-4 left-0 w-full text-center text-xl font-serif font-bold uppercase tracking-[0.2em] opacity-40">
            {isChance ? "Chance" : "Community Chest"}
          </h2>

          <p className="text-xl md:text-2xl font-serif font-bold mt-4 px-4 leading-snug">
            {cardDef.text}
          </p>

        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => dispatch({ type: "RESOLVE_CARD" })}
            className="bg-board-gold text-board-green px-12 py-6 text-xl font-bold hover:bg-board-gold/90 shadow-[0_0_20px_rgba(200,169,110,0.5)]"
          >
            Continue
          </Button>
        </div>

      </div>
    </div>
  );
}
