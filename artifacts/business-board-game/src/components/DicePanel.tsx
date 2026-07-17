import React from "react";
import { useGame } from "../game/GameContext";
import { Button } from "@/components/ui/button";

export function DicePanel() {
  const { state, myPeerId, dispatch } = useGame();
  const [rolling, setRolling] = React.useState(false);

  const isMyTurn = state.players[state.currentPlayerIndex]?.id === myPeerId;
  const me = state.players.find(p => p.id === myPeerId);

  const handleRoll = () => {
    if (!isMyTurn || state.hasRolled || rolling) return;
    
    setRolling(true);
    
    // Animate dice visually before committing state
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      dispatch({ type: "ROLL_DICE", dice: [d1, d2], playerId: myPeerId });
      setRolling(false);
    }, 600);
  };

  const renderDie = (val: number, isRolling: boolean) => {
    const displayVal = isRolling ? Math.floor(Math.random() * 6) + 1 : val;
    return (
      <div className={`w-16 h-16 bg-white border-2 border-gray-300 rounded-xl shadow-lg flex items-center justify-center text-4xl text-black font-bold ${isRolling ? "animate-spin" : ""}`}>
        {/* Simple dot representation could be CSS grid, but numbers are fine for speed, or emojis */}
        {["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][displayVal - 1] || displayVal}
      </div>
    );
  };

  // If waiting for action
  if (state.pendingAction && isMyTurn) {
    if (state.pendingAction === "pay_rent") {
      return (
        <div className="text-center w-full">
          <p className="text-board-gold mb-4 text-lg">You landed on an owned property!</p>
          <Button 
            onClick={() => dispatch({ type: "PAY_RENT", spaceId: state.pendingSpaceId!, playerId: myPeerId! })}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xl py-6"
          >
            Pay Rent
          </Button>
        </div>
      );
    }
  }

  const cp = state.players[state.currentPlayerIndex];

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-center mb-6">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Player</h3>
        <p className={`text-2xl font-serif ${isMyTurn ? "text-board-gold animate-pulse" : "text-foreground"}`}>
          {cp?.name}
        </p>
      </div>

      <div className="flex gap-4 mb-6 perspective-1000">
        {renderDie(state.diceResult?.[0] || 1, rolling)}
        {renderDie(state.diceResult?.[1] || 1, rolling)}
      </div>

      {isMyTurn && !state.hasRolled && !state.pendingAction && (
        <Button 
          onClick={handleRoll} 
          disabled={rolling || cp?.isBankrupt}
          className="w-full bg-board-gold text-board-green hover:bg-board-gold/90 font-serif text-2xl py-8 shadow-[0_0_15px_rgba(200,169,110,0.5)] transition-all active:scale-95"
        >
          ROLL DICE
        </Button>
      )}

      {!isMyTurn && (
        <p className="text-sm text-muted-foreground italic">
          Waiting for {cp?.name} to act...
        </p>
      )}
    </div>
  );
}
