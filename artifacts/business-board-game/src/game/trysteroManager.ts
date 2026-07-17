import { joinRoom } from "trystero/nostr";
import { GameAction, GameState } from "./types";

const APP_ID = "business-empire-board-game-v1";

export class TrysteroManager {
  private room: any = null;
  private actionSender: ((action: GameAction) => void) | null = null;
  private onActionCallback: ((action: GameAction) => void) | null = null;
  public peerId: string | null = null;
  public roomCode: string | null = null;
  public isHost: boolean = false;

  join(roomCode: string, onAction: (action: GameAction) => void, onPeerJoin: (peerId: string) => void, onPeerLeave: (peerId: string) => void) {
    if (this.room) {
      this.room.leave();
    }
    
    this.roomCode = roomCode;
    this.onActionCallback = onAction;

    // The nostr tracker is generally reliable. Can use torrent if needed.
    this.room = joinRoom({ appId: APP_ID }, roomCode);
    
    // Try to get selfId if exported, otherwise use fallback
    let myId = Math.random().toString(36).substring(2, 9);
    try {
      const { selfId } = require("trystero/nostr");
      if (selfId) myId = selfId;
    } catch(e) {}
    this.peerId = myId;

    const [sendAction, getAction] = this.room.makeAction("gameAction");
    this.actionSender = sendAction;

    getAction((action: any, peerId: string) => {
      if (this.onActionCallback) {
        this.onActionCallback(action as GameAction);
      }
    });

    this.room.onPeerJoin((peerId: string) => {
      onPeerJoin(peerId);
    });

    this.room.onPeerLeave((peerId: string) => {
      onPeerLeave(peerId);
    });
  }

  sendAction(action: GameAction) {
    if (this.actionSender) {
      this.actionSender(action);
      // Optimistic local dispatch
      if (this.onActionCallback) {
        this.onActionCallback(action);
      }
    }
  }

  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }
}

export const trysteroManager = new TrysteroManager();
