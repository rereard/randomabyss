import { useState, useEffect } from 'react';
import {
  EndlessRun,
  formGroup, getAvailablePool, rerollCharacter
} from './endlessutils';
import {
  getAllEndlessRuns, getActiveRun, saveEndlessRun, getNextEndlessId
} from './endlessStorage';
import { FaCheck } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { FiRefreshCw } from "react-icons/fi";

interface EndlessModePr {
  listChar: Record<string, any>[];
  isTravEleIncluded: boolean;
  loading: boolean;
  viewingRun: EndlessRun | null;
  setViewingRun: (run: EndlessRun | null) => void;
}

export default function EndlessMode({ listChar, isTravEleIncluded, loading, viewingRun, setViewingRun }: EndlessModePr) {
  const [activeRun, setActiveRun] = useState<EndlessRun | null>(null);
  const [allRuns, setAllRuns] = useState<EndlessRun[]>([]);
  // const [viewingRun, setViewingRun] = useState<EndlessRun | null>(null);
  const [activeElementTab, setActiveElementTab] = useState<string | null>(null);

  useEffect(() => {
    const runs = getAllEndlessRuns();
    setAllRuns(runs);
    const active = getActiveRun();
    if (active) setActiveRun(active);
  }, []);

  const activeChars = listChar.filter(c => c.active);
  const activeCharCount = activeChars.length;
  const isPoolTooSmall = activeCharCount < 16;

  // ═══════════════════ DATE HELPER ═══════════════════
  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString(navigator.language, {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

  // ═══════════════════ HANDLERS ═══════════════════

  const handleStartRun = () => {
    if (isPoolTooSmall || activeRun) return;
    const id = getNextEndlessId();
    const newRun: EndlessRun = {
      id,
      name: `Endless Run ${id}`,
      startDate: Date.now(),
      status: 'picking-opener',
      currentFloor: 1,
      currentGroup: [],
      previousFloorGroup: [],
      rerollsRemaining: 3,
      rerollsUsedThisFloor: 0,
      floorHistory: []
    };
    saveEndlessRun(newRun);
    setActiveRun(newRun);
    setAllRuns(getAllEndlessRuns());
  };

  const handleSelectOpener = (character: Record<string, any>) => {
    if (!activeRun) return;
    // Enforce the constraint! If it's disabled, do nothing.
    if (activeRun.disabledOpenerId === character.id && activeRun.status === 'picking-carry') {
        return; 
    }

    let updatedRun: EndlessRun;

    if (activeRun.status === 'picking-opener') {
      // Floor 1: pool = all active minus the opener
      const pool = activeChars.filter(c => c.id !== character.id);
      const group = formGroup(character as any, pool as any, isTravEleIncluded);
      updatedRun = { ...activeRun, currentGroup: group, status: 'in-floor', rerollsUsedThisFloor: 0, disabledOpenerId: character.id };

    } else if (activeRun.status === 'picking-carry') {
      // Floor N>1: carry from previous floor, exclude prev group from pool
      const newPrevGroup = activeRun.currentGroup;
      const pool = getAvailablePool(activeChars as any, newPrevGroup);
      const group = formGroup(character as any, pool, isTravEleIncluded);
      updatedRun = {
        ...activeRun,
        currentFloor: activeRun.currentFloor + 1,
        currentGroup: group,
        previousFloorGroup: newPrevGroup,
        status: 'in-floor',
        rerollsUsedThisFloor: 0,
        disabledOpenerId: character.id
      };
    } else return;

    saveEndlessRun(updatedRun);
    setActiveRun(updatedRun);
  };

  const handleReroll = (index: number) => {
    if (!activeRun || activeRun.rerollsRemaining <= 0) return;
    const result = rerollCharacter(
      activeRun.currentGroup, index,
      activeChars as any, activeRun.previousFloorGroup,
      isTravEleIncluded
    );
    if (!result) { alert("No characters available for reroll!"); return; }

    const updatedRun: EndlessRun = {
      ...activeRun,
      currentGroup: result.newGroup,
      rerollsRemaining: activeRun.rerollsRemaining - 1,
      rerollsUsedThisFloor: activeRun.rerollsUsedThisFloor + 1
    };
    saveEndlessRun(updatedRun);
    setActiveRun(updatedRun);
  };

  const handleFloorCleared = () => {
    if (!activeRun) return;
    const newHistory = [...activeRun.floorHistory, {
      floor: activeRun.currentFloor,
      group: activeRun.currentGroup,
      openingCharacter: activeRun.currentGroup[0],
      rerollsUsed: activeRun.rerollsUsedThisFloor
    }];
    // +1 reroll bonus every 5 floors cleared
    const bonus = newHistory.length % 5 === 0 ? 1 : 0;
    const updatedRun: EndlessRun = {
      ...activeRun,
      floorHistory: newHistory,
      status: 'picking-carry',
      rerollsRemaining: activeRun.rerollsRemaining + bonus
    };
    saveEndlessRun(updatedRun);
    setActiveRun(updatedRun);
  };

  const handleGiveUp = () => {
    if (!activeRun) return;
    const updatedRun: EndlessRun = { ...activeRun, status: 'given-up', endDate: Date.now() };

    if (activeRun.status === 'in-floor') {
      updatedRun.floorHistory = [
        ...activeRun.floorHistory, 
        {
          floor: activeRun.currentFloor,
          group: activeRun.currentGroup,
          openingCharacter: activeRun.currentGroup[0],
          rerollsUsed: activeRun.rerollsUsedThisFloor,
          isFailed: true // Mark as failed
        }
      ];
    }
    saveEndlessRun(updatedRun);
    setActiveRun(null);
    setAllRuns(getAllEndlessRuns());
  };

  // const handleDeleteRun = (id: number) => {
  //   deleteEndlessRun(id);
  //   setAllRuns(getAllEndlessRuns());
  //   if (viewingRun?.id === id) setViewingRun(null);
  // };

  // ═══════════════════ CHAR CARD HELPER ═══════════════════

  const renderCharIcon = (char: Record<string, any>, size: 'sm' | 'md' = 'md', onClick?: () => void, badge?: React.ReactNode, isDisabled: boolean = false) => {
    const sizeClass = size === 'sm' ? 'w-14 h-14 md:w-16 md:h-16' : 'w-16 h-16 md:w-20 md:h-20';
    const elSize = size === 'sm' ? 'w-5' : 'w-6';
    const visualClass = isDisabled ? 'grayscale opacity-50 cursor-not-allowed' : (onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : '');
    return (
      <div
        className={`${sizeClass} block ${char?.rarity === 4 ? 'bg-[#9c75b7]' : 'bg-[#b27330]'} rounded ${visualClass} relative`}
        onClick={isDisabled ? undefined : onClick}
      >
        {char?.name === "Traveler" ? (
          <>
            {char?.elementText && <img src={`/assets/Element_${char?.elementText}.webp`} alt="element" className={`absolute z-10 top-0 right-0 ${elSize}`} />}
            <img loading='lazy' src="https://static.wikia.nocookie.net/gensin-impact/images/5/59/Traveler_Icon.png" alt="char" />
          </>
        ) : (
          <>
            <img src={`/assets/Element_${char?.elementText}.webp`} alt="element" className={`absolute z-10 top-0 right-0 ${elSize}`} />
            <img loading='lazy' src={`https://gi.yatta.moe/assets/UI/${char?.images?.filename_icon}.png`} alt="char" />
          </>
        )}
        {badge}
      </div>
    );
  };

  const openerBadge = (size: 'sm' | 'md' = 'md') => (
    <span className={`absolute bottom-0 left-0 bg-yellow-500 text-black ${size === 'sm' ? 'text-[8px] px-0.5' : 'text-xs px-1'} rounded-tr font-bold`}>★</span>
  );

  // ═══════════════════ FUNCTIONS ═══════════════════

  const calculateRunStats = (run: EndlessRun) => {
    // 1. Gather characters from all previous floors
    let allUsedCharacters = [...run.floorHistory.flatMap(f => f.group)];
    
    // 2. ONLY count `currentGroup` if we are actively playing a floor.
    // If we are in `picking-carry` or `given-up`, `currentGroup` might be a leftover from the previous floor!
    if (run.status === 'in-floor') {
      allUsedCharacters = [...allUsedCharacters, ...run.currentGroup];
    }

    const stats = {
      rarity: { 4: 0, 5: 0 },
      elements: {} as Record<string, number>,
      chars: new Map<number, { char: any; count: number }>()
    };

    allUsedCharacters.forEach(char => {
      if (char.rarity === 4) stats.rarity[4]++;
      if (char.rarity === 5) stats.rarity[5]++;
      if (char.elementText) {
        if (!stats.elements[char.elementText]) stats.elements[char.elementText] = 0;
        stats.elements[char.elementText]++;
      }
      const existing = stats.chars.get(char.id);
      if (existing) existing.count++;
      else stats.chars.set(char.id, { char, count: 1 });
    });

    return stats;
  };


  // ═══════════════════ PHASE RENDERS ═══════════════════

  const renderSummaryDisplay = (stats: any, wrapperClass = 'flex-1 flex flex-wrap flex-col gap-3 text-xs md:text-sm items-center px-3 py-2') => (
    <div className={wrapperClass}>
      <div className='flex flex-row items-center'>
        <div className='flex items-center gap-1 mr-2'>
          <div className='w-4 h-4 bg-[#9c75b7] rounded'></div> {stats.rarity[4]}
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-4 h-4 bg-[#b27330] rounded'></div> {stats.rarity[5]}
        </div>
        <div className='w-[1px] h-4 bg-gray-600 mx-2'></div>
        
        {["Anemo", "Pyro", "Cryo", "Hydro", "Electro", "Geo", "Dendro"].map(el => (
          <div 
            key={el} 
            className={`flex items-center gap-1 cursor-pointer hover:bg-slate-700 p-1 rounded ${activeElementTab === el ? 'bg-slate-700' : ''}`}
            onClick={() => setActiveElementTab(activeElementTab === el ? null : el)}
          >
            <img src={`/assets/Element_${el}.webp`} className='w-5 h-5' alt={el} /> {stats.elements[el] || 0}
          </div>
        ))}
      </div>
      {activeElementTab && (
        <div className='mb-6 p-4 bg-slate-900 border border-slate-700 rounded-lg w-full'>
          <div className='flex flex-wrap gap-4'>
            {activeChars.filter((c: any) => c.elementText === activeElementTab)
              .map((char: any) => {
                const statData = stats.chars.get(char.id);
                return { char, count: statData ? statData.count : 0 }
              })
              .sort((a, b) => b.count - a.count)
              .map((c, i) => (
                <div key={i}>
                  {renderCharIcon(
                    c.char,
                    'md',
                    undefined,
                    <div className='absolute top-0 right-0 bg-gray-900 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center -mr-2 -mt-2 border border-gray-500 shadow z-50'>
                      {c.count}
                    </div>,
                    c.count === 0 
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );

  const renderClearedFloorsAndStats = (run: EndlessRun) => {
    if (run.floorHistory.length === 0) return null;
    const stats = calculateRunStats(run);
    
    return (
      <div className='mb-4 mt-8 w-full block border-t border-gray-700 pt-6'>
        <h3 className='text-sm sm:text-base font-bold mb-2 xl:mb-0 text-nowrap mr-4'>Cleared Floors & Stats:</h3>
        <div className='flex flex-col lg:flex-row gap-5'>
          {/* Cleared Floors List */}
          <div className='flex-1'>
            {[...run.floorHistory].reverse().map((record) => (
              <div key={record.floor} className='mb-3'>
                <span className='text-sm font-semibold'>Floor {record.floor}:</span>
                <span className='text-xs text-gray-400 ml-2'>(rerolls used: {record.rerollsUsed})</span>
                <div className='flex flex-wrap gap-1 mt-1'>
                  {record.group.map((c, i) => (
                    <div key={i}>{renderCharIcon(c, 'sm', undefined, i === 0 ? openerBadge('sm') : undefined)}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* The Summary UI */}
          {renderSummaryDisplay(stats)}
        </div>
      </div>
    );
  };

  const renderRunList = () => (
    <div>
      <h2 className='text-base sm:text-lg md:text-xl font-bold mb-4'>Endless Mode</h2>
      <p className='text-sm sm:text-base mb-4'>
        A roguelike challenge: form groups of 8, clear floors, carry one character forward, repeat until you give up.
      </p>
      <div className='mb-4'>
        <span className={`text-sm sm:text-base ${isPoolTooSmall ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
          Active characters: {activeCharCount}
          {isPoolTooSmall && ' — Need at least 16! Go to Randomize tab to include more.'}
        </span>
      </div>
      <button
        className={`px-5 md:px-7 py-1 md:py-2 rounded-xl text-base md:text-lg font-semibold mb-6 ${isPoolTooSmall ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'bg-blue-600'}`}
        onClick={handleStartRun}
        disabled={isPoolTooSmall}
      >
        Start New Endless Run
      </button>
    </div>
  );

  const renderPickOpener = () => (
    <div>
      <h2 className='text-base sm:text-lg md:text-xl font-bold mb-2'>
        Floor {activeRun!.currentFloor} — Pick your opening character
      </h2>
      <p className='text-sm sm:text-base mb-4 text-gray-400'>Click a character to select as your opener.</p>
      <div className='flex flex-wrap gap-2 items-center justify-center mb-6'>
        {activeChars.map((char: any, i: number) => (
          <div key={i}>{renderCharIcon(char, 'md', () => handleSelectOpener(char))}</div>
        ))}
      </div>
      <button className='px-5 py-1.5 bg-red-700 rounded-xl text-sm md:text-base font-semibold flex items-center gap-2' onClick={handleGiveUp}><IoClose /> Give Up</button>
    </div>
  );

  const renderInFloor = () => {
    const allUsedCharacters = [
      ...activeRun!.floorHistory.flatMap(f => f.group),
      ...activeRun!.currentGroup
    ];

    const stats = {
      rarity: { 4: 0, 5: 0 },
      elements: {} as Record<string, number>,
      chars: new Map<number, { char: any; count: number }>()
    };

    allUsedCharacters.forEach(char => {
      // Rarity
      if (char.rarity === 4) stats.rarity[4]++;
      if (char.rarity === 5) stats.rarity[5]++;
      // Elements
      if (char.elementText) {
        if (!stats.elements[char.elementText]) stats.elements[char.elementText] = 0;
        stats.elements[char.elementText]++;
      }
      // Individual Character Count
      const existing = stats.chars.get(char.id);
      if (existing) {
        existing.count++;
      } else {
        stats.chars.set(char.id, { char, count: 1 });
      }
    });

    return(
      <div>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4'>
          <h2 className='text-base sm:text-lg md:text-xl font-bold'>Floor {activeRun!.currentFloor}</h2>
          <span className='text-sm sm:text-base text-gray-300'>Rerolls remaining: {activeRun!.rerollsRemaining}</span>
        </div>

        <div className='flex flex-wrap gap-3 items-center justify-center mb-6'>
          {activeRun!.currentGroup.map((char, index) => (
            <div key={index} className='flex flex-col items-center gap-1'>
              {renderCharIcon(char, 'md', undefined, index === 0 ? openerBadge() : undefined)}
              {activeRun!.rerollsRemaining > 0 && (
                <button className='text-sm bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded' onClick={() => handleReroll(index)}><FiRefreshCw /></button>
              )}
            </div>
          ))}
        </div>

        <div className='flex gap-4 justify-center mb-8'>
          <button className='px-5 py-1 md:py-2 bg-green-700 rounded-xl text-sm md:text-base font-semibold flex items-center gap-2' onClick={handleFloorCleared}><FaCheck /> Next Floor</button>
          <button className='px-5 py-1 md:py-2 bg-red-700 rounded-xl text-sm md:text-base font-semibold flex items-center gap-2' onClick={handleGiveUp}><IoClose /> Give Up</button>
        </div>

        {/* cleared floor stat */}
        <div className='mb-4 mt-8'>
          <h3 className='text-sm sm:text-base font-bold mb-2 xl:mb-0 text-nowrap mr-4'>Cleared Floors & Stats:</h3>
          <div className='flex flex-row gap-5'>
            {/* Cleared Floors */}
            <div className='flex-1'>
              {[...activeRun!.floorHistory].reverse().map((record) => (
                <div key={ record.floor} className='mb-3'>
                  <span className='text-sm font-semibold'>Floor {record.floor}:</span>
                  <span className='text-xs text-gray-400 ml-2'>(rerolls used: {record.rerollsUsed})</span>
                  <div className='flex flex-wrap gap-1 mt-1'>
                    {record.group.map((c, i) => (
                      <div key={i}>{renderCharIcon(c, 'sm', undefined, i === 0 ? openerBadge('sm') : undefined)}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Counter Row */}
            <div className='flex-1 flex flex-wrap flex-col gap-3 text-xs md:text-sm items-center px-3 py-2'>
              <div className='flex flex-row items-center'>
                <div className='flex items-center gap-1 mr-2'>
                  <div className='w-4 h-4 bg-[#9c75b7] rounded'></div> {stats.rarity[4]}
                </div>
                <div className='flex items-center gap-1'>
                  <div className='w-4 h-4 bg-[#b27330] rounded'></div> {stats.rarity[5]}
                </div>
                <div className='w-[1px] h-4 bg-gray-600 mx-2'></div> {/* Divider */}
                
                {["Anemo", "Pyro", "Cryo", "Hydro", "Electro", "Geo", "Dendro"].map(el => (
                  <div 
                    key={el} 
                    className={`flex items-center gap-1 cursor-pointer hover:bg-slate-700 p-1 rounded ${activeElementTab === el ? 'bg-slate-700' : ''}`}
                    onClick={() => setActiveElementTab(activeElementTab === el ? null : el)}
                  >
                    <img src={`/assets/Element_${el}.webp`} className='w-5 h-5' alt={el} /> {stats.elements[el] || 0}
                  </div>
                ))}
              </div>

              {activeElementTab && (
                <div className='mb-6 p-4 bg-slate-900 border border-slate-700 rounded-lg'>
                  <div className='flex flex-wrap gap-4'>
                    {activeChars.filter((c: any) => c.elementText === activeElementTab)
                      .map((char: any) => {
                        const statData = stats.chars.get(char.id);
                        const count = statData ? statData.count : 0;
                        return { char, count }
                      })
                      .sort((a, b) => b.count - a.count)
                      .map((c, i) => (
                        <div key={i}>
                          {renderCharIcon(
                            c.char,
                            'md',
                            undefined, // no onClick needed for stats
                            // Custom Badge for Count
                            <div className='absolute top-0 right-0 bg-gray-900 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center -mr-2 -mt-2 border border-gray-500 shadow z-50'>
                              {c.count}
                            </div>,
                            // 5. If count is 0, pass 'true' to the isDisabled parameter!
                            c.count === 0 
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  const renderPickCarry = () => {
    const floorsCleared = activeRun!.floorHistory.filter(f => !f.isFailed).length;
    const gotBonus = floorsCleared > 0 && floorsCleared % 5 === 0;
    return (
      <div>
        <h2 className='text-base sm:text-lg md:text-xl font-bold mb-2'>Floor {activeRun!.currentFloor} Cleared!</h2>
        {gotBonus && (
          <p className='text-sm sm:text-base text-green-400 font-semibold mb-2'>
            +1 reroll gained! ({floorsCleared} floors cleared)
          </p>
        )}
        <p className='text-sm sm:text-base mb-4 text-gray-400'>Pick a character to carry to Floor {activeRun!.currentFloor + 1}:</p>
        <div className='flex flex-wrap gap-2 items-center justify-center mb-6'>
          {activeRun!.currentGroup.map((char, i) => {
             // Disable the character that was the opener for the current floor
             const isDisabled = char.id === activeRun!.disabledOpenerId;
             return (
               <div key={i}>
                 {renderCharIcon(char, 'md', () => handleSelectOpener(char), undefined, isDisabled)}
               </div>
             )
          })}
        </div>
        <button className='px-5 py-2 bg-red-700 rounded-xl text-sm md:text-base font-semibold flex items-center gap-2' onClick={handleGiveUp}><IoClose /> Give Up</button>
      </div>
    );
  };

  const renderRunHistory = (run: EndlessRun) => (
    <div>
      <button className='text-sm text-blue-400 underline mb-4' onClick={() => setViewingRun(null)}>← Back</button>
      <h2 className='text-base sm:text-lg md:text-xl font-bold mb-1'>{run.name}</h2>
      <p className='text-sm text-gray-400 mb-1'>
        Started: {formatDate(run.startDate)}{run.endDate && ` | Ended: ${formatDate(run.endDate)}`}
      </p>
      <p className='text-sm text-gray-300 mb-4'>Floors cleared: {run.floorHistory.filter(f => !f.isFailed).length}</p>
      {run.floorHistory.length === 0 ? (
        <p className='text-gray-500 italic'>No floors cleared in this run.</p>
      ) : (
        [...run.floorHistory].reverse().map(record => (
          <div key={record.floor} className='mb-4'>
            <span className={`text-sm font-bold ${record.isFailed ? 'text-red-400' : ''}`}>Floor {record.floor} {record.isFailed ? '❌ (Failed)' : '✓'}</span>
            <span className='text-xs text-gray-400 ml-2'>(rerolls used: {record.rerollsUsed})</span>
            <div className='flex flex-wrap gap-1 mt-1'>
              {record.group.map((c, i) => (
                <div key={i}>{renderCharIcon(c, 'sm', undefined, i === 0 ? openerBadge('sm') : undefined)}</div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ═══════════════════ MAIN RENDER ═══════════════════

  if (loading) {
    return <div className='flex justify-center items-center text-lg font-bold italic text-gray-500'>Loading data...</div>;
  }

  return (
    <div>
      {!activeRun && !viewingRun && renderRunList()}
      {!activeRun && viewingRun && renderRunHistory(viewingRun)}
      {activeRun?.status === 'picking-opener' && renderPickOpener()}
      {activeRun?.status === 'in-floor' && renderInFloor()}
      {activeRun?.status === 'picking-carry' && renderPickCarry()}
    </div>
  );
}
