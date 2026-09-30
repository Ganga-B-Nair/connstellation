import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORY_LABELS, colorFor } from '../lib/skills';

/**
 * Slide-in profile card shown when a star is clicked.
 *
 * Two different jobs depending on whose star it is:
 *  - Your own star shows YOUR code, which only you can see (the server omits
 *    starCode for everyone else's star). You read it aloud; they type it in.
 *  - Someone else's star offers to enter THEIR code, since that is the
 *    direction the handshake actually runs.
 */
export default function StarPanel({ node, onClose, onConnect, canConnect, isConnected }) {
  return (
    <AnimatePresence>
      {node && (
        <motion.aside
          key={node.id}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="panel absolute right-4 top-4 z-20 w-80 max-w-[calc(100vw-2rem)] p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: colorFor(node.category),
                  boxShadow: `0 0 12px ${colorFor(node.category)}`,
                }}
              />
              <div>
                <h3 className="text-base leading-tight">{node.name}</h3>
                <p className="text-xs text-slate-400">{CATEGORY_LABELS[node.category]}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {node.headline && <p className="mt-3 text-sm text-slate-300">{node.headline}</p>}
          {node.bio && <p className="mt-2 text-xs leading-relaxed text-slate-400">{node.bio}</p>}

          {node.skills?.length > 0 && (
            <div className="mt-4">
              <p className="label">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {node.skills.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {node.interests?.length > 0 && (
            <div className="mt-3">
              <p className="label">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {node.interests.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-sky-line pt-3 text-xs text-slate-400">
            <span>
              {node.connectionCount} connection{node.connectionCount === 1 ? '' : 's'}
            </span>
            {node.socials?.github && (
              <a
                href={node.socials.github}
                target="_blank"
                rel="noreferrer"
                className="text-star-frontend hover:underline"
              >
                GitHub
              </a>
            )}
          </div>

          {node.isMe ? (
            <div className="mt-4 rounded-xl border border-star-frontend/30 bg-sky-deep/70 p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Your star code</p>
              <p className="mt-1.5 font-display text-4xl tracking-[0.35em] text-star-frontend">
                {node.starCode}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Only you can see this. Read it out and have them type it in — or open Connect to show
                it as a QR code.
              </p>
            </div>
          ) : isConnected ? (
            <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-center text-xs text-emerald-300">
              You are already connected to {node.name.split(' ')[0]}.
            </p>
          ) : (
            canConnect && (
              <button onClick={() => onConnect?.(node)} className="btn-primary mt-4 w-full">
                Enter {node.name.split(' ')[0]}&rsquo;s code
              </button>
            )
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
