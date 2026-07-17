export interface Player {
  id: string;          // Trystero peer ID
  name: string;
  token: string;
  money: number;
  position: number;    // 0-39
  inJail: boolean;
  jailTurns: number;   // 0-3
  jailFreeCards: number;
  properties: number[]; // space IDs owned
  isBankrupt: boolean;
  isConnected: boolean;
}

export interface PropertyState {
  spaceId: number;
  ownerId: string | null;  // null = bank
  houses: number;          // 0-4 = houses, 5 = hotel
  mortgaged: boolean;
}

export interface GameState {
  phase: "lobby"|"playing"|"ended";
  players: Player[];
  currentPlayerIndex: number;
  properties: PropertyState[];
  chanceDeck: string[];       // card IDs, shuffled
  communityChestDeck: string[];
  chanceDiscardPile: string[];
  communityChestDiscardPile: string[];
  diceResult: [number, number] | null;
  hasRolled: boolean;
  doublesCount: number;
  winner: string | null;
  bankHouses: number;         // starts at 32
  bankHotels: number;         // starts at 12
  log: string[];              // last 10 game events
  jailFreeCardsInDeck: { chance: boolean, communityChest: boolean };
  pendingAction: "buy_property" | "card" | "pay_rent" | "jail_decision" | null;
  pendingSpaceId: number | null;
  pendingCardId: string | null;
  pendingCardDeck: "chance" | "community_chest" | null;
}

export type GameAction =
  | { type: "PLAYER_JOIN"; player: { name: string; token: string; peerId: string } }
  | { type: "PLAYER_READY" }
  | { type: "GAME_START"; initialState: GameState }
  | { type: "ROLL_DICE"; dice: [number, number]; playerId: string }
  | { type: "BUY_PROPERTY"; spaceId: number; playerId: string }
  | { type: "DECLINE_PROPERTY" }
  | { type: "PAY_RENT"; spaceId: number; playerId: string }
  | { type: "DRAW_CARD"; deck: "chance"|"community_chest"; cardId: string }
  | { type: "RESOLVE_CARD" }
  | { type: "BUILD_HOUSE"; spaceId: number; playerId: string }
  | { type: "SELL_HOUSE"; spaceId: number; playerId: string }
  | { type: "BUILD_HOTEL"; spaceId: number; playerId: string }
  | { type: "SELL_HOTEL"; spaceId: number; playerId: string }
  | { type: "MORTGAGE"; spaceId: number; playerId: string }
  | { type: "UNMORTGAGE"; spaceId: number; playerId: string }
  | { type: "PAY_JAIL_FINE"; playerId: string }
  | { type: "USE_JAIL_FREE_CARD"; playerId: string }
  | { type: "PAY_TAX"; playerId: string; amount: number }
  | { type: "BANKRUPT"; playerId: string }
  | { type: "END_TURN" }
  | { type: "REQUEST_STATE" }
  | { type: "STATE_SYNC"; state: GameState };
