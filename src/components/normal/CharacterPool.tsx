import CharIcon from '../CharIcon';
import { Character } from '../../types';

interface CharacterPoolProps {
  listChar: Character[];
  isTravEleIncluded: boolean;
  loading: boolean;
  toggleActive: (id: number) => void;
  toggleTravelerElements: (include: boolean) => void;
  onRandomize: () => void;
}

const activeCount = (list: Character[]) => list.filter(c => c.active).length;

export default function CharacterPool({
  listChar, isTravEleIncluded, loading, toggleActive, toggleTravelerElements, onRandomize
}: CharacterPoolProps) {
  const numActive = activeCount(listChar);
  const isTooFew = numActive < 16;

  return (
    <>
      {!loading && (
        <div className='flex flex-col md:flex-row justify-between'>
          <span className='mb-1 md:mb-2 font-semibold text-sm sm:text-base md:text-lg'>
            Click to exclude/include characters
            {isTooFew && <span className='text-red-400'> — Need at least 16 active!</span>}
          </span>
          <label className="flex mb-2 md:mb-0 text-xs sm:text-sm md:text-base items-center justify-center w-fit cursor-pointer md:space-x-1">
            <input
              type="checkbox"
              checked={isTravEleIncluded}
              onChange={(e) => toggleTravelerElements(e.target.checked)}
              className="hidden"
            />
            <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-gray-600 flex items-center justify-center ${isTravEleIncluded ? "bg-blue-500" : "bg-white"}`}>
              {isTravEleIncluded && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <span>Include traveler's elements</span>
          </label>
        </div>
      )}

      {loading ? (
        <div className='flex justify-center items-center text-lg font-bold italic text-gray-500'>
          Loading data...
        </div>
      ) : (
        <div className='flex flex-wrap gap-2 items-center justify-center'>
          {listChar.map((char, index) => (
            <div key={index} className={!char.active ? 'grayscale' : 'grayscale-0'}>
              <CharIcon
                char={char}
                size='md'
                onClick={() => toggleActive(char.id)}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className='mt-7 flex flex-col items-center gap-2'>
          <button
            className='px-5 md:px-7 py-1 md:py-2 bg-blue-600 rounded-xl text-base md:text-lg font-semibold'
            onClick={onRandomize}
          >
            Randomize!
          </button>
          <span className='text-sm text-gray-400'>
            {numActive}/{listChar.length} characters selected • {Math.ceil(numActive / 8)} groups
          </span>
        </div>
      )}
    </>
  );
}
