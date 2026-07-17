import React from "react";
import { Switch, Route } from "wouter";
import { GameProvider, useGame } from "./game/GameContext";
import { LobbyScreen, GameScreen } from "./components";
import { Toaster } from "@/components/ui/toaster";

function GameRouter() {
  const { state } = useGame();

  if (state.phase === "lobby") {
    return <LobbyScreen />;
  }

  return <GameScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
      <Toaster />
    </GameProvider>
  );
}
