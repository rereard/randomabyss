import { useState } from 'react';
import { EndlessRun, Character } from '../../types';
import CharIcon from '../CharIcon';

const ELEMENTS = ["Anemo", "Pyro", "Cryo", "Hydro", "Electro", "Geo", "Dendro"];

export interface RunStats {
  rarity: { 4: number; 5: number };
  elements: Record<string, number>;
  chars: Map<number, { char: Character; count: number }>;
}

export function calculateRunStats(run: EndlessRun): RunStats {
  let allUsed = [...run.floorHistory.flatMap(f => f.group)];
  // Only include currentGroup when actively playing a floor (not carry-pick or given-up)
  if (run.status === 'in-floor') {
    allUsed = [...allUsed, ...run.currentGroup];
  }

  const stats: RunStats = {
    rarity: { 4: 0, 5: 0 },
    elements: {},
    chars: new Map()
  };

  allUsed.forEach(char => {
    if (char.rarity === 4) stats.rarity[4]++;
    if (char.rarity === 5) stats.rarity[5]++;
    if (char.elementText) {
      stats.elements[char.elementText] = (stats.elements[char.elementText] || 0) + 1;
    }
    const existing = stats.chars.get(char.id);
    if (existing) existing.count++;
    else stats.chars.set(char.id, { char, count: 1 });
  });

  return stats;
}

interface StatsSummaryProps {
  run: EndlessRun;
  activeChars: Character[];
  wrapperClass?: string;
}

export default function StatsSummary({ run, activeChars, wrapperClass = 'flex-1 flex flex-wrap flex-col gap-3 text-xs md:text-sm items-start px-3 py-2' }: StatsSummaryProps) {
  const [activeElementTab, setActiveElementTab] = useState<string | null>(null);
  const stats = calculateRunStats(run);

  const countBadge = (count: number) => (
    <div className='absolute top-0 right-0 bg-gray-900 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center -mr-2 -mt-2 border border-gray-500 shadow z-50'>
      {count}
    </div>
  );

  return (
    <div className={wrapperClass}>
      {/* Summary Row */}
      <div className='flex flex-row items-center flex-wrap gap-1'>
        <div className='flex items-center gap-1 mr-2'>
          <div className='w-4 h-4 bg-[#9c75b7] rounded'></div> {stats.rarity[4]}
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-4 h-4 bg-[#b27330] rounded'></div> {stats.rarity[5]}
        </div>
        <div className='w-[1px] h-4 bg-gray-600 mx-2'></div>
        {ELEMENTS.map(el => (
          <div
            key={el}
            className={`flex items-center gap-1 cursor-pointer hover:bg-slate-700 p-1 rounded ${activeElementTab === el ? 'bg-slate-700' : ''}`}
            onClick={() => setActiveElementTab(activeElementTab === el ? null : el)}
          >
            <img src={`/assets/Element_${el}.webp`} className='w-5 h-5' alt={el} />
            {stats.elements[el] || 0}
          </div>
        ))}
      </div>

      {/* Element Tab Detail */}
      {activeElementTab && (
        <div className='p-4 bg-slate-900 border border-slate-700 rounded-lg w-full'>
          <div className='flex flex-wrap gap-4'>
            {activeChars
              .filter(c => c.elementText === activeElementTab)
              .map(char => {
                const statData = stats.chars.get(char.id);
                const count = statData ? statData.count : 0;
                return { char, count };
              })
              .sort((a, b) => b.count - a.count)
              .map((c, i) => (
                <div key={i}>
                  <CharIcon
                    char={c.char}
                    size='md'
                    badge={countBadge(c.count)}
                    isDisabled={c.count === 0}
                  />
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
