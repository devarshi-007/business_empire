import { GameState, GameAction, Player, PropertyState } from "./types";
import { BOARD_SPACES, CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from "./gameData";
import { getSpace, calculateRent, canBuildHouse, canBuildHotel, canMortgage, nearestRailroad, nearestUtility } from "./gameUtils";

export function createInitialState(): GameState {
  return {
    phase: "lobby",
    players: [],
    currentPlayerIndex: 0,
    properties: BOARD_SPACES.filter(s => s.type === "property" || s.type === "railroad" || s.type === "utility")
      .map(s => ({
        spaceId: s.id,
        ownerId: null,
        houses: 0,
        mortgaged: false
      })),
    chanceDeck: CHANCE_CARDS.map(c => c.id).sort(() => Math.random() - 0.5),
    communityChestDeck: COMMUNITY_CHEST_CARDS.map(c => c.id).sort(() => Math.random() - 0.5),
    chanceDiscardPile: [],
    communityChestDiscardPile: [],
    diceResult: null,
    hasRolled: false,
    doublesCount: 0,
    winner: null,
    bankHouses: 32,
    bankHotels: 12,
    log: ["Lobby created."],
    jailFreeCardsInDeck: { chance: true, communityChest: true },
    pendingAction: null,
    pendingSpaceId: null,
    pendingCardId: null,
    pendingCardDeck: null,
  };
}

function logEvent(state: GameState, msg: string): string[] {
  return [msg, ...state.log].slice(0, 20);
}

function bankruptPlayer(state: GameState, playerId: string): GameState {
  const pIdx = state.players.findIndex(p => p.id === playerId);
  if (pIdx === -1) return state;
  const player = state.players[pIdx];

  const newProperties = state.properties.map(prop => {
    if (prop.ownerId === playerId) {
      return { ...prop, ownerId: null, houses: 0, mortgaged: false };
    }
    return prop;
  });

  let housesReturned = 0;
  let hotelsReturned = 0;
  state.properties.forEach(prop => {
    if (prop.ownerId === playerId) {
      if (prop.houses === 5) hotelsReturned++;
      else housesReturned += prop.houses;
    }
  });

  const newPlayers = [...state.players];
  newPlayers[pIdx] = {
    ...player,
    isBankrupt: true,
    money: 0,
    properties: [],
    jailFreeCards: 0
  };

  const remaining = newPlayers.filter(p => !p.isBankrupt);
  const winner = remaining.length === 1 ? remaining[0].id : null;

  return {
    ...state,
    players: newPlayers,
    properties: newProperties,
    bankHouses: state.bankHouses + housesReturned,
    bankHotels: state.bankHotels + hotelsReturned,
    log: logEvent(state, `${player.name} went BANKRUPT!`),
    winner: winner || state.winner,
    phase: winner ? "ended" : state.phase
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLAYER_JOIN": {
      if (state.phase !== "lobby") return state;
      if (state.players.find(p => p.id === action.player.peerId)) return state;
      return {
        ...state,
        players: [...state.players, {
          id: action.player.peerId,
          name: action.player.name,
          token: action.player.token,
          money: 1500,
          position: 0,
          inJail: false,
          jailTurns: 0,
          jailFreeCards: 0,
          properties: [],
          isBankrupt: false,
          isConnected: true
        }],
        log: logEvent(state, `${action.player.name} joined.`)
      };
    }
    case "GAME_START": {
      return action.initialState;
    }
    case "ROLL_DICE": {
      if (state.hasRolled && action.dice[0] !== action.dice[1]) return state; // Shouldn't happen unless doubles
      
      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      if (pIdx !== state.currentPlayerIndex) return state;
      const player = state.players[pIdx];

      const [d1, d2] = action.dice;
      const isDoubles = d1 === d2;
      const total = d1 + d2;
      let newDoublesCount = isDoubles ? state.doublesCount + 1 : 0;
      
      let nextState = { ...state, diceResult: action.dice as [number, number], log: logEvent(state, `${player.name} rolled ${d1} and ${d2}.`) };
      let newPlayers = [...state.players];
      let newPlayer = { ...player };

      if (player.inJail) {
        if (isDoubles) {
          nextState.log = logEvent(nextState, `${player.name} rolled doubles and gets out of jail!`);
          newPlayer.inJail = false;
          newPlayer.jailTurns = 0;
          newPlayer.position = (newPlayer.position + total) % 40;
          newDoublesCount = 0; // doesn't roll again
        } else {
          newPlayer.jailTurns++;
          if (newPlayer.jailTurns >= 3) {
            if (newPlayer.money < 50) {
              return bankruptPlayer(nextState, player.id);
            }
            newPlayer.money -= 50;
            newPlayer.inJail = false;
            newPlayer.jailTurns = 0;
            newPlayer.position = (newPlayer.position + total) % 40;
            nextState.log = logEvent(nextState, `${player.name} paid $50 to get out of jail.`);
          } else {
            nextState.hasRolled = true;
            nextState.doublesCount = 0;
            newPlayers[pIdx] = newPlayer;
            return { ...nextState, players: newPlayers };
          }
        }
      } else {
        if (newDoublesCount === 3) {
          nextState.log = logEvent(nextState, `${player.name} rolled doubles 3 times. Go to Jail!`);
          newPlayer.inJail = true;
          newPlayer.position = 10;
          newDoublesCount = 0;
          nextState.hasRolled = true;
          newPlayers[pIdx] = newPlayer;
          return { ...nextState, players: newPlayers, doublesCount: 0 };
        }
        
        const oldPos = newPlayer.position;
        newPlayer.position = (newPlayer.position + total) % 40;
        if (newPlayer.position < oldPos) {
          newPlayer.money += 200;
          nextState.log = logEvent(nextState, `${player.name} passed GO, collected $200.`);
        }
      }

      newPlayers[pIdx] = newPlayer;
      nextState.players = newPlayers;
      nextState.doublesCount = newDoublesCount;
      nextState.hasRolled = !isDoubles;

      // Handle space landing
      const space = getSpace(newPlayer.position);
      if (!space) return nextState;

      if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
        const prop = nextState.properties.find(p => p.spaceId === space.id);
        if (!prop?.ownerId) {
          nextState.pendingAction = "buy_property";
          nextState.pendingSpaceId = space.id;
        } else if (prop.ownerId !== player.id && !prop.mortgaged) {
          nextState.pendingAction = "pay_rent";
          nextState.pendingSpaceId = space.id;
        }
      } else if (space.type === "tax") {
        nextState.pendingAction = null;
        if (newPlayer.money < (space.amount || 0)) {
          return bankruptPlayer(nextState, player.id);
        }
        newPlayer.money -= space.amount || 0;
        nextState.log = logEvent(nextState, `${player.name} paid ${space.name} $${space.amount}.`);
      } else if (space.type === "go_to_jail") {
        newPlayer.inJail = true;
        newPlayer.position = 10;
        nextState.hasRolled = true;
        nextState.log = logEvent(nextState, `${player.name} went to jail.`);
      } else if (space.type === "chance") {
        nextState.pendingAction = "card";
        nextState.pendingCardDeck = "chance";
      } else if (space.type === "community_chest") {
        nextState.pendingAction = "card";
        nextState.pendingCardDeck = "community_chest";
      }

      nextState.players[pIdx] = newPlayer;
      return nextState;
    }

    case "BUY_PROPERTY": {
      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];
      const space = getSpace(action.spaceId);
      if (!space || !space.price || player.money < space.price) return state;

      const newPlayers = [...state.players];
      newPlayers[pIdx] = {
        ...player,
        money: player.money - space.price,
        properties: [...player.properties, space.id]
      };

      const newProps = state.properties.map(p => p.spaceId === action.spaceId ? { ...p, ownerId: player.id } : p);

      return {
        ...state,
        players: newPlayers,
        properties: newProps,
        pendingAction: null,
        pendingSpaceId: null,
        log: logEvent(state, `${player.name} bought ${space.name} for $${space.price}.`)
      };
    }

    case "DECLINE_PROPERTY": {
      return {
        ...state,
        pendingAction: null,
        pendingSpaceId: null,
        log: logEvent(state, `Property auction skipped.`)
      };
    }

    case "PAY_RENT": {
      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];
      const space = getSpace(action.spaceId);
      const prop = state.properties.find(p => p.spaceId === action.spaceId);
      if (!space || !prop || !prop.ownerId) return state;
      
      const ownerIdx = state.players.findIndex(p => p.id === prop.ownerId);
      const owner = state.players[ownerIdx];
      
      const dTotal = state.diceResult ? state.diceResult[0] + state.diceResult[1] : 0;
      const rent = calculateRent(action.spaceId, state, dTotal);

      if (player.money < rent) {
        return bankruptPlayer(state, player.id);
      }

      const newPlayers = [...state.players];
      newPlayers[pIdx] = { ...player, money: player.money - rent };
      newPlayers[ownerIdx] = { ...owner, money: owner.money + rent };

      return {
        ...state,
        players: newPlayers,
        pendingAction: null,
        pendingSpaceId: null,
        log: logEvent(state, `${player.name} paid $${rent} rent to ${owner.name} for ${space.name}.`)
      };
    }

    case "DRAW_CARD": {
      const deck = action.deck === "chance" ? state.chanceDeck : state.communityChestDeck;
      const discard = action.deck === "chance" ? state.chanceDiscardPile : state.communityChestDiscardPile;
      
      let nextDeck = [...deck];
      let nextDiscard = [...discard];
      
      if (nextDeck.length === 0) {
        nextDeck = nextDiscard.sort(() => Math.random() - 0.5);
        nextDiscard = [];
      }
      
      const cardId = nextDeck.shift() || action.cardId; // use action.cardId as fallback or force
      
      return {
        ...state,
        pendingCardId: cardId,
        [action.deck === "chance" ? "chanceDeck" : "communityChestDeck"]: nextDeck,
        [action.deck === "chance" ? "chanceDiscardPile" : "communityChestDiscardPile"]: nextDiscard,
      };
    }

    case "RESOLVE_CARD": {
      if (!state.pendingCardId || !state.pendingCardDeck) return state;
      const cardDef = state.pendingCardDeck === "chance" 
        ? CHANCE_CARDS.find(c => c.id === state.pendingCardId)
        : COMMUNITY_CHEST_CARDS.find(c => c.id === state.pendingCardId);
      
      if (!cardDef) return state;

      const pIdx = state.currentPlayerIndex;
      const player = state.players[pIdx];
      let nextState: GameState = { ...state, pendingAction: null, pendingCardId: null, pendingCardDeck: null };
      let newPlayer = { ...player };

      nextState.log = logEvent(nextState, `${player.name} drew: ${cardDef.text}`);

      let discardCard = true;

      switch(cardDef.action) {
        case "advance":
          const target = cardDef.target!;
          const oldPos = newPlayer.position;
          newPlayer.position = target;
          if (cardDef.collect200 && target < oldPos) {
            newPlayer.money += 200;
          }
          // evaluate space!
          break;
        case "collect":
          newPlayer.money += cardDef.amount!;
          break;
        case "pay":
          if (newPlayer.money < cardDef.amount!) return bankruptPlayer(nextState, player.id);
          newPlayer.money -= cardDef.amount!;
          break;
        case "jail_free":
          newPlayer.jailFreeCards++;
          discardCard = false;
          if (state.pendingCardDeck === "chance") nextState.jailFreeCardsInDeck.chance = false;
          else nextState.jailFreeCardsInDeck.communityChest = false;
          break;
        case "go_to_jail":
          newPlayer.inJail = true;
          newPlayer.position = 10;
          nextState.hasRolled = true;
          break;
        case "move_relative":
          newPlayer.position = (newPlayer.position + cardDef.amount! + 40) % 40;
          break;
        case "nearest_railroad":
          const nr = nearestRailroad(newPlayer.position);
          if (nr < newPlayer.position) newPlayer.money += 200;
          newPlayer.position = nr;
          break;
        case "nearest_utility":
          const nu = nearestUtility(newPlayer.position);
          if (nu < newPlayer.position) newPlayer.money += 200;
          newPlayer.position = nu;
          break;
        case "repairs":
          let h = 0, ht = 0;
          newPlayer.properties.forEach(pid => {
            const pr = state.properties.find(p => p.spaceId === pid);
            if (pr) {
              if (pr.houses === 5) ht++;
              else h += pr.houses;
            }
          });
          const cost = h * cardDef.house! + ht * cardDef.hotel!;
          if (newPlayer.money < cost) return bankruptPlayer(nextState, player.id);
          newPlayer.money -= cost;
          break;
        case "pay_each_player":
          const eCost = cardDef.amount! * (state.players.length - 1);
          if (newPlayer.money < eCost) return bankruptPlayer(nextState, player.id);
          newPlayer.money -= eCost;
          nextState.players = state.players.map((p, i) => {
            if (i === pIdx) return newPlayer;
            return { ...p, money: p.money + cardDef.amount! };
          });
          break;
        case "collect_from_each":
          let collected = 0;
          nextState.players = state.players.map((p, i) => {
            if (i === pIdx) return p; // handled after
            const payAmt = Math.min(p.money, cardDef.amount!); // simplify: take what they have
            collected += payAmt;
            return { ...p, money: p.money - payAmt }; // potential bankruptcy ignored for simplicity on edge cases
          });
          newPlayer.money += collected;
          nextState.players[pIdx] = newPlayer;
          break;
      }

      if (discardCard) {
        if (state.pendingCardDeck === "chance") nextState.chanceDiscardPile.push(cardDef.id);
        else nextState.communityChestDiscardPile.push(cardDef.id);
      }

      if (!["pay_each_player", "collect_from_each"].includes(cardDef.action)) {
        const newPlayers = [...state.players];
        newPlayers[pIdx] = newPlayer;
        nextState.players = newPlayers;
      }

      // Re-evaluate position if moved
      if (["advance", "move_relative", "nearest_railroad", "nearest_utility"].includes(cardDef.action)) {
         const np = nextState.players[pIdx];
         const s = getSpace(np.position);
         if (s && (s.type === "property" || s.type === "railroad" || s.type === "utility")) {
            const prop = nextState.properties.find(p => p.spaceId === s.id);
            if (!prop?.ownerId) {
              nextState.pendingAction = "buy_property";
              nextState.pendingSpaceId = s.id;
            } else if (prop.ownerId !== player.id && !prop.mortgaged) {
              nextState.pendingAction = "pay_rent";
              nextState.pendingSpaceId = s.id;
            }
         } else if (s && s.type === "tax") {
            if (np.money < (s.amount||0)) return bankruptPlayer(nextState, np.id);
            np.money -= (s.amount||0);
         }
      }

      return nextState;
    }

    case "BUILD_HOUSE": {
      if (!canBuildHouse(action.spaceId, state)) return state;
      const space = getSpace(action.spaceId);
      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];
      if (!space || !space.houseCost || player.money < space.houseCost || state.bankHouses < 1) return state;

      const newPlayers = [...state.players];
      newPlayers[pIdx] = { ...player, money: player.money - space.houseCost };
      
      const newProps = state.properties.map(p => p.spaceId === action.spaceId ? { ...p, houses: p.houses + 1 } : p);

      return {
        ...state,
        players: newPlayers,
        properties: newProps,
        bankHouses: state.bankHouses - 1,
        log: logEvent(state, `${player.name} built a house on ${space.name}.`)
      };
    }

    case "BUILD_HOTEL": {
      if (!canBuildHotel(action.spaceId, state)) return state;
      const space = getSpace(action.spaceId);
      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];
      if (!space || !space.houseCost || player.money < space.houseCost || state.bankHotels < 1) return state;

      const newPlayers = [...state.players];
      newPlayers[pIdx] = { ...player, money: player.money - space.houseCost };
      
      const newProps = state.properties.map(p => p.spaceId === action.spaceId ? { ...p, houses: 5 } : p);

      return {
        ...state,
        players: newPlayers,
        properties: newProps,
        bankHouses: state.bankHouses + 4, // 4 houses return
        bankHotels: state.bankHotels - 1,
        log: logEvent(state, `${player.name} built a hotel on ${space.name}.`)
      };
    }

    case "SELL_HOUSE": {
      const space = getSpace(action.spaceId);
      const prop = state.properties.find(p => p.spaceId === action.spaceId);
      if (!space || !prop || prop.houses <= 0 || prop.houses === 5) return state; // can't sell if hotel (must sell hotel first)

      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];

      const newPlayers = [...state.players];
      newPlayers[pIdx] = { ...player, money: player.money + (space.houseCost || 0) / 2 };
      
      const newProps = state.properties.map(p => p.spaceId === action.spaceId ? { ...p, houses: p.houses - 1 } : p);

      return {
        ...state,
        players: newPlayers,
        properties: newProps,
        bankHouses: state.bankHouses + 1,
        log: logEvent(state, `${player.name} sold a house on ${space.name}.`)
      };
    }

    case "SELL_HOTEL": {
      const space = getSpace(action.spaceId);
      const prop = state.properties.find(p => p.spaceId === action.spaceId);
      if (!space || !prop || prop.houses !== 5 || state.bankHouses < 4) return state; 
      // strict monopoly: must have 4 houses to replace hotel. If bank lacks houses, this could be blocked, or we just drop to 0. We enforce 4 houses return.

      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];

      const newPlayers = [...state.players];
      newPlayers[pIdx] = { ...player, money: player.money + (space.houseCost || 0) / 2 };
      
      const newProps = state.properties.map(p => p.spaceId === action.spaceId ? { ...p, houses: 4 } : p);

      return {
        ...state,
        players: newPlayers,
        properties: newProps,
        bankHouses: state.bankHouses - 4,
        bankHotels: state.bankHotels + 1,
        log: logEvent(state, `${player.name} sold a hotel on ${space.name}.`)
      };
    }

    case "MORTGAGE": {
      if (!canMortgage(action.spaceId, state)) return state;
      const space = getSpace(action.spaceId);
      const prop = state.properties.find(p => p.spaceId === action.spaceId);
      if (!space || !prop || !space.mortgage) return state;

      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];

      const newPlayers = [...state.players];
      newPlayers[pIdx] = { ...player, money: player.money + space.mortgage };

      const newProps = state.properties.map(p => p.spaceId === action.spaceId ? { ...p, mortgaged: true } : p);

      return {
        ...state,
        players: newPlayers,
        properties: newProps,
        log: logEvent(state, `${player.name} mortgaged ${space.name}.`)
      };
    }

    case "UNMORTGAGE": {
      const space = getSpace(action.spaceId);
      const prop = state.properties.find(p => p.spaceId === action.spaceId);
      if (!space || !prop || !space.mortgage || !prop.mortgaged) return state;

      const cost = Math.ceil(space.mortgage * 1.1); // 10% interest
      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];

      if (player.money < cost) return state;

      const newPlayers = [...state.players];
      newPlayers[pIdx] = { ...player, money: player.money - cost };

      const newProps = state.properties.map(p => p.spaceId === action.spaceId ? { ...p, mortgaged: false } : p);

      return {
        ...state,
        players: newPlayers,
        properties: newProps,
        log: logEvent(state, `${player.name} unmortgaged ${space.name}.`)
      };
    }

    case "PAY_JAIL_FINE": {
      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];
      if (!player.inJail || player.money < 50) return state;

      const newPlayers = [...state.players];
      newPlayers[pIdx] = { ...player, money: player.money - 50, inJail: false, jailTurns: 0 };

      return {
        ...state,
        players: newPlayers,
        log: logEvent(state, `${player.name} paid $50 to get out of jail.`)
      };
    }

    case "USE_JAIL_FREE_CARD": {
      const pIdx = state.players.findIndex(p => p.id === action.playerId);
      const player = state.players[pIdx];
      if (!player.inJail || player.jailFreeCards < 1) return state;

      const newPlayers = [...state.players];
      newPlayers[pIdx] = { ...player, jailFreeCards: player.jailFreeCards - 1, inJail: false, jailTurns: 0 };

      // Simplified: return card to chance deck
      const nextChanceDeck = [...state.chanceDeck];
      if (!state.jailFreeCardsInDeck.chance) {
        nextChanceDeck.push("C8");
      }

      return {
        ...state,
        players: newPlayers,
        chanceDeck: nextChanceDeck,
        jailFreeCardsInDeck: { ...state.jailFreeCardsInDeck, chance: true },
        log: logEvent(state, `${player.name} used a Get Out of Jail Free card.`)
      };
    }

    case "END_TURN": {
      if (!state.hasRolled || state.pendingAction) return state; // Must roll and resolve actions first
      
      let nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
      let failsafe = 0;
      while (state.players[nextIdx].isBankrupt && failsafe < state.players.length) {
        nextIdx = (nextIdx + 1) % state.players.length;
        failsafe++;
      }

      const np = state.players[nextIdx];

      return {
        ...state,
        currentPlayerIndex: nextIdx,
        hasRolled: false,
        doublesCount: 0,
        diceResult: null,
        log: logEvent(state, `${np.name}'s turn.`)
      };
    }

    case "STATE_SYNC": {
      return action.state;
    }

    default:
      return state;
  }
}
