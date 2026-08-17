import { useState, useEffect } from 'react';
import { Character } from '../types';

const TRAVELER_ELEMENTS = ["Anemo", "Geo", "Electro", "Dendro", "Hydro", "Pyro", "Cryo"];

export function useCharacters() {
  const [listChar, setListChar] = useState<Character[]>([]);
  const [isTravEleIncluded, setIsTravEleIncluded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (listChar.length === 0) fetchChars();
  }, []);

  async function fetchChars() {
    setLoading(true);
    try {
      const res = await fetch("/data/char_data.json");
      const result: Character[] = await res.json();
      const filtered = result.filter(c => !["Aether", "Lumine"].includes(c.name));
      const withTraveler = [...filtered, { id: 10000007, name: "Traveler", version: "1.0", rarity: 5 }]
        .map(c => ({ ...c, active: true }))
        .sort((a, b) => a.id - b.id);
      setListChar(withTraveler);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const toggleActive = (id: number) => {
    setListChar(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const toggleTravelerElements = (include: boolean) => {
    setIsTravEleIncluded(include);
    const withoutTraveler = listChar.filter(c => c.name !== "Traveler");
    if (include) {
      // Use dedicated high ID range (90000000+) to avoid clashing with any character from char_data.json
      const travelers = TRAVELER_ELEMENTS.map((el, i) => ({
        id: 90000001 + i, name: "Traveler", version: "1.0",
        rarity: 5, elementText: el, active: true
      }));
      setListChar([...withoutTraveler, ...travelers].sort((a, b) => a.id - b.id));
    } else {
      setListChar([...withoutTraveler, { id: 10000007, name: "Traveler", version: "1.0", rarity: 5, active: true }]
        .sort((a, b) => a.id - b.id));
    }
  };

  return { listChar, setListChar, loading, isTravEleIncluded, toggleActive, toggleTravelerElements };
}
