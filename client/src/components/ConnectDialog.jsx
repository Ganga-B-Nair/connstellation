import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import api from '../api/client';

/**
 * Two halves of the same handshake:
 *  - "My star" shows a QR code and a 4-character fallback code.
 *  - "Scan" opens the camera, or lets you type the other person's code.
 *
 * Scanning proves you were standing next to each other, so the connection is
 * created as mutual straight away — no approval queue.
 */
export default function ConnectDialog({ eventId, myStarCode, onClose, onConnected }) {
  const [tab, setTab] = useState('mine');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const scannerDivId = 'connstellation-qr-reader';

  async function submit(rawCode, method = 'code') {
    const value = String(rawCode || '').trim().toUpperCase();
    if (!value) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/connections', { eventId, starCode: value, method });
      onConnected?.(data);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Camera scanning is opt-in — it needs a user gesture and a permission prompt.
  useEffect(() => {
    if (!scanning) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode(scannerDivId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (decoded) => {
            if (cancelled) return;
            // QR payload is "connstellation:<starCode>"
            const value = decoded.includes(':') ? decoded.split(':').pop() : decoded;
            scanner.stop().catch(() => {});
            setScanning(false);
            submit(value, 'qr');
          },
          () => {} // per-frame decode failures are normal; ignore them
        );
      } catch (err) {
        if (!cancelled) {
          setError('Could not open the camera. Type the code instead.');
          setScanning(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="panel w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg">Make a connection</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl bg-sky-deep/80 p-1 text-xs">
          {[
            ['mine', 'My star'],
            ['scan', 'Scan theirs'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-lg px-3 py-2 transition ${
                tab === key ? 'bg-star-frontend text-sky-void' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'mine' ? (
          <div className="mt-5 flex flex-col items-center">
            <div className="rounded-2xl bg-white p-3">
              <QRCodeSVG value={`connstellation:${myStarCode}`} size={168} level="M" />
            </div>
            <p className="mt-4 text-xs text-slate-400">Or read out your code</p>
            <p className="mt-1 font-display text-3xl tracking-[0.35em] text-star-frontend">
              {myStarCode}
            </p>
          </div>
        ) : (
          <div className="mt-5">
            {scanning ? (
              <div id={scannerDivId} className="overflow-hidden rounded-xl" />
            ) : (
              <button onClick={() => setScanning(true)} className="btn-ghost w-full">
                Open camera
              </button>
            )}

            <div className="mt-4">
              <label className="label" htmlFor="starcode">
                Or type their code
              </label>
              <div className="flex gap-2">
                <input
                  id="starcode"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="A7K2"
                  className="field font-display tracking-[0.25em]"
                />
                <button onClick={() => submit(code)} disabled={busy} className="btn-primary shrink-0">
                  {busy ? '…' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300">{error}</p>}
      </motion.div>
    </div>
  );
}
