import React, { useState } from "react";
import { useGame } from "../game/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInitialState } from "../game/gameReducer";

const TOKENS = ["hat", "car", "thimble", "iron", "dog", "battleship"];

export function LobbyScreen() {
  const { state, joinRoom, isHost, dispatch, myPeerId, roomCode } = useGame();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState(TOKENS[0]);
  const [view, setView] = useState<"menu" | "join" | "room">("menu");

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreate = () => {
    const newCode = generateCode();
    setView("room");
    joinRoom(newCode, name || "Host", token);
  };

  const handleJoin = () => {
    if (!code) return;
    setView("room");
    joinRoom(code.toUpperCase(), name || "Player", token);
  };

  const handleStart = () => {
    dispatch({ type: "GAME_START", initialState: { ...state, phase: "playing" } });
  };

  if (view === "menu" || view === "join") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-board-green text-foreground p-4">
        <div className="w-full max-w-md bg-card border-4 border-board-gold p-8 shadow-2xl rounded-sm">
          <h1 className="text-4xl font-serif text-center text-board-gold mb-8 tracking-wider uppercase drop-shadow-md">
            Business Empire
          </h1>

          <div className="space-y-6">
            <div>
              <Label className="text-board-gold">Player Name</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter your name" 
                className="mt-1 bg-input border-board-gold text-foreground"
              />
            </div>

            <div>
              <Label className="text-board-gold">Choose Token</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {TOKENS.map(t => (
                  <div 
                    key={t}
                    onClick={() => setToken(t)}
                    className={`p-2 border-2 cursor-pointer text-center capitalize transition-colors ${
                      token === t ? "border-board-gold bg-board-gold/20 text-board-gold" : "border-muted hover:border-board-gold/50"
                    }`}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {view === "menu" ? (
              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={handleCreate} className="w-full bg-board-gold text-board-green hover:bg-board-gold/90 font-serif text-lg">
                  Create Game
                </Button>
                <Button onClick={() => setView("join")} variant="outline" className="w-full border-board-gold text-board-gold hover:bg-board-gold/10 font-serif text-lg">
                  Join Game
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <Label className="text-board-gold">Room Code</Label>
                  <Input 
                    value={code} 
                    onChange={(e) => setCode(e.target.value.toUpperCase())} 
                    placeholder="e.g. AB12CD" 
                    maxLength={6}
                    className="mt-1 bg-input border-board-gold text-foreground font-mono uppercase text-center text-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setView("menu")} variant="outline" className="flex-1 border-board-gold text-board-gold hover:bg-board-gold/10">
                    Back
                  </Button>
                  <Button onClick={handleJoin} disabled={code.length < 4} className="flex-2 bg-board-gold text-board-green hover:bg-board-gold/90">
                    Join Room
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Room View
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-board-green text-foreground p-4">
      <div className="w-full max-w-md bg-card border-4 border-board-gold p-8 shadow-2xl rounded-sm">
        <h2 className="text-2xl font-serif text-center text-board-gold mb-2 uppercase">Lobby</h2>
        <div className="bg-input border border-board-gold/30 rounded p-3 mb-6 text-center">
          <p className="text-sm text-muted-foreground uppercase mb-1">Room Code</p>
          <p className="text-3xl font-mono text-board-gold tracking-widest">{roomCode}</p>
        </div>

        <div className="space-y-3 mb-8">
          <h3 className="text-board-gold uppercase text-sm font-bold border-b border-board-gold/20 pb-1">Players Connected</h3>
          {state.players.length === 0 ? (
            <p className="text-muted-foreground italic text-center py-4">Waiting for players...</p>
          ) : (
            state.players.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-background border border-border rounded">
                <span className="font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-board-gold inline-block shadow-[0_0_8px_rgba(200,169,110,0.8)] animate-pulse" />
                  {p.name} {p.id === myPeerId && "(You)"}
                </span>
                <span className="text-xs uppercase text-board-gold bg-board-gold/10 px-2 py-1 rounded">{p.token}</span>
              </div>
            ))
          )}
        </div>

        {isHost ? (
          <Button 
            onClick={handleStart} 
            disabled={state.players.length < 1} // allow 1 for solo testing, normally 2
            className="w-full bg-board-gold text-board-green hover:bg-board-gold/90 font-serif text-xl py-6"
          >
            START GAME
          </Button>
        ) : (
          <div className="text-center p-4 border border-board-gold/30 bg-board-gold/5 rounded animate-pulse">
            <p className="text-board-gold font-serif">Waiting for host to start...</p>
          </div>
        )}
      </div>
    </div>
  );
}
