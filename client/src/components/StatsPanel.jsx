import { useEffect, useState } from 'react';
import api from '../api/client';

/** Event insights, all served by MongoDB aggregation pipelines. */
export default function StatsPanel({ eventId }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get(`/events/${eventId}/stats`)
      .then(({ data }) => alive && setStats(data))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [eventId]);

  if (error) return <p className="text-sm text-rose-300">{error}</p>;
  if (!stats) return <p className="text-sm text-slate-500">Reading the sky…</p>;

  const peak = Math.max(1, ...stats.timeline.map((t) => t.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Stars" value={stats.attendees} />
        <Stat label="Lines" value={stats.connections} />
        <Stat label="Avg / person" value={stats.averageConnections} />
        <Stat label="Sky density" value={`${stats.density}%`} />
      </div>

      <div>
        <h4 className="label">Busiest skills</h4>
        <div className="space-y-2">
          {stats.topSkills.map((s) => (
            <div key={s.skill} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-slate-300">{s.skill}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-sky-deep">
                <div
                  className="h-full rounded-full bg-star-frontend"
                  style={{ width: `${(s.count / stats.topSkills[0].count) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs text-slate-500">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="label">Most connected</h4>
        <ol className="space-y-1.5">
          {stats.topConnectors.map((p, i) => (
            <li key={p.userId} className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                <span className="mr-2 text-slate-600">{i + 1}</span>
                {p.name}
              </span>
              <span className="text-slate-500">{p.connectionCount}</span>
            </li>
          ))}
        </ol>
      </div>

      {stats.timeline.length > 0 && (
        <div>
          <h4 className="label">Connections per hour</h4>
          <div className="flex h-24 items-end gap-1.5">
            {stats.timeline.map((t) => (
              <div key={t.hour} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-star-ai/70"
                  style={{ height: `${(t.count / peak) * 100}%` }}
                  title={`${t.count} connections`}
                />
                <span className="text-[10px] text-slate-600">
                  {new Date(t.hour).getHours()}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-sky-line bg-sky-deep/60 p-3">
      <p className="font-display text-2xl text-slate-100">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}
