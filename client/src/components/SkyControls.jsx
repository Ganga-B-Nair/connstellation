import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/skills';

/**
 * Search + category filter. Lifting the filter state to the page keeps this
 * component dumb and easy to test.
 */
export default function SkyControls({
  query,
  onQuery,
  activeCategories,
  onToggleCategory,
  myConstellation,
  onToggleMine,
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
              className={`chip transition ${active ? 'border-transparent text-sky-void' : 'hover:border-slate-500'}`}
              style={active ? { backgroundColor: CATEGORY_COLORS[key] } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={myConstellation}
          onChange={onToggleMine}
          className="h-3.5 w-3.5 rounded border-sky-line bg-sky-deep accent-star-frontend"
        />
        Show only my constellation
      </label>

      <p className="mt-3 border-t border-sky-line pt-3 text-xs text-slate-500">
        {matchCount} of {totalCount} stars lit
      </p>
    </div>
  );
}
