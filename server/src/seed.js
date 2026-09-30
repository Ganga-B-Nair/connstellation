/**
 * Seeds one demo event with 24 attendees and a plausible web of connections,
 * so the sky looks alive the first time you open it.
 *
 *   npm run seed
 *
 * Every seeded account uses the password: password123
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Event from './models/Event.js';
import Attendance from './models/Attendance.js';
import Connection, { sortPair } from './models/Connection.js';
import { starPositionForIndex } from './utils/starPosition.js';
import { makeStarCode } from './utils/codes.js';

const PASSWORD = 'password123';

const PEOPLE = [
  ['Ganga B Nair', 'CS & AI · builds too many side projects', ['react', 'node', 'ml']],
  ['Aromal S', 'Frontend, obsessively', ['react', 'tailwind', 'ui']],
  ['Krishna N', 'Backend and databases', ['node', 'mongodb', 'api']],
  ['Harisankar R', 'Loves a clean API', ['express', 'sql', 'go']],
  ['Navaneeth M', 'Flutter all day', ['flutter', 'android', 'ui']],
  ['Zeeshan A', 'ML student', ['pytorch', 'nlp', 'ai']],
  ['Nayana Anna Binu', 'Product and pitching', ['product', 'pitching', 'figma']],
  ['Sana Maria Sobi', 'Designs then codes it', ['figma', 'ux', 'react']],
  ['Vasundhara S R', 'Data science', ['data science', 'ml', 'sql']],
  ['Adwaith S K', 'Embedded systems', ['iot', 'arduino', 'embedded']],
  ['Vismaya P', 'Full stack', ['react', 'express', 'mongodb']],
  ['Jonathan K', 'Security curious', ['node', 'api', 'rust']],
  ['Calvina Anand', 'Marine data + ML', ['ml', 'cv', 'data science']],
  ['Zoe Maria George', 'Frontend and motion', ['react', 'motion', 'css']],
  ['Devan R', 'Brand and illustration', ['branding', 'illustration', 'figma']],
  ['Meera S', 'Robotics club lead', ['robotics', 'embedded', 'pcb']],
  ['Arjun Das', 'Backend intern', ['django', 'sql', 'api']],
  ['Fathima N', 'iOS, quietly', ['swift', 'ios', 'ui']],
  ['Rahul Menon', 'Growth and strategy', ['marketing', 'strategy', 'product']],
  ['Anjali Raj', 'LLM tinkerer', ['llm', 'nlp', 'python']],
  ['Sreehari V', 'Rust and systems', ['rust', 'go', 'api']],
  ['Diya Thomas', 'UX research', ['ux', 'design', 'figma']],
  ['Nikhil P', 'Cloud and CI', ['node', 'api', 'sql']],
  ['Lakshmi S', 'Finance + analytics', ['finance', 'sql', 'strategy']],
];

const INTEREST_POOL = [
  'hackathons',
  'startups',
  'open source',
  'music',
  'photography',
  'climbing',
  'chess',
  'writing',
  'football',
  'coffee',
  'anime',
  'trekking',
];

function pickInterests(i) {
  const a = INTEREST_POOL[i % INTEREST_POOL.length];
  const b = INTEREST_POOL[(i * 5 + 3) % INTEREST_POOL.length];
  const c = INTEREST_POOL[(i * 7 + 1) % INTEREST_POOL.length];
  return [...new Set([a, b, c])];
}

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/connstellation');

  console.log('[seed] clearing existing demo data');
  await Promise.all([
    User.deleteMany({ email: /@connstellation\.demo$/ }),
    Event.deleteMany({ joinCode: 'DEMO24' }),
  ]);

  const users = [];
  for (let i = 0; i < PEOPLE.length; i += 1) {
    const [name, headline, skills] = PEOPLE[i];
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
    const user = new User({
      name,
      email: `${slug}@connstellation.demo`,
      headline,
      skills,
      interests: pickInterests(i),
      bio: `${headline}. Say hi if you're working on something similar.`,
      socials: { github: `https://github.com/${slug.replace(/\./g, '-')}` },
    });
    await user.setPassword(PASSWORD);
    await user.save();
    users.push(user);
  }
  console.log(`[seed] created ${users.length} users`);

  const event = await Event.create({
    name: 'MBCET Innovation Meetup 2026',
    description:
      'A demo sky: 24 attendees, a few dozen conversations. Log in as any seeded account to explore.',
    venue: 'MBCET, Thiruvananthapuram',
    startsAt: new Date(),
    hostId: users[0]._id,
    joinCode: 'DEMO24',
    theme: 'midnight',
  });
  console.log(`[seed] created event ${event.name} (join code ${event.joinCode})`);

  await Attendance.deleteMany({ eventId: event._id });
  const attendances = [];
  for (let i = 0; i < users.length; i += 1) {
    attendances.push(
      await Attendance.create({
        userId: users[i]._id,
        eventId: event._id,
        starPosition: starPositionForIndex(i),
        starCode: makeStarCode(),
        joinedAt: new Date(Date.now() - (users.length - i) * 4 * 60 * 1000),
      })
    );
  }

  // Connections: everyone meets a few neighbours, plus some long-range links.
  await Connection.deleteMany({ eventId: event._id });
  const pairs = new Set();
  const addPair = (i, j) => {
    if (i === j) return;
    const key = [Math.min(i, j), Math.max(i, j)].join('-');
    pairs.add(key);
  };

  for (let i = 0; i < users.length; i += 1) {
    addPair(i, (i + 1) % users.length);
    if (i % 2 === 0) addPair(i, (i + 3) % users.length);
    if (i % 5 === 0) addPair(i, (i + 7) % users.length);
    if (i % 7 === 0) addPair(i, (i + 11) % users.length);
  }

  let made = 0;
  const start = Date.now() - 5 * 60 * 60 * 1000;
  for (const key of pairs) {
    const [i, j] = key.split('-').map(Number);
    const pair = sortPair(users[i]._id, users[j]._id);
    const created = await Connection.create({
      eventId: event._id,
      ...pair,
      method: made % 3 === 0 ? 'qr' : 'code',
      initiatedBy: users[i]._id,
    });
    // Backdate so the stats timeline has something to plot. `timestamps: false`
    // stops Mongoose from stamping createdAt back to now.
    await Connection.updateOne(
      { _id: created._id },
      { $set: { createdAt: new Date(start + made * 4 * 60 * 1000) } },
      { timestamps: false }
    );
    made += 1;
  }

  // Recompute degrees from the connections we just wrote.
  for (const a of attendances) {
    const count = await Connection.countDocuments({
      eventId: event._id,
      $or: [{ userA: a.userId }, { userB: a.userId }],
    });
    a.connectionCount = count;
    await a.save();
  }

  console.log(`[seed] created ${made} connections`);
  console.log('');
  console.log('  Log in with:  ganga.b.nair@connstellation.demo / password123');
  console.log('  Join code:    DEMO24');
  console.log('');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
