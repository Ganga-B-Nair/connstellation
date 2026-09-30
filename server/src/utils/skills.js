/**
 * Skill categories drive star colour in the sky view.
 * Keep this list in sync with client/src/lib/skills.js
 */
export const SKILL_CATEGORIES = {
  frontend: {
    label: 'Frontend',
    color: '#7dd3fc',
    skills: ['react', 'vue', 'angular', 'css', 'tailwind', 'html', 'svelte', 'nextjs', 'ui'],
  },
  backend: {
    label: 'Backend',
    color: '#a78bfa',
    skills: ['node', 'express', 'django', 'flask', 'spring', 'go', 'rust', 'api', 'mongodb', 'sql'],
  },
  ai: {
    label: 'AI / ML',
    color: '#f472b6',
    skills: ['ml', 'ai', 'pytorch', 'tensorflow', 'nlp', 'cv', 'llm', 'data science'],
  },
  mobile: {
    label: 'Mobile',
    color: '#4ade80',
    skills: ['flutter', 'react native', 'android', 'ios', 'kotlin', 'swift'],
  },
  design: {
    label: 'Design',
    color: '#fbbf24',
    skills: ['figma', 'ux', 'design', 'illustration', 'motion', 'branding'],
  },
  business: {
    label: 'Business',
    color: '#fb923c',
    skills: ['product', 'marketing', 'finance', 'sales', 'pitching', 'strategy'],
  },
  hardware: {
    label: 'Hardware / IoT',
    color: '#22d3ee',
    skills: ['iot', 'arduino', 'raspberry pi', 'embedded', 'robotics', 'pcb'],
  },
  other: {
    label: 'Other',
    color: '#cbd5e1',
    skills: [],
  },
};

export const CATEGORY_KEYS = Object.keys(SKILL_CATEGORIES);

/** Map a free-text skill to a category key. */
export function categoriseSkill(skill = '') {
  const needle = String(skill).trim().toLowerCase();
  if (!needle) return 'other';
  for (const [key, cfg] of Object.entries(SKILL_CATEGORIES)) {
    if (cfg.skills.some((s) => needle === s || needle.includes(s))) return key;
  }
  return 'other';
}

/** The category a person's star should be coloured by: their first skill wins. */
export function primaryCategory(skills = []) {
  if (!skills.length) return 'other';
  return categoriseSkill(skills[0]);
}
