import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

/** Subscribe to one event's sky; returns an unsubscribe function. */
export function joinSky(eventId, handlers = {}) {
  const s = getSocket();
  s.emit('sky:join', eventId);

  const entries = Object.entries(handlers);
  entries.forEach(([name, fn]) => s.on(name, fn));

  return () => {
    entries.forEach(([name, fn]) => s.off(name, fn));
    s.emit('sky:leave', eventId);
  };
}
