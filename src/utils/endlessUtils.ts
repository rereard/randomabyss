import { Character } from '../types';

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getAvailablePool(
  activeChars: Character[],
  previousFloorGroup: Character[]
): Character[] {
  const excludedIds = new Set(previousFloorGroup.map(c => c.id));
  return activeChars.filter(c => !excludedIds.has(c.id));
}

export function formGroup(
  opening: Character,
  availablePool: Character[],
  isTravEleIncluded: boolean
): Character[] {
  const group: Character[] = [opening];
  const usedNames = new Set<string>([opening.name]);
  const candidates = shuffleArray(availablePool);
  for (const candidate of candidates) {
    if (group.length >= 8) break;
    if (candidate.id === opening.id) continue;
    if (isTravEleIncluded && usedNames.has(candidate.name)) continue;
    group.push(candidate);
    usedNames.add(candidate.name);
  }
  return group;
}

export function getRerollPool(
  activeChars: Character[],
  currentGroup: Character[],
  previousFloorGroup: Character[]
): Character[] {
  const excludedIds = new Set([
    ...currentGroup.map(c => c.id),
    ...previousFloorGroup.map(c => c.id)
  ]);
  return activeChars.filter(c => !excludedIds.has(c.id));
}

export function rerollCharacter(
  currentGroup: Character[],
  targetIndex: number,
  activeChars: Character[],
  previousFloorGroup: Character[],
  isTravEleIncluded: boolean
): { newGroup: Character[]; replacement: Character } | null {
  let pool = getRerollPool(activeChars, currentGroup, previousFloorGroup);
  if (isTravEleIncluded) {
    const otherTravelers = currentGroup.filter(
      (c, i) => i !== targetIndex && c.name === "Traveler"
    );
    if (otherTravelers.length > 0) {
      pool = pool.filter(c => c.name !== "Traveler");
    }
  }
  if (pool.length === 0) return null;
  const replacement = shuffleArray(pool)[0];
  const newGroup = [...currentGroup];
  newGroup[targetIndex] = replacement;
  return { newGroup, replacement };
}
