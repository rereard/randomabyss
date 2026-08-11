import { useState } from 'react';
import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";
import CharIcon from '../CharIcon';
import { Character } from '../../types';

interface ResultsViewProps {
  results: { group: Character[]; star: number }[];
  resultRef?: React.RefObject<HTMLDivElement | null>;
  onStarChange: (index: number, delta: number) => void;
  onReorderGroup: (groupIndex: number, fromIndex: number, toIndex: number) => void;
}

export default function ResultsView({ results, resultRef, onStarChange, onReorderGroup }: ResultsViewProps) {
  const [dragState, setDragState] = useState<{ groupIndex: number; fromIndex: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ groupIndex: number; toIndex: number } | null>(null);

  if (results.length === 0) return null;

  const handleDragStart = (groupIndex: number, fromIndex: number) => {
    setDragState({ groupIndex, fromIndex });
  };

  const handleDragOver = (e: React.DragEvent, groupIndex: number, toIndex: number) => {
    e.preventDefault();
    setDropTarget({ groupIndex, toIndex });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (groupIndex: number, toIndex: number) => {
    if (dragState && dragState.groupIndex === groupIndex && dragState.fromIndex !== toIndex) {
      onReorderGroup(groupIndex, dragState.fromIndex, toIndex);
    }
    setDragState(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropTarget(null);
  };

  return (
    <div className='mt-10 flex flex-col justify-center items-center'>
      <h2 className='text-base sm:text-lg md:text-xl font-bold mb-2' ref={resultRef}>Results:</h2>
      {results.map((item, groupIndex) => (
        <div className='flex flex-col mb-5' key={groupIndex}>
          <span className='font-bold mb-2 text-sm md:text-base'>Group {groupIndex + 1}:</span>
          <div className='flex flex-row'>
            <div className='grid grid-cols-4 gap-2'>
              {item.group.map((char, i) => {
                const isDragging = dragState?.groupIndex === groupIndex && dragState?.fromIndex === i;
                const isDropHere = dropTarget?.groupIndex === groupIndex && dropTarget?.toIndex === i;
                return (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => handleDragStart(groupIndex, i)}
                    onDragOver={(e) => handleDragOver(e, groupIndex, i)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(groupIndex, i)}
                    onDragEnd={handleDragEnd}
                    className={`relative transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'} ${isDropHere ? 'ring-2 ring-blue-400 rounded' : ''}`}
                  >
                    <CharIcon char={char} size='md' />
                    {(char as any).isFill && (
                      <span className='absolute top-0 left-0 bg-orange-600 text-white text-[10px] px-1 rounded-br font-bold z-20' title='Filled from pool again'>
                        ↻
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className='flex flex-col md:flex-row gap-1 justify-center items-center md:ml-3'>
              <button
                className={`text-xl ${item.star === 0 ? 'invisible' : ''}`}
                onClick={() => onStarChange(groupIndex, -1)}
              >
                <CiCircleMinus />
              </button>
              <div className='flex gap-1 items-center'>
                <img src="/assets/abyss_star.png" className='w-5 h-5 lg:w-7 lg:h-7' alt="star" />
                <span>{item.star}/9</span>
              </div>
              <button
                className={`text-xl ${item.star === 9 ? 'invisible' : ''}`}
                onClick={() => onStarChange(groupIndex, 1)}
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
