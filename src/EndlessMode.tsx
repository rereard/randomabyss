import { useState, useEffect } from 'react';
import { EndlessRun, Character } from './types';
import { formGroup, getAvailablePool, rerollCharacter } from './utils/endlessUtils';
import { getActiveRun, saveEndlessRun, getNextEndlessId } from './utils/endlessStorage';
import { FaCheck } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { FiRefreshCw } from "react-icons/fi";
import CharIcon from './components/CharIcon';
import FloorHistory from './components/endless/FloorHistory';
import StatsSummary from './components/endless/StatsSummary';

interface EndlessModeProps {
  listChar: Character[];
  isTravEleIncluded: boolean;
  loading: boolean;
  viewingRun: EndlessRun | null;
  setViewingRun: (run: EndlessRun | null) => void;
}

const openerBadge = () => (
  <span className='absolute bottom-0 left-0 bg-yellow-500 text-black text-xs px-1 rounded-tr font-bold'>★</span>
);

export default function EndlessMode({ listChar, isTravEleIncluded, loading, viewingRun, setViewingRun }: EndlessModeProps) {
  const [activeRun, setActiveRun] = useState<EndlessRun | null>(null);

  useEffect(() => {
    const active = getActiveRun();
    if (active) setActiveRun(active);
  }, []);

  const activeChars = listChar.filter(c => c.active);
  const activeCharCount = activeChars.length;
  const isPoolTooSmall = activeCharCount < 16;

  // ═══════════════════ HANDLERS ═══════════════════

  const handleStartRun = () => {
    if (isPoolTooSmall || activeRun) return;
    const id = getNextEndlessId();
    const newRun: EndlessRun = {
      id, name: `Endless Run ${id}`, startDate: Date.now(),
      status: 'picking-opener', currentFloor: 1,
      currentGroup: [], previousFloorGroup: [],
      rerollsRemaining: 3, rerollsUsedThisFloor: 0, floorHistory: []
    };
    saveEndlessRun(newRun);
    setActiveRun(newRun);
  };

  const handleSelectOpener = (character: Character) => {
    if (!activeRun) return;
    if (activeRun.disabledOpenerId === character.id && activeRun.status === 'picking-carry') return;

    let updatedRun: EndlessRun;

    if (activeRun.status === 'picking-opener') {
      const pool = activeChars.filter(c => c.id !== character.id);
      const group = formGroup(character, pool, isTravEleIncluded);
      updatedRun = { ...activeRun, currentGroup: group, status: 'in-floor', rerollsUsedThisFloor: 0, disabledOpenerId: character.id };
    } else if (activeRun.status === 'picking-carry') {
      const newPrevGroup = activeRun.currentGroup;
      const pool = getAvailablePool(activeChars, newPrevGroup);
      const group = formGroup(character, pool, isTravEleIncluded);
      updatedRun = {
        ...activeRun, currentFloor: activeRun.currentFloor + 1,
        currentGroup: group, previousFloorGroup: newPrevGroup,
        status: 'in-floor', rerollsUsedThisFloor: 0, disabledOpenerId: character.id
      };
    } else return;

    saveEndlessRun(updatedRun);
    setActiveRun(updatedRun);
  };

  const handleReroll = (index: number) => {
    if (!activeRun || activeRun.rerollsRemaining <= 0) return;
    const result = rerollCharacter(activeRun.currentGroup, index, activeChars, activeRun.previousFloorGroup, isTravEleIncluded);
    if (!result) { alert("No characters available for reroll!"); return; }
    const updatedRun: EndlessRun = {
      ...activeRun, currentGroup: result.newGroup,
      rerollsRemaining: activeRun.rerollsRemaining - 1,
      rerollsUsedThisFloor: activeRun.rerollsUsedThisFloor + 1
    };
    saveEndlessRun(updatedRun);
    setActiveRun(updatedRun);
  };

  const handleFloorCleared = () => {
    if (!activeRun) return;
    const newHistory = [...activeRun.floorHistory, {
      floor: activeRun.currentFloor, group: activeRun.currentGroup,
      openingCharacter: activeRun.currentGroup[0], rerollsUsed: activeRun.rerollsUsedThisFloor
    }];
    const bonus = newHistory.filter(f => !f.isFailed).length % 5 === 0 ? 1 : 0;
    const updatedRun: EndlessRun = {
      ...activeRun, floorHistory: newHistory,
      status: 'picking-carry', rerollsRemaining: activeRun.rerollsRemaining + bonus
    };
    saveEndlessRun(updatedRun);
    setActiveRun(updatedRun);
  };

  const handleGiveUp = () => {
    if (!activeRun) return;
    const updatedRun: EndlessRun = { ...activeRun, status: 'given-up', endDate: Date.now() };
    if (activeRun.status === 'in-floor') {
      updatedRun.floorHistory = [...activeRun.floorHistory, {
        floor: activeRun.currentFloor, group: activeRun.currentGroup,
        openingCharacter: activeRun.currentGroup[0],
        rerollsUsed: activeRun.rerollsUsedThisFloor, isFailed: true
      }];
    }
    saveEndlessRun(updatedRun);
    setActiveRun(null);
  };

  // ═══════════════════ PHASE RENDERS ═══════════════════

  const renderRunList = () => (
    <div>
      <h2 className='text-base sm:text-lg md:text-xl font-bold mb-4'>Endless Mode</h2>
      <p className='text-sm sm:text-base mb-4'>
        Form groups of 8, clear floors, carry one character forward, repeat until you give up.
      </p>
      <div className='mb-4'>
        <span className={`text-sm sm:text-base ${isPoolTooSmall ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
          Active characters: {activeCharCount} (Change active characters in Randomize tab)
          {isPoolTooSmall && ' — Need at least 16!'}
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
        {activeChars.map((char, i) => (
          <CharIcon key={i} char={char} size='md' onClick={() => handleSelectOpener(char)} />
        ))}
      </div>
      <button className='px-5 py-1.5 bg-red-700 rounded-xl text-sm md:text-base font-semibold flex items-center gap-2' onClick={handleGiveUp}>
        <IoClose /> Give Up
      </button>
    </div>
  );

  const renderInFloor = () => (
    <div>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4'>
        <h2 className='text-base sm:text-lg md:text-xl font-bold'>Floor {activeRun!.currentFloor}</h2>
        <span className='text-sm sm:text-base text-gray-300'>Rerolls remaining: {activeRun!.rerollsRemaining}</span>
      </div>
      <div className='flex flex-wrap gap-3 items-center justify-center mb-6'>
        {activeRun!.currentGroup.map((char, index) => (
          <div key={index} className='flex flex-col items-center gap-1'>
            <CharIcon char={char} size='md' badge={index === 0 ? openerBadge() : undefined} />
            {activeRun!.rerollsRemaining > 0 && (
              <button className='text-sm bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded' onClick={() => handleReroll(index)}>
                <FiRefreshCw />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className='flex gap-4 justify-center mb-8'>
        <button className='px-5 py-1 md:py-2 bg-green-700 rounded-xl text-sm md:text-base font-semibold flex items-center gap-2' onClick={handleFloorCleared}>
          <FaCheck /> Next Floor
        </button>
        <button className='px-5 py-1 md:py-2 bg-red-700 rounded-xl text-sm md:text-base font-semibold flex items-center gap-2' onClick={handleGiveUp}>
          <IoClose /> Give Up
        </button>
      </div>
      <FloorHistory run={activeRun!} activeChars={activeChars} />
    </div>
  );

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
          {activeRun!.currentGroup.map((char, i) => (
            <CharIcon
              key={i} char={char} size='md'
              onClick={() => handleSelectOpener(char)}
              isDisabled={char.id === activeRun!.disabledOpenerId}
            />
          ))}
        </div>
        <button className='px-5 py-2 bg-red-700 rounded-xl text-sm md:text-base font-semibold flex items-center gap-2' onClick={handleGiveUp}>
          <IoClose /> Give Up
        </button>
        <FloorHistory run={activeRun!} activeChars={activeChars} />
      </div>
    );
  };

  const renderRunHistory = (run: EndlessRun) => (
    <div>
      <button className='text-sm text-blue-400 underline mb-4' onClick={() => setViewingRun(null)}>← Back</button>
      <h2 className='text-base sm:text-lg md:text-xl font-bold mb-1'>{run.name}</h2>
      <p className='text-sm text-gray-400 mb-1'>
        Started: {new Date(run.startDate).toLocaleString()}{run.endDate && ` | Ended: ${new Date(run.endDate).toLocaleString()}`}
      </p>
      <p className='text-sm text-gray-300 mb-4'>Floors cleared: {run.floorHistory.filter(f => !f.isFailed).length}</p>
      <StatsSummary run={run} activeChars={activeChars} wrapperClass='flex flex-wrap flex-col gap-3 text-xs md:text-sm items-start mb-6' />
      {run.floorHistory.length === 0 ? (
        <p className='text-gray-500 italic'>No floors cleared in this run.</p>
      ) : (
        <FloorHistory run={run} activeChars={activeChars} showStatus />
      )}
    </div>
  );

  // ═══════════════════ MAIN RENDER ═══════════════════

  if (loading) return <div className='flex justify-center items-center text-lg font-bold italic text-gray-500'>Loading data...</div>;

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
