import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { joinSky } from '../api/socket';
import { useAuth } from '../store/auth';
import SkyGraph from '../components/SkyGraph';
import SkyControls from '../components/SkyControls';
import StarPanel from '../components/StarPanel';
import ConnectDialog from '../components/ConnectDialog';
import StatsPanel from '../components/StatsPanel';

export default function SkyPage() {
  const { id: eventId } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState(new Set());
  const [myConstellation, setMyConstellation] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [flareIds, setFlareIds] = useState([]);
  const [toast, setToast] = useState('');

  const myNode = useMemo(() => nodes.find((n) => n.isMe), [nodes]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/events/${eventId}/sky`);
      setEvent(data.event);
      setNodes(data.nodes);
      setLinks(data.links);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: a line drawn anywhere in this event appears for everyone.
  useEffect(() => {
    if (!eventId) return undefined;
    return joinSky(eventId, {
      'line:drawn': (link) => {
        setLinks((prev) => {
          const exists = prev.some(
            (l) =>
              (l.source === link.source && l.target === link.target) ||
              (l.source === link.target && l.target === link.source)
          );
          return exists ? prev : [...prev, link];
        });
        setNodes((prev) =>
          prev.map((n) =>
            n.id === link.source || n.id === link.target
              ? { ...n, connectionCount: (n.connectionCount || 0) + 1 }
              : n
          )
        );
        setFlareIds([link.source, link.target]);
        setTimeout(() => setFlareIds([]), 1000);
      },
      'star:joined': () => load(),
      'star:removed': ({ userId }) => {
        setNodes((prev) => prev.filter((n) => n.id !== userId));
        setLinks((prev) => prev.filter((l) => l.source !== userId && l.target !== userId));
      },
    });
  }, [eventId, load]);

  const toggleCategory = (key) =>
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** null means "light everything"; a Set narrows the sky. */
  const highlightIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && activeCategories.size === 0) return null;

    const matches = nodes.filter((n) => {
      const byCategory = activeCategories.size === 0 || activeCategories.has(n.category);
      if (!byCategory) return false;
      if (!q) return true;
      const haystack = [n.name, n.headline, ...(n.skills || []), ...(n.interests || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
    return new Set(matches.map((n) => n.id));
  }, [query, activeCategories, nodes]);

  if (loading) return <Centered>Reading the sky…</Centered>;
  if (error)
    return (
      <Centered>
        <p className="text-rose-300">{error}</p>
        <Link to="/events" className="btn-ghost mt-4">
          Back to my events
        </Link>
      </Centered>
    );

  return (
    <div className="relative h-[calc(100vh-3.6rem)] w-full overflow-hidden">
      <SkyGraph
        nodes={nodes}
        links={links}
        highlightIds={highlightIds}
        focusId={myConstellation && myNode ? myNode.id : null}
        flareIds={flareIds}
        onSelect={setSelected}
      />

      <SkyControls
        query={query}
        onQuery={setQuery}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        myConstellation={myConstellation}
        onToggleMine={() => setMyConstellation((v) => !v)}
        matchCount={highlightIds ? highlightIds.size : nodes.length}
        totalCount={nodes.length}
      />

      <StarPanel
        node={selected}
        canConnect={Boolean(myNode)}
        onClose={() => setSelected(null)}
        onConnect={() => setConnectOpen(true)}
      />

      {/* Bottom bar: event identity, join code, and the connect button. */}
      <div className="panel absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4 px-5 py-3">
        <div className="hidden sm:block">
          <p className="text-sm text-slate-200">{event?.name}</p>
          <p className="text-xs text-slate-500">
            {nodes.length} stars · {links.length} lines · code{' '}
            <span className="font-display tracking-[0.2em] text-slate-400">{event?.joinCode}</span>
          </p>
        </div>
        <button onClick={() => setShowStats(true)} className="btn-ghost">
          Insights
        </button>
        {myNode && (
          <button onClick={() => setConnectOpen(true)} className="btn-primary">
            Connect
          </button>
        )}
      </div>

      {connectOpen && myNode && (
        <ConnectDialog
          eventId={eventId}
          myStarCode={myNode.starCode}
          onClose={() => setConnectOpen(false)}
          onConnected={(data) => {
            setToast(`Connected with ${data.with?.name || 'a new star'}`);
            setTimeout(() => setToast(''), 3000);
          }}
        />
      )}

      {showStats && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowStats(false)}
        >
          <div
            className="panel max-h-[85vh] w-full max-w-lg overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg">Event insights</h3>
              <button
                onClick={() => setShowStats(false)}
                className="text-slate-500 hover:text-slate-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <StatsPanel eventId={eventId} />
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-star-frontend px-4 py-2 text-sm font-medium text-sky-void">
          {toast}
        </div>
      )}

      {!myNode && (
        <div className="panel absolute right-4 bottom-4 z-20 max-w-xs p-4 text-xs text-slate-400">
          You are viewing this sky but have not joined it, so you have no star yet. Join with the code{' '}
          <span className="font-display tracking-[0.2em] text-slate-200">{event?.joinCode}</span> from
          your events page.
        </div>
      )}
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-sm text-slate-500">
      {children}
    </div>
  );
}
