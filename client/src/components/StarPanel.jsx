import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORY_LABELS, colorFor } from '../lib/skills';

/** Slide-in profile card shown when a star is clicked. */
export default function StarPanel({ node, onClose, onConnect, canConnect }) {
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
                style={{ backgroundColor: colorFor(node.category), boxShadow: `0 0 12px ${colorFor(node.category)}` }}
              />
              <div>
                <h3 className="text-base leading-tight">{node.name}</h3>
                <p className="text-xs text-slate-400">{CATEGORY_LABELS[node.category]}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-200" aria-label="Close">
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
            <span>{node.connectionCount} connection{node.connectionCount === 1 ? '' : 's'}</span>
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
            <p className="mt-4 rounded-xl bg-sky-deep/70 p-3 text-center text-xs text-slate-400">
              This is your star. Show your code so others can connect.
            </p>
          ) : (
            canConnect && (
              <button onClick={() => onConnect?.(node)} className="btn-primary mt-4 w-full">
                Connect with {node.name.split(' ')[0]}
              </button>
            )
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
