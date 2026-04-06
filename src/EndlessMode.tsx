import { useState, useEffect } from 'react';
import {
  EndlessRun,
  formGroup, getAvailablePool, rerollCharacter
} from './endlessutils';
import {
  getAllEndlessRuns, getActiveRun, saveEndlessRun,
  deleteEndlessRun, getNextEndlessId
} from './endlessStorage';
import { FaTrashAlt } from "react-icons/fa";

interface EndlessModePr {
  listChar: Record<string, any>[];
  isTravEleIncluded: boolean;
  loading: boolean;
}

export default function EndlessMode({ listChar, isTravEleIncluded, loading }: EndlessModePr) {
  const [activeRun, setActiveRun] = useState<EndlessRun | null>(null);
  const [allRuns, setAllRuns] = useState<EndlessRun[]>([]);
  const [viewingRun, setViewingRun] = useState<EndlessRun | null>(null);

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

  const handleDeleteRun = (id: number) => {
    deleteEndlessRun(id);
    setAllRuns(getAllEndlessRuns());
    if (viewingRun?.id === id) setViewingRun(null);
  };

  // ═══════════════════ CHAR CARD HELPER ═══════════════════

  const renderCharIcon = (char: Record<string, any>, size: 'sm' | 'md' = 'md', onClick?: () => void, badge?: React.ReactNode, isDisabled: boolean = false) => {
    const sizeClass = size === 'sm' ? 'w-10 h-10 md:w-12 md:h-12' : 'w-16 h-16 md:w-20 md:h-20';
    const elSize = size === 'sm' ? 'w-3' : 'w-5';
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

  // ═══════════════════ PHASE RENDERS ═══════════════════

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

      {allRuns.filter(r => r.status === 'given-up').length > 0 && (
        <div>
          <h3 className='text-sm sm:text-base md:text-lg font-bold mb-2 mt-4'>Past Runs</h3>
          {[...allRuns.filter(r => r.status === 'given-up')].reverse().map(run => (
            <div key={run.id} className='flex justify-between items-center border-t-2 py-3 border-gray-700'>
              <div className='flex gap-4'>
                <button className='text-red-700' onClick={() => handleDeleteRun(run.id)}><FaTrashAlt /></button>
                <div>
                  <h4 className='text-base md:text-lg font-bold'>{run.name}</h4>
                  <span className='italic text-sm md:text-base text-gray-400'>{formatDate(run.startDate)}</span>
                  <div className='text-sm md:text-base text-gray-300'>Floors cleared: {run.floorHistory.filter(f => !f.isFailed).length}</div>
                </div>
              </div>
              <button className='border text-base md:text-xl p-2 rounded-full' onClick={() => setViewingRun(run)}>▶</button>
            </div>
          ))}
        </div>
      )}
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
      <button className='px-5 py-1 bg-red-700 rounded-xl text-sm md:text-base font-semibold' onClick={handleGiveUp}>Give Up ✗</button>
    </div>
  );

  const renderInFloor = () => (
    <div>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4'>
        <h2 className='text-base sm:text-lg md:text-xl font-bold'>Floor {activeRun!.currentFloor}</h2>
        <span className='text-sm sm:text-base text-gray-300'>🎲 Rerolls remaining: {activeRun!.rerollsRemaining}</span>
      </div>

      <div className='flex flex-wrap gap-3 items-center justify-center mb-6'>
        {activeRun!.currentGroup.map((char, index) => (
          <div key={index} className='flex flex-col items-center gap-1'>
            {renderCharIcon(char, 'md', undefined, index === 0 ? openerBadge() : undefined)}
            {activeRun!.rerollsRemaining > 0 && (
              <button className='text-xs bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded' onClick={() => handleReroll(index)}>🔄</button>
            )}
          </div>
        ))}
      </div>

      <div className='flex gap-4 justify-center mb-8'>
        <button className='px-5 py-1 md:py-2 bg-green-700 rounded-xl text-sm md:text-base font-semibold' onClick={handleFloorCleared}>Floor Cleared ✓</button>
        <button className='px-5 py-1 md:py-2 bg-red-700 rounded-xl text-sm md:text-base font-semibold' onClick={handleGiveUp}>Give Up ✗</button>
      </div>

      {activeRun!.floorHistory.length > 0 && (
        <div>
          <h3 className='text-sm sm:text-base font-bold mb-2'>Cleared Floors:</h3>
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
      )}
    </div>
  );

  const renderPickCarry = () => {
    const floorsCleared = activeRun!.floorHistory.filter(f => !f.isFailed).length;
    const gotBonus = floorsCleared > 0 && floorsCleared % 5 === 0;
    return (
      <div>
        <h2 className='text-base sm:text-lg md:text-xl font-bold mb-2'>Floor {activeRun!.currentFloor} Cleared! 🎉</h2>
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
        <button className='px-5 py-1 bg-red-700 rounded-xl text-sm md:text-base font-semibold' onClick={handleGiveUp}>Give Up ✗</button>
      </div>
    );
  };

  const renderRunHistory = (run: EndlessRun) => (
    <div>
      <button className='text-sm text-blue-400 underline mb-4' onClick={() => setViewingRun(null)}>← Back to run list</button>
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
