# Connstellation

**Connect using constellations.** Event networking mapped as a living night sky: every attendee is a
star, coloured by what they build and brightened by who they have met. Every connection draws a line,
so by the end of an event the sky shows who actually talked to whom.

Built for the Web Technology course — React frontend, Express + MongoDB backend.

---

## Quick start

```bash
# 1. install both workspaces
npm install                # root (concurrently)
npm run install:all        # server + client

# 2. configure the server
cp server/.env.example server/.env
#    then edit server/.env — set MONGODB_URI and a real JWT_SECRET

# 3. optional but recommended: a demo sky with 24 people and ~50 connections
npm run seed

# 4. run both at once
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:5000/api/health

Seeded login: `ganga.b.nair@connstellation.demo` / `password123` · join code `DEMO24`

### MongoDB

Either works:

- **Local:** `mongodb://127.0.0.1:27017/connstellation`
- **Atlas free tier (M0):** paste the connection string into `MONGODB_URI`. Add `0.0.0.0/0` to Network
  Access while developing.

---

## Project layout

```
connstellation/
├── server/                     Express + Mongoose + Socket.IO
│   └── src/
│       ├── index.js            app wiring, CORS, error handling
│       ├── seed.js             demo event with 24 stars
│       ├── socket.js           one room per event
│       ├── config/db.js
│       ├── models/             User, Event, Attendance, Connection
│       ├── routes/             auth, users, events, connections
│       ├── middleware/         requireAuth, validation, errors
│       └── utils/              star positions, codes, skill palette
└── client/                     React 18 + Vite + Tailwind
    └── src/
        ├── components/
        │   ├── SkyGraph.jsx    the canvas sky — the heart of the project
        │   ├── SkyControls.jsx search + category filter + "my constellation"
        │   ├── StarPanel.jsx   profile card for a clicked star
        │   ├── ConnectDialog.jsx  QR code / scanner / typed code
        │   └── StatsPanel.jsx  aggregation-backed insights
        ├── pages/              Landing, Auth, Events, Sky, Profile
        ├── store/auth.js       Zustand auth store
        ├── api/                axios client + socket helper
        └── lib/skills.js       colour palette (mirrors the server)
```

---

## Data model

Four collections:

| Collection      | Holds                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| **users**       | name, email, passwordHash, bio, headline, skills[], interests[], socials     |
| **events**      | name, description, venue, dates, hostId, joinCode, theme, isOpen            |
| **attendances** | one per (user, event): the star's fixed position, its 4-char code, degree    |
| **connections** | one per line: eventId, sorted userA/userB, method, note                      |

Indexes that matter:

- `attendances`: unique on `(userId, eventId)` and on `(eventId, starCode)`
- `connections`: unique on `(eventId, userA, userB)` — pairs are stored **sorted by id**, so the
  index blocks duplicates in both directions
- `events`: unique on `joinCode`

---

## API

| Method   | Route                                    | Purpose                              |
| -------- | ---------------------------------------- | ------------------------------------ |
| `POST`   | `/api/auth/register`                     | create account, returns JWT          |
| `POST`   | `/api/auth/login`                        | log in, returns JWT                  |
| `GET`    | `/api/auth/me`                           | current user                         |
| `GET`    | `/api/users/:id`                         | public profile                       |
| `PATCH`  | `/api/users/me`                          | edit own profile                     |
| `POST`   | `/api/events`                            | host creates an event                |
| `GET`    | `/api/events/mine`                       | events I host or attend              |
| `POST`   | `/api/events/join`                       | join with a code                     |
| `GET`    | `/api/events/:id`                        | event detail                         |
| `GET`    | `/api/events/:id/sky`                    | **all stars + all lines, one call**  |
| `GET`    | `/api/events/:id/stats`                  | aggregation insights                 |
| `PATCH`  | `/api/events/:id`                        | host edits / closes the event        |
| `DELETE` | `/api/events/:id/attendees/:userId`      | host removes an attendee             |
| `POST`   | `/api/connections`                       | draw a line using a star code        |
| `GET`    | `/api/connections/:eventId/mine`         | my own connections                   |
| `PATCH`  | `/api/connections/:id`                   | private note on a connection         |
| `GET`    | `/api/meta/categories`                   | the skill → colour palette           |

Socket.IO events, scoped to `event:<id>` rooms: `line:drawn`, `star:joined`, `star:removed`.

---

## Two design decisions worth explaining in the report

**Star positions are fixed, not simulated.** A free force layout rearranges the whole sky every time
a line is added, and people lose track of where they are. Instead each attendee is given a permanent
position on join, from a golden-angle spiral (`server/src/utils/starPosition.js`), stored in
`attendances.starPosition`. The renderer pins nodes with `fx`/`fy` and uses react-force-graph purely
for its canvas, zoom and hit-testing. This is the difference between a sky and a twitching blob.

**Connections are mutual immediately.** There is no pending-request state. Scanning someone's QR code
or typing the 4-character code off their screen already required standing next to them, which is a
stronger proof of a real meeting than an approval queue — and it keeps the flow to a single tap.

---

## Scope

**Built**

1. Register / log in / edit profile with skills and interests
2. Host an event, join one with a code
3. The sky view: stars coloured by skill category, sized and brightened by degree
4. Make a connection by QR scan or typed code, mutual instantly
5. Click a star for a profile panel
6. Search and category filters — matching stars stay lit, the rest dim
7. "My constellation" mode
8. Live updates over Socket.IO, with a flare animation on a new line
9. Event insights from MongoDB aggregation: busiest skills, most connected people, connections per
   hour, sky density
10. Host controls: edit the event, remove an attendee

**Deliberately out of scope** — worth stating rather than leaving as a gap: no chat or messaging, no
push notifications, no native mobile app, no 3D rendering, no ticketing or payments.

**Possible extensions**

- Suggested connections: faint dotted lines to people sharing two or more interests you have not met
- Downloadable recap card after the event (html2canvas)
- Export connections as CSV or vCard

---

## Deployment

| Piece    | Where              | Notes                                                       |
| -------- | ------------------ | ----------------------------------------------------------- |
| Database | MongoDB Atlas M0   | free                                                        |
| API      | Render web service | root `server/`, build `npm install`, start `npm start`       |
| Client   | Vercel             | root `client/`, build `npm run build`, output `dist`         |

Set `CLIENT_ORIGIN` on the API to the deployed client URL, and `VITE_API_URL` / `VITE_SOCKET_URL` on
the client to the deployed API origin.

---

## Tech stack

**Frontend** React 18, Vite, Tailwind CSS, react-force-graph-2d, Framer Motion, React Router,
Zustand, axios, socket.io-client, qrcode.react, html5-qrcode

**Backend** Node.js, Express, Mongoose, Socket.IO, jsonwebtoken, bcryptjs, express-validator, helmet,
cors, morgan, nanoid

**Database** MongoDB (Atlas or local)
