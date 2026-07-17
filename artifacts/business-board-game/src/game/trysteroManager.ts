import { joinRoom, selfId } from "trystero/nostr";
import { GameAction, GameState } from "./types";

const APP_ID = "business-empire-board-game-v1";

export class TrysteroManager {
  private room: any = null;
  private action: any = null;
  private onActionCallback: ((action: GameAction) => void) | null = null;
  public peerId: string | null = null;
  public roomCode: string | null = null;
  public isHost: boolean = false;

  join(
    roomCode: string,
    onAction: (action: GameAction) => void,
    onPeerJoin: (peerId: string) => void,
    onPeerLeave: (peerId: string) => void
  ) {
    if (this.room) {
      this.room.leave();
    }

    this.roomCode = roomCode;
    this.onActionCallback = onAction;

    this.room = joinRoom({ appId: APP_ID }, roomCode);

    // selfId is a named export in trystero v0.25+
    this.peerId = selfId || Math.random().toString(36).substring(2, 9);

    // makeAction now returns a MessageAction object { send, onMessage }
    this.action = this.room.makeAction("gameAction");

    this.action.onMessage = (data: any, _context: any) => {
      if (this.onActionCallback) {
        this.onActionCallback(data as GameAction);
      }
    };

    // onPeerJoin/onPeerLeave are assignable properties, not method calls
    this.room.onPeerJoin = (peerId: string) => {
      onPeerJoin(peerId);
    };

    this.room.onPeerLeave = (peerId: string) => {
      onPeerLeave(peerId);
    };
  }

  sendAction(action: GameAction) {
    if (this.action) {
      // send() is async in v0.25 but we fire-and-forget
      this.action.send(action).catch(() => {});
    }
    // Always apply locally
    if (this.onActionCallback) {
      this.onActionCallback(action);
    }
  }

  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
      this.action = null;
    }
  }
}

export const trysteroManager = new TrysteroManager();
