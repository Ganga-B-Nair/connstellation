import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: '', description: '', venue: '' });

  async function load() {
    try {
      const { data } = await api.get('/events/mine');
      setEvents(data.events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function join(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/events/join', { joinCode });
      setJoinCode('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/events', draft);
      setDraft({ name: '', description: '', venue: '' });
      setCreating(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">My events</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Every event is its own sky. Join one with a code, or host your own.
          </p>
        </div>
        <button onClick={() => setCreating((v) => !v)} className="btn-ghost">
          {creating ? 'Cancel' : 'Host an event'}
        </button>
      </div>

      <form onSubmit={join} className="panel mt-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[180px] flex-1">
          <label className="label" htmlFor="joincode">
            Join with a code
          </label>
          <input
            id="joincode"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="DEMO24"
            className="field font-display tracking-[0.2em]"
          />
        </div>
        <button type="submit" className="btn-primary">
          Join
        </button>
      </form>

      {creating && (
        <form onSubmit={create} className="panel mt-4 space-y-4 p-5">
          <div>
            <label className="label" htmlFor="ename">
              Event name
            </label>
            <input
              id="ename"
              className="field"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
              minLength={3}
            />
          </div>
          <div>
            <label className="label" htmlFor="edesc">
              Description
            </label>
            <textarea
              id="edesc"
              rows={2}
              className="field"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="evenue">
              Venue
            </label>
            <input
              id="evenue"
              className="field"
              value={draft.venue}
              onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary">
            Create event
          </button>
        </form>
      )}

      {error && <p className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

      {loading ? (
        <p className="mt-10 text-sm text-slate-500">Loading…</p>
      ) : events.length === 0 ? (
        <p className="panel mt-8 p-8 text-center text-sm text-slate-400">
          No events yet. Join with a code, or host one — then watch the sky fill in.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {events.map((ev) => (
            <li key={ev.id}>
              <Link
                to={`/events/${ev.id}`}
                className="panel block h-full p-5 transition hover:border-star-frontend/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base leading-snug">{ev.name}</h3>
                  {ev.isHost && (
                    <span className="chip shrink-0 border-star-frontend/40 text-star-frontend">
                      Host
                    </span>
                  )}
                </div>
                {ev.venue && <p className="mt-1 text-xs text-slate-500">{ev.venue}</p>}
                {ev.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-400">{ev.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-sky-line pt-3 text-xs text-slate-500">
                  <span>{ev.attendees} stars</span>
                  <span className="font-display tracking-[0.2em] text-slate-400">{ev.joinCode}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
