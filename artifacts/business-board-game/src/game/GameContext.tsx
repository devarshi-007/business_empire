import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from "react";
import { GameState, GameAction, Player } from "./types";
import { createInitialState, gameReducer } from "./gameReducer";
import { trysteroManager } from "./trysteroManager";

interface GameContextType {
  state: GameState;
  dispatch: (action: GameAction) => void;
  myPeerId: string | null;
  isHost: boolean;
  joinRoom: (code: string, name: string, token: string) => void;
  leaveRoom: () => void;
  roomCode: string | null;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatchLocal] = useReducer(gameReducer, createInitialState());
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const dispatch = useCallback((action: GameAction) => {
    trysteroManager.sendAction(action);
  }, []);

  useEffect(() => {
    // Handle host state syncs
    if (isHost && state.phase === "playing") {
      // Could broadcast sync periodically or on specific events, but pure deterministic actions is better.
    }
  }, [state, isHost]);

  const handleAction = useCallback((action: GameAction) => {
    dispatchLocal(action);

    // Host responsibilities
    if (action.type === "REQUEST_STATE" && trysteroManager.isHost) {
      trysteroManager.sendAction({ type: "STATE_SYNC", state }); // we send the CURRENT local state
    }
  }, [state]);

  const joinRoom = useCallback((code: string, name: string, token: string) => {
    setRoomCode(code);
    
    let isFirst = true;

    trysteroManager.join(
      code,
      handleAction,
      (peerId) => {
        // Peer joined
        if (isFirst) {
           isFirst = false;
        }
        if (trysteroManager.isHost) {
          trysteroManager.sendAction({ type: "STATE_SYNC", state });
        }
      },
      (peerId) => {
        // Peer left - handle disconnect visually but don't bankrupt automatically
      }
    );

    // Give it a small delay to determine if we are host based on peers
    setTimeout(() => {
      const pid = trysteroManager.peerId || Math.random().toString(36).slice(2,9);
      setMyPeerId(pid);
      
      // If we joined and there's no state sync received quickly, assume we are host
      if (state.phase === "lobby" && state.players.length === 0) {
        setIsHost(true);
        trysteroManager.isHost = true;
      }
      
      trysteroManager.sendAction({
        type: "PLAYER_JOIN",
        player: { name, token, peerId: pid }
      });

      if (!trysteroManager.isHost) {
        trysteroManager.sendAction({ type: "REQUEST_STATE" });
      }

    }, 500);

  }, [handleAction, state]);

  const leaveRoom = useCallback(() => {
    trysteroManager.leave();
    setRoomCode(null);
    setMyPeerId(null);
    setIsHost(false);
    dispatchLocal({ type: "GAME_START", initialState: createInitialState() }); // Reset
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, myPeerId, isHost, joinRoom, leaveRoom, roomCode }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
};
