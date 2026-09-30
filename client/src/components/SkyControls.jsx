import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/skills';

const VIEWS = [
  ['all', 'Everyone', 'Every star in the event'],
  ['connections', 'My connections', 'You and everyone you have met'],
  ['unmet', 'Not yet met', 'People you have not connected to'],
];

/**
 * Search, category filter, and the three sky views. Filter state lives in the
 * page so this component stays presentational.
 */
export default function SkyControls({
  query,
  onQuery,
  activeCategories,
  onToggleCategory,
  view,
  onView,
  onOpenRoster,
  myConnectionCount,
  matchCount,
  totalCount,
}) {
  return (
    <div className="panel absolute left-4 top-4 z-20 w-72 max-w-[calc(100vw-2rem)] p-4">
      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search a name or skill…"
        className="field"
      />

      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const active = activeCategories.has(key);
          return (
            <button
              key={key}
              onClick={() => onToggleCategory(key)}
              className={`chip transition ${
                active ? 'border-transparent text-sky-void' : 'hover:border-slate-500'
              }`}
              style={active ? { backgroundColor: CATEGORY_COLORS[key] } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <p className="label">Show</p>
        <div className="flex flex-col gap-1">
          {VIEWS.map(([key, label, hint]) => (
            <button
              key={key}
              onClick={() => onView(key)}
              title={hint}
              className={`rounded-lg px-3 py-2 text-left text-xs transition ${
                view === key
                  ? 'bg-star-frontend text-sky-void'
                  : 'text-slate-400 hover:bg-sky-deep hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={onOpenRoster} className="btn-ghost mt-3 w-full text-xs">
        My connections ({myConnectionCount})
      </button>

      <p className="mt-3 border-t border-sky-line pt-3 text-xs text-slate-500">
        {matchCount} of {totalCount} stars lit
      </p>
    </div>
  );
}
