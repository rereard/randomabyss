import { useState } from 'react';
import { Character, SavedGroup } from '../types';

export function useSavedGroups() {
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>(
    JSON.parse(localStorage.getItem('savedGroups') || 'null') || []
  );
  const [storageId, setStorageId] = useState(0);

  const persistGroups = (groups: SavedGroup[]) => {
    setSavedGroups(groups);
    localStorage.setItem('savedGroups', JSON.stringify(groups));
  };

  const saveNewResult = (groups: { group: Character[]; star: number }[]) => {
    const existing = JSON.parse(localStorage.getItem('savedGroups') || 'null') || [];
    const nextId = existing.length > 0 ? existing[existing.length - 1].id + 1 : 1;
    const newEntry: SavedGroup = { id: nextId, groups, name: `Saved result ${nextId}`, date: Date.now() };
    const updated = [...existing, newEntry];
    persistGroups(updated);
    setStorageId(nextId);
    return groups;
  };

  const deleteResult = (id: number) => {
    persistGroups(savedGroups.filter(g => g.id !== id));
  };

  const updateStar = (resultId: number, groupIndex: number, delta: number, currentResult: any[]) => {
    const updated = currentResult.map((g, i) => i === groupIndex ? { ...g, star: Math.max(0, Math.min(9, g.star + delta)) } : g);
    const updatedGroups = savedGroups.map(g => g.id === resultId ? { ...g, groups: updated } : g);
    persistGroups(updatedGroups);
    return updated;
  };

  const reorderInGroup = (resultId: number, groupIndex: number, fromIndex: number, toIndex: number, currentResult: any[]) => {
    const updated = currentResult.map((g, i) => {
      if (i !== groupIndex) return g;
      const newGroup = [...g.group];
      [newGroup[fromIndex], newGroup[toIndex]] = [newGroup[toIndex], newGroup[fromIndex]];
      return { ...g, group: newGroup };
    });
    const updatedGroups = savedGroups.map(g => g.id === resultId ? { ...g, groups: updated } : g);
    persistGroups(updatedGroups);
    return updated;
  };

  return { savedGroups, storageId, setStorageId, saveNewResult, deleteResult, updateStar, reorderInGroup };
}
