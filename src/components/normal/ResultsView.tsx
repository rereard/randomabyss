import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";
import CharIcon from '../CharIcon';
import { Character } from '../../types';

interface ResultsViewProps {
  results: { group: Character[]; star: number }[];
  resultRef?: React.RefObject<HTMLDivElement | null>;
  onStarChange: (index: number, delta: number) => void;
}

export default function ResultsView({ results, resultRef, onStarChange }: ResultsViewProps) {
  if (results.length === 0) return null;

  return (
    <div className='mt-10'>
      <h2 className='text-base sm:text-lg md:text-xl font-bold mb-2' ref={resultRef}>Results:</h2>
      {results.map((item, index) => (
        <div className='flex flex-col mb-5' key={index}>
          <span className='font-bold mb-2 text-sm md:text-base'>Group {index + 1}:</span>
          <div className='flex flex-row'>
            <div className='flex flex-1 md:flex-initial flex-wrap gap-2'>
              {item.group.map((char, i) => (
                <CharIcon key={i} char={char} size='md' />
              ))}
            </div>
            <div className='flex flex-col md:flex-row gap-1 justify-center items-center md:ml-3'>
              <button
                className={`text-xl ${item.star === 0 ? 'invisible' : ''}`}
                onClick={() => onStarChange(index, -1)}
              >
                <CiCircleMinus />
              </button>
              <div className='flex gap-1 items-center'>
                <img src="/assets/abyss_star.png" className='w-5 h-5 lg:w-7 lg:h-7' alt="star" />
                <span>{item.star}/9</span>
              </div>
              <button
                className={`text-xl ${item.star === 9 ? 'invisible' : ''}`}
                onClick={() => onStarChange(index, 1)}
              >
                <CiCirclePlus />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
