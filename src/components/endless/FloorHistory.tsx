import { EndlessRun, Character, FloorRecord } from '../../types';
import CharIcon from '../CharIcon';
import StatsSummary from './StatsSummary';

interface FloorHistoryProps {
  run: EndlessRun;
  activeChars: Character[];
  /** If true, show ✓ / ❌ (Failed) labels. Used in run history view. */
  showStatus?: boolean;
}

const openerBadge = () => (
  <span className='absolute bottom-0 left-0 bg-yellow-500 text-black text-[8px] px-0.5 rounded-tr font-bold'>★</span>
);

function FloorRow({ record, showStatus }: { record: FloorRecord; showStatus?: boolean }) {
  return (
    <div className='mb-3'>
      <span className={`text-sm font-semibold ${record.isFailed ? 'text-red-400' : ''}`}>
        Floor {record.floor}
        {showStatus && (record.isFailed ? ' ❌ (Failed)' : ' ✓')}:
      </span>
      <span className='text-xs text-gray-400 ml-2'>(rerolls used: {record.rerollsUsed})</span>
      <div className='flex flex-wrap gap-1 mt-1'>
        {record.group.map((c, i) => (
          <CharIcon key={i} char={c} size='sm' badge={i === 0 ? openerBadge() : undefined} />
        ))}
      </div>
    </div>
  );
}

export default function FloorHistory({ run, activeChars, showStatus = false }: FloorHistoryProps) {
  return (
    <div className='mb-4 mt-8 w-full block border-t border-gray-700 pt-6'>
      <h3 className='text-sm sm:text-base font-bold mb-4'>Cleared Floors & Stats:</h3>
      <div className='flex flex-col-reverse lg:flex-row gap-5'>
        {/* Floors List */}
        <div className='flex-1'>
          {[...run.floorHistory].reverse().map(record => (
            <FloorRow key={record.floor} record={record} showStatus={showStatus} />
          ))}
        </div>
        {/* Stats Panel */}
        <StatsSummary run={run} activeChars={activeChars} />
      </div>
    </div>
  );
}
