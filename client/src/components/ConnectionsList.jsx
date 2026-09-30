import { useEffect, useState } from 'react';
import api from '../api/client';
import { colorFor } from '../lib/skills';

/**
 * The people you have actually met at this event, newest last, with the note
 * you can leave on each one.
 */
export default function ConnectionsList({ eventId, nodes = [], onClose, onFocus }) {
  /** The roster endpoint returns profiles, not star data — take colour from the sky. */
  const categoryOf = (userId) => nodes.find((n) => n.id === userId)?.category || 'other';

  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get(`/connections/${eventId}/mine`)
      .then(({ data }) => alive && setItems(data.connections))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [eventId]);

  async function saveNote(connectionId) {
    try {
      await api.patch(`/connections/${connectionId}`, { note: draft });
      setItems((prev) =>
        prev.map((c) => (c.connectionId === connectionId ? { ...c, note: draft } : c))
      );
      setEditing(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel max-h-[80vh] w-full max-w-md overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg">My connections</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200" aria-label="Close">
            ✕
          </button>
        </div>

        {error && <p className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300">{error}</p>}
        {!items && !error && <p className="text-sm text-slate-500">Loading…</p>}

        {items?.length === 0 && (
          <p className="rounded-xl bg-sky-deep/70 p-6 text-center text-sm text-slate-400">
            No connections yet. Read your star code out to someone and have them type it in.
          </p>
        )}

        <ul className="space-y-3">
          {items?.map((c) => (
            <li key={c.connectionId} className="rounded-xl border border-sky-line bg-sky-deep/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => {
                    onFocus?.(c.user.id);
                    onClose?.();
                  }}
                  className="flex items-start gap-2.5 text-left"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colorFor(categoryOf(c.user?.id)) }}
                  />
                  <span>
                    <span className="block text-sm text-slate-200">{c.user?.name}</span>
                    {c.user?.headline && (
                      <span className="block text-xs text-slate-500">{c.user.headline}</span>
                    )}
                  </span>
                </button>
                <span className="shrink-0 text-[11px] text-slate-600">
                  {new Date(c.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {editing === c.connectionId ? (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={200}
                    placeholder="Met at the pitch session…"
                    className="field text-xs"
                  />
                  <button onClick={() => saveNote(c.connectionId)} className="btn-primary shrink-0 text-xs">
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditing(c.connectionId);
                    setDraft(c.note || '');
                  }}
                  className="mt-2 text-left text-xs text-slate-500 hover:text-slate-300"
                >
                  {c.note ? `“${c.note}”` : '+ add a note'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
