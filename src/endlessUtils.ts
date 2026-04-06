export interface Character {
  id: number;
  name: string;
  rarity: number;
  elementText?: string;
  images?: Record<string, string>;
  version?: string;
  active?: boolean;
}

export interface FloorRecord {
  floor: number;                    // 1-indexed floor number
  group: Character[];               // the 8 characters used this floor
  openingCharacter: Character;      // which character was the opener
  rerollsUsed: number;              // how many rerolls were consumed
  isFailed?: boolean                // true if the run ended on this floor without clearing it
}

export interface EndlessRun {
  id: number;
  name: string;
  startDate: number;                // Date.now() when run started
  endDate?: number;                 // Date.now() when given up
  status: 'picking-opener' | 'in-floor' | 'picking-carry' | 'given-up';
  currentFloor: number;             // 1-indexed, the floor currently being attempted
  currentGroup: Character[];        // current floor's 8 characters
  previousFloorGroup: Character[];  // last cleared floor's 8 characters ([] for floor 1)
  rerollsRemaining: number;
  rerollsUsedThisFloor: number;     // rerolls consumed on the current floor
  floorHistory: FloorRecord[];      // all cleared floors in order
  disabledOpenerId?: number; 
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getAvailablePool(
  activeChars: Character[],          // listChar.filter(c => c.active)
  previousFloorGroup: Character[]    // [] for floor 1
): Character[] {
  const excludedIds = new Set(previousFloorGroup.map(c => c.id));
  return activeChars.filter(c => !excludedIds.has(c.id));
}

export function formGroup(
  opening: Character,
  availablePool: Character[],       // output of getAvailablePool (opener already excluded from this)
  isTravEleIncluded: boolean
): Character[] {
  const group: Character[] = [opening];
  const usedNames = new Set<string>([opening.name]);
  const candidates = shuffleArray(availablePool);
  for (const candidate of candidates) {
    if (group.length >= 8) break;
    // Skip if same ID as opener (safety check)
    if (candidate.id === opening.id) continue;
    // Traveler dedup: max 1 Traveler name per group
    if (isTravEleIncluded && usedNames.has(candidate.name)) continue;
    group.push(candidate);
    usedNames.add(candidate.name);
  }
  return group;
}

// export function getRerollLimit(currentFloor: number): number {
//   const floorsCleared = currentFloor - 1;
//   return 3 + Math.floor(floorsCleared / 5);
// }

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
