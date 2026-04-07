import { useEffect, useRef, useState } from 'react';
import './App.css';
import { FaChevronRight, FaTrashAlt } from "react-icons/fa";
import EndlessMode from './EndlessMode';
import { getAllEndlessRuns, deleteEndlessRun } from './utils/endlessStorage';
import { EndlessRun } from './types';
import { useCharacters } from './hooks/useCharacters';
import { useSavedGroups } from './hooks/useSavedGroups';
import { formatDate } from './utils/formatDate';
import CharacterPool from './components/normal/CharacterPool';
import ResultsView from './components/normal/ResultsView';

// Randomize grouping algorithm (Normal mode core logic)
function groupActiveItems(listChar: any[]) {
  const activeItems = listChar.filter(item => item.active);
  const shuffled = [...activeItems].sort(() => Math.random() - 0.5);
  let groups: { group: any[]; star: number }[] = [];

  while (shuffled.length > 0) {
    let currentGroup: any[] = [];
    let usedNames = new Set<string>();
    for (let i = 0; i < shuffled.length; i++) {
      if (currentGroup.length >= 8) break;
      const item = shuffled[i];
      if (!usedNames.has(item.name)) {
        usedNames.add(item.name);
        currentGroup.push(item);
        shuffled.splice(i, 1);
        i--;
      }
    }
    groups.push({ group: currentGroup, star: 0 });
  }

  // Fill last group if under 8
  const lastGroupIndex = groups.length - 1;
  if (groups[lastGroupIndex].group.length < 8) {
    const remainder = groups[lastGroupIndex].group;
    const needed = 8 - remainder.length;
    let usedNames = new Set(remainder.map((item: any) => item.name));
    let extraItems: any[] = [];
    for (let item of [...activeItems].sort(() => Math.random() - 0.5)) {
      if (!usedNames.has(item.name)) {
        usedNames.add(item.name);
        extraItems.push(item);
        if (extraItems.length === needed) break;
      }
    }
    groups[lastGroupIndex].group = [...remainder, ...extraItems];
  }

  return groups;
}

function App() {
  const { listChar, loading, isTravEleIncluded, toggleActive, toggleTravelerElements } = useCharacters();
  const { savedGroups, storageId, setStorageId, saveNewResult, deleteResult, updateStar } = useSavedGroups();
  const [randomResult, setRandomResult] = useState<{ group: any[]; star: number }[]>([]);
  const [navType, setNavType] = useState<number>(1);
  const [endlessSavedRuns, setEndlessSavedRuns] = useState<EndlessRun[]>([]);
  const [viewingEndlessRun, setViewingEndlessRun] = useState<EndlessRun | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navType === 3) {
      setEndlessSavedRuns(getAllEndlessRuns().filter(r => r.status === 'given-up').reverse());
    }
  }, [navType]);

  const handleRandomize = () => {
    const groups = groupActiveItems(listChar);
    const saved = saveNewResult(groups);
    setRandomResult(saved);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleStarChange = (index: number, delta: number) => {
    const updated = updateStar(storageId, index, delta, randomResult);
    setRandomResult(updated);
  };

  const navBtnClass = (n: number) =>
    `flex-1 text-center ${navType === n ? 'border-t-2 border-l-2 border-r-2 font-extrabold' : 'border-b-2 font-normal underline underline-offset-4'} text-xs sm:text-sm md:text-base py-2`;

  return (
    <div className="text-slate-100 bg-slate-800 p-4 sm:p-6 md:p-8 rounded-xl">
      <h1 className='mb-8 text-lg sm:text-xl md:text-3xl font-bold'>Spiral Abyss Party Randomizer</h1>

      <nav className='flex flex-row mb-6'>
        <button onClick={() => setNavType(1)} className={navBtnClass(1)}>Randomize</button>
        <button onClick={() => setNavType(2)} className={navBtnClass(2)}>Endless</button>
        <button onClick={() => setNavType(3)} className={navBtnClass(3)}>Saved Result</button>
        <button onClick={() => setNavType(4)} className={navBtnClass(4)}>About</button>
      </nav>

      {navType === 1 ? (
        <>
          <CharacterPool
            listChar={listChar}
            isTravEleIncluded={isTravEleIncluded}
            loading={loading}
            toggleActive={toggleActive}
            toggleTravelerElements={toggleTravelerElements}
            onRandomize={handleRandomize}
          />
          <ResultsView
            results={randomResult}
            resultRef={resultRef}
            onStarChange={handleStarChange}
          />
        </>

      ) : navType === 2 ? (
        <EndlessMode
          listChar={listChar}
          isTravEleIncluded={isTravEleIncluded}
          loading={loading}
          viewingRun={viewingEndlessRun}
          setViewingRun={setViewingEndlessRun}
        />

      ) : navType === 3 ? (
        <div className="flex flex-col gap-10">
          {/* Normal Mode History */}
          <section>
            <h2 className='text-lg md:text-2xl font-bold mb-4 border-b border-gray-600 pb-2'>Normal Mode</h2>
            {savedGroups.length > 0 ? (
              <div>
                {[...savedGroups].reverse().map((item, index) => (
                  <div key={index} className='flex justify-between items-center border-b-2 py-3 border-gray-700'>
                    <div className='flex gap-4'>
                      <button className='text-red-700' onClick={() => deleteResult(item.id)}>
                        <FaTrashAlt />
                      </button>
                      <div>
                        <h3 className='text-base md:text-lg font-bold'>{item.name}</h3>
                        <span className='italic text-sm md:text-base text-gray-400'>{formatDate(item.date)}</span>
                        <div className='flex gap-1 text-sm md:text-base'>
                          <span>{item.groups.length} groups</span>
                          <img src="/assets/abyss_star.png" className='w-5 h-5 md:w-7 md:h-7' alt="star" />
                          <span>{item.groups.reduce((sum, g) => sum + g.star, 0)}/{item.groups.length * 9}</span>
                        </div>
                      </div>
                    </div>
                    <button className='border text-base md:text-xl p-2 rounded-full' onClick={() => {
                      setRandomResult(item.groups);
                      setStorageId(item.id);
                      setNavType(1);
                      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                    }}>
                      <FaChevronRight />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='p-2 font-bold text-gray-500 italic'>No Saved Result~</div>
            )}
          </section>

          {/* Endless Mode History */}
          <section>
            <h2 className='text-lg md:text-2xl font-bold mb-4 border-b border-gray-600 pb-2'>Endless Mode</h2>
            {endlessSavedRuns.length > 0 ? (
              <div>
                {endlessSavedRuns.map(run => (
                  <div key={run.id} className='flex justify-between items-center border-b-2 py-3 border-gray-700'>
                    <div className='flex gap-4'>
                      <button className='text-red-700' onClick={() => {
                        deleteEndlessRun(run.id);
                        setEndlessSavedRuns(getAllEndlessRuns().filter(r => r.status === 'given-up').reverse());
                      }}>
                        <FaTrashAlt />
                      </button>
                      <div>
                        <h4 className='text-base md:text-lg font-bold'>{run.name}</h4>
                        <span className='italic text-sm md:text-base text-gray-400'>{formatDate(run.startDate)}</span>
                        <div className='text-sm md:text-base text-gray-300'>
                          Floors cleared: {run.floorHistory.filter(f => !f.isFailed).length}
                        </div>
                      </div>
                    </div>
                    <button className='border text-base md:text-xl p-2 rounded-full' onClick={() => {
                      setViewingEndlessRun(run);
                      setNavType(2);
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                    }}>
                      <FaChevronRight />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='p-2 font-bold text-gray-500 italic'>No Saved Result~</div>
            )}
          </section>
        </div>

      ) : (
        <div>
          <h1 className='text-base sm:text-lg font-bold mb-3'>Welcome to Spiral Abyss Party Randomizer!</h1>
          <p className='text-sm sm:text-base'>
            Inspired by <a className='text-blue-400 underline underline-offset-2' href="https://www.youtube.com/@mosurameso">Mosurameso (モスラメソ)</a>{' '}
            <a className='text-blue-400 underline underline-offset-2' href="https://www.youtube.com/playlist?list=PLxn0k-vF3UAPQHVKowc_7XW9dYU5te6Ij">all characters roulette Spiral Abyss streams</a>,
            include character that you have/build to randomly group it.
          </p>
          <ul className='list-disc pl-5 text-sm sm:text-base mb-3'>
            <li>Each group will have 8 random characters</li>
            <li>Use that 8 characters to form a party for first half and second half of floor</li>
            <li>Record the group's star result</li>
            <li>For the last group, if remaining character exists, it'll fill with random character from the included character list (excluding remaining character)</li>
            <li>If Traveler's element not included, you can freely choose the Traveler's element</li>
            <li>Randomized groups results are auto-saved in your local storage, you can check the result's run in Saved Result tab</li>
          </ul>
          <p>UPDATE! ENDLESS SPIRAL ABYSS</p>
          <p>Also inspired by <a className='text-blue-400 underline underline-offset-2' href="https://www.youtube.com/@mosurameso">Mosurameso (モスラメソ)</a> <a className='text-blue-400 underline underline-offset-2' href="https://www.youtube.com/watch?v=357wlM7ka2c">Endless spiral abyss streams</a>, the flows are:</p>
          <ul className='list-disc pl-5 text-sm sm:text-base mb-3'>
            <li>Select one character from the selected characters as opening characters then randomly select the remaining seven characters</li>
            <li>After clearing, select a characters from the seven characters other than the opening character to carry to the next group</li>
            <li>Then randomly select the remaining seven characters again excluding the characters from the group before</li>
            <li>At the start of the challenge, you gain 3 character rerolls and recover 1 reroll count for every 5 floors cleared (no limit)</li>
          </ul>
          <p className='text-gray-400 text-sm sm:text-base'>
            This website is not affiliated with HoYoverse. Genshin Impact, game content and materials are trademarks and copyrights of HoYoverse.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
