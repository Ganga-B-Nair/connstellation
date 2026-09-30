import { Server } from 'socket.io';

let io = null;

/** Socket rooms are one per event, so a new line only reaches that sky. */
export function initSocket(httpServer, origin) {
  io = new Server(httpServer, {
    cors: { origin, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('sky:join', (eventId) => {
      if (eventId) socket.join(`event:${eventId}`);
    });
    socket.on('sky:leave', (eventId) => {
      if (eventId) socket.leave(`event:${eventId}`);
    });
  });

  console.log('[socket] ready');
  return io;
}

/** Fire-and-forget broadcast; safe to call before initSocket in tests. */
export function emitToEvent(eventId, event, payload) {
  if (!io) return;
  io.to(`event:${eventId}`).emit(event, payload);
}
