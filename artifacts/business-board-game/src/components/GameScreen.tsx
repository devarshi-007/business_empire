import React, { useState } from "react";
import { useGame } from "../game/GameContext";
import { GameBoard } from "./GameBoard";
import { PlayerPanel } from "./PlayerPanel";
import { DicePanel } from "./DicePanel";
import { GameLog } from "./GameLog";
import { PropertyPurchaseDialog } from "./PropertyPurchaseDialog";
import { CardDrawOverlay } from "./CardDrawOverlay";
import { BankruptcyOverlay } from "./BankruptcyOverlay";
import { ManageProperties } from "./ManageProperties";
import { Button } from "@/components/ui/button";

export function GameScreen() {
  const { state, myPeerId, dispatch } = useGame();
  const [showManage, setShowManage] = useState(false);

  const me = state.players.find(p => p.id === myPeerId);
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === myPeerId;

  return (
    <div className="min-h-[100dvh] bg-board-green flex flex-col md:flex-row overflow-hidden font-sans selection:bg-board-gold/30">
      {/* Main Board Area */}
      <div className="flex-1 flex items-center justify-center relative p-2 md:p-8 overflow-auto">
        <GameBoard />
        
        {/* Center UI Overlay on top of board center */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="pointer-events-auto w-[60%] h-[60%] flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl md:text-6xl font-serif text-board-gold uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] -rotate-45 opacity-20 absolute z-0 select-none">
              Business Empire
            </h1>
            
            <div className="z-10 bg-card/90 backdrop-blur border-2 border-board-gold p-6 rounded-lg shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full">
              <DicePanel />
              
              {isMyTurn && !state.pendingAction && (
                <div className="flex gap-2 w-full mt-4">
                  <Button 
                    onClick={() => setShowManage(true)} 
                    variant="outline" 
                    className="flex-1 border-board-gold text-board-gold hover:bg-board-gold hover:text-board-green"
                  >
                    Manage
                  </Button>
                  <Button 
                    onClick={() => dispatch({ type: "END_TURN" })} 
                    disabled={!state.hasRolled || state.doublesCount > 0}
                    className="flex-1 bg-board-gold text-board-green hover:bg-board-gold/90 font-bold"
                  >
                    End Turn
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Area */}
      <div className="w-full md:w-80 lg:w-96 bg-card border-t md:border-t-0 md:border-l border-board-gold flex flex-col z-20">
        <PlayerPanel />
        <GameLog />
      </div>

      {/* Modals & Overlays */}
      {state.pendingAction === "buy_property" && isMyTurn && <PropertyPurchaseDialog />}
      {state.pendingAction === "card" && isMyTurn && <CardDrawOverlay />}
      {showManage && <ManageProperties onClose={() => setShowManage(false)} />}
      
      {/* Show bankruptcy modal for bankrupt players */}
      {me?.isBankrupt && <BankruptcyOverlay />}
      
      {state.winner && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card border-4 border-board-gold p-12 text-center max-w-lg rounded-sm shadow-[0_0_50px_rgba(200,169,110,0.5)]">
            <h2 className="text-5xl font-serif text-board-gold mb-6 uppercase">Game Over</h2>
            <p className="text-2xl text-foreground mb-8">
              <span className="font-bold text-board-gold">
                {state.players.find(p => p.id === state.winner)?.name}
              </span> has monopolized the business empire!
            </p>
            <Button onClick={() => window.location.reload()} className="bg-board-gold text-board-green px-8 py-6 text-xl">
              Back to Lobby
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
