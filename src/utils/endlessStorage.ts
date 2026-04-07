import { EndlessRun } from '../types';

const STORAGE_KEY = 'endlessRuns';

export function getAllEndlessRuns(): EndlessRun[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getActiveRun(): EndlessRun | null {
  const runs = getAllEndlessRuns();
  return runs.find(r => r.status !== 'given-up') || null;
}

export function saveEndlessRun(run: EndlessRun): void {
  const runs = getAllEndlessRuns();
  const index = runs.findIndex(r => r.id === run.id);
  if (index >= 0) {
    runs[index] = run;
  } else {
    runs.push(run);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

export function deleteEndlessRun(id: number): void {
  const runs = getAllEndlessRuns().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

export function getNextEndlessId(): number {
  const runs = getAllEndlessRuns();
  if (runs.length === 0) return 1;
  return Math.max(...runs.map(r => r.id)) + 1;
}
