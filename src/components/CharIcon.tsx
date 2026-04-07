import { Character } from '../types';

interface CharIconProps {
  char: Character;
  size?: 'sm' | 'md' | 'lg'; // lg = 20x20 for App.tsx pool
  onClick?: () => void;
  badge?: React.ReactNode;
  isDisabled?: boolean;
}

const TRAVELER_IMG = "https://static.wikia.nocookie.net/gensin-impact/images/5/59/Traveler_Icon.png";
const CHAR_IMG_BASE = "https://gi.yatta.moe/assets/UI";

export default function CharIcon({ char, size = 'md', onClick, badge, isDisabled = false }: CharIconProps) {
  const sizeClass = {
    sm: 'w-14 h-14 md:w-16 md:h-16',
    md: 'w-16 h-16 md:w-20 md:h-20',
    lg: 'w-16 h-16 md:w-20 md:h-20',
  }[size];
  
  const elSize = size === 'sm' ? 'w-5' : 'w-6';
  const bgClass = char?.rarity === 4 ? 'bg-[#9c75b7]' : 'bg-[#b27330]';
  const visualClass = isDisabled
    ? 'grayscale opacity-50 cursor-not-allowed'
    : onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : '';

  return (
    <div
      className={`${sizeClass} block ${bgClass} rounded ${visualClass} relative`}
      onClick={isDisabled ? undefined : onClick}
    >
      {char?.name === "Traveler" ? (
        <>
          {char?.elementText && (
            <img src={`/assets/Element_${char.elementText}.webp`} alt="element" className={`absolute z-10 top-0 right-0 ${elSize}`} />
          )}
          <img loading="lazy" src={TRAVELER_IMG} alt="char" />
        </>
      ) : (
        <>
          <img src={`/assets/Element_${char?.elementText}.webp`} alt="element" className={`absolute z-10 top-0 right-0 ${elSize}`} />
          <img loading="lazy" src={`${CHAR_IMG_BASE}/${char?.images?.filename_icon}.png`} alt="char" />
        </>
      )}
      {badge}
    </div>
  );
}
