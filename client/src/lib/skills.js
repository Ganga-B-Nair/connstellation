/** Mirrors server/src/utils/skills.js — keep the two in sync. */
export const CATEGORY_COLORS = {
  frontend: '#7dd3fc',
  backend: '#a78bfa',
  ai: '#f472b6',
  mobile: '#4ade80',
  design: '#fbbf24',
  business: '#fb923c',
  hardware: '#22d3ee',
  other: '#cbd5e1',
};

export const CATEGORY_LABELS = {
  frontend: 'Frontend',
  backend: 'Backend',
  ai: 'AI / ML',
  mobile: 'Mobile',
  design: 'Design',
  business: 'Business',
  hardware: 'Hardware / IoT',
  other: 'Other',
};

export function colorFor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
}

/** Brightness from degree: a well-connected star burns brighter. */
export function brightnessFor(connectionCount) {
  return Math.min(1, 0.45 + connectionCount * 0.09);
}

/** Radius from degree, gently, so hubs read as bigger without dominating. */
export function radiusFor(connectionCount) {
  return 3 + Math.min(5, Math.sqrt(connectionCount) * 1.6);
}
