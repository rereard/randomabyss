// ═══════════════════ Character Types ═══════════════════

export interface Character {
  id: number;
  name: string;
  rarity: number;
  elementText?: string;
  images?: Record<string, string>;
  version?: string;
  active?: boolean;
}

// ═══════════════════ Endless Mode Types ═══════════════════

export interface FloorRecord {
  floor: number;                    // 1-indexed floor number
  group: Character[];               // the 8 characters used this floor
  openingCharacter: Character;      // which character was the opener
  rerollsUsed: number;              // how many rerolls were consumed
  isFailed?: boolean;               // true if the run ended on this floor without clearing it
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

// ═══════════════════ Normal Mode Types ═══════════════════

export interface SavedGroup {
  id: number;
  name: string;
  date: number;
  groups: { group: Character[]; star: number }[];
}