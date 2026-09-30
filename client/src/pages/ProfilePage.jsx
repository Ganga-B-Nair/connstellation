import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';

/** Comma-separated input is the least fussy way to edit a tag list. */
function TagField({ id, label, value, onChange, hint }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field"
        value={value.join(', ')}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 12)
          )
        }
      />
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        headline: user.headline || '',
        bio: user.bio || '',
        skills: user.skills || [],
        interests: user.interests || [],
        socials: { ...user.socials },
      });
    }
  }, [user]);

  if (!form) return null;

  async function save(e) {
    e.preventDefault();
    setStatus('');
    setError('');
    try {
      await updateProfile(form);
      setStatus('Saved. Your star has been recoloured.');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl">Your star</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        Your first skill sets your colour in every sky. Your connection count sets your brightness.
      </p>

      <form onSubmit={save} className="panel mt-8 space-y-5 p-6">
        <div>
          <label className="label" htmlFor="pname">
            Name
          </label>
          <input
            id="pname"
            className="field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="phead">
            Headline
          </label>
          <input
            id="phead"
            className="field"
            maxLength={80}
            placeholder="Third-year CS · builds too many side projects"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="pbio">
            Bio
          </label>
          <textarea
            id="pbio"
            rows={3}
            maxLength={280}
            className="field"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <TagField
          id="pskills"
          label="Skills"
          value={form.skills}
          onChange={(skills) => setForm({ ...form, skills })}
          hint="Comma separated. The first one decides your star colour."
        />

        <TagField
          id="pinterests"
          label="Interests"
          value={form.interests}
          onChange={(interests) => setForm({ ...form, interests })}
          hint="Used for search and suggested connections."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pgh">
              GitHub
            </label>
            <input
              id="pgh"
              className="field"
              value={form.socials.github || ''}
              onChange={(e) =>
                setForm({ ...form, socials: { ...form.socials, github: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="pli">
              LinkedIn
            </label>
            <input
              id="pli"
              className="field"
              value={form.socials.linkedin || ''}
              onChange={(e) =>
                setForm({ ...form, socials: { ...form.socials, linkedin: e.target.value } })
              }
            />
          </div>
        </div>

        {error && <p className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300">{error}</p>}
        {status && (
          <p className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-300">{status}</p>
        )}

        <button type="submit" className="btn-primary">
          Save profile
        </button>
      </form>
    </div>
  );
}
