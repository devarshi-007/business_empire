import { BOARD_SPACES, COLOR_GROUPS, RAILROADS, UTILITIES } from "./gameData";
import { GameState } from "./types";

export function getSpace(id: number) {
  return BOARD_SPACES.find(s => s.id === id);
}

export function ownsMonopoly(properties: number[], color: string): boolean {
  const group = COLOR_GROUPS[color as keyof typeof COLOR_GROUPS] || [];
  return group.every(id => properties.includes(id));
}

export function calculateRent(
  spaceId: number, 
  state: GameState, 
  diceTotal: number = 0,
  multiplier: number = 1
): number {
  const space = getSpace(spaceId);
  const propState = state.properties.find(p => p.spaceId === spaceId);
  
  if (!space || !propState || !propState.ownerId || propState.mortgaged) return 0;

  const owner = state.players.find(p => p.id === propState.ownerId);
  if (!owner) return 0;

  if (space.type === "property") {
    if (propState.houses === 0) {
      // Check monopoly
      if (space.color && ownsMonopoly(owner.properties, space.color)) {
        return (space.rent?.[0] || 0) * 2 * multiplier;
      }
      return (space.rent?.[0] || 0) * multiplier;
    } else {
      return (space.rent?.[propState.houses] || 0) * multiplier;
    }
  }

  if (space.type === "railroad") {
    const rrsOwned = owner.properties.filter(p => RAILROADS.includes(p)).length;
    const rents = [0, 25, 50, 100, 200];
    return rents[Math.min(rrsOwned, 4)] * multiplier;
  }

  if (space.type === "utility") {
    const utilsOwned = owner.properties.filter(p => UTILITIES.includes(p)).length;
    if (multiplier > 1) {
      // like the "nearest utility" card: pay 10x
      return diceTotal * 10;
    }
    return diceTotal * (utilsOwned === 2 ? 10 : 4);
  }

  return 0;
}

export function nearestRailroad(currentPos: number): number {
  const rrs = [5, 15, 25, 35];
  for (const rr of rrs) {
    if (rr > currentPos) return rr;
  }
  return rrs[0];
}

export function nearestUtility(currentPos: number): number {
  const utils = [12, 28];
  for (const u of utils) {
    if (u > currentPos) return u;
  }
  return utils[0];
}

export function canBuildHouse(spaceId: number, state: GameState): boolean {
  const propState = state.properties.find(p => p.spaceId === spaceId);
  if (!propState || !propState.ownerId || propState.mortgaged || propState.houses >= 4) return false;

  const space = getSpace(spaceId);
  if (!space || space.type !== "property" || !space.color) return false;

  const owner = state.players.find(p => p.id === propState.ownerId);
  if (!owner) return false;

  if (!ownsMonopoly(owner.properties, space.color)) return false;

  // Build evenly rule
  const group = COLOR_GROUPS[space.color as keyof typeof COLOR_GROUPS] || [];
  const minHousesInGroup = Math.min(
    ...group.map(id => state.properties.find(p => p.spaceId === id)?.houses || 0)
  );

  return propState.houses === minHousesInGroup;
}

export function canBuildHotel(spaceId: number, state: GameState): boolean {
  const propState = state.properties.find(p => p.spaceId === spaceId);
  if (!propState || !propState.ownerId || propState.mortgaged || propState.houses !== 4) return false;

  const space = getSpace(spaceId);
  if (!space || space.type !== "property" || !space.color) return false;

  const owner = state.players.find(p => p.id === propState.ownerId);
  if (!owner) return false;

  if (!ownsMonopoly(owner.properties, space.color)) return false;

  const group = COLOR_GROUPS[space.color as keyof typeof COLOR_GROUPS] || [];
  const minHousesInGroup = Math.min(
    ...group.map(id => state.properties.find(p => p.spaceId === id)?.houses || 0)
  );

  return minHousesInGroup >= 4;
}

export function canMortgage(spaceId: number, state: GameState): boolean {
  const propState = state.properties.find(p => p.spaceId === spaceId);
  if (!propState || !propState.ownerId || propState.mortgaged) return false;

  const space = getSpace(spaceId);
  if (!space || space.type !== "property" || !space.color) return true; // rrs, utils

  // Must have 0 houses on all properties in color group to mortgage one
  const group = COLOR_GROUPS[space.color as keyof typeof COLOR_GROUPS] || [];
  const totalHousesInGroup = group.reduce((sum, id) => {
    return sum + (state.properties.find(p => p.spaceId === id)?.houses || 0);
  }, 0);

  return totalHousesInGroup === 0;
}
