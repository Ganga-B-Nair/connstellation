import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

/** Shared markup for login + register; `mode` picks which. */
export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate('/events');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl">{isRegister ? 'Join the sky' : 'Welcome back'}</h1>
      <p className="mt-2 text-sm text-slate-400">
        {isRegister
          ? 'Your skills decide your colour. Your connections decide how bright you burn.'
          : 'Log in to see the constellations you have drawn.'}
      </p>

      <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
        {isRegister && (
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input id="name" className="field" value={form.name} onChange={set('name')} required />
          </div>
        )}

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="field"
            value={form.password}
            onChange={set('password')}
            minLength={isRegister ? 8 : undefined}
            required
          />
          {isRegister && <p className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>}
        </div>

        {error && <p className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'One moment…' : isRegister ? 'Create account' : 'Log in'}
        </button>

        <p className="text-center text-xs text-slate-400">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            to={isRegister ? '/login' : '/register'}
            className="text-star-frontend hover:underline"
          >
            {isRegister ? 'Log in' : 'Register'}
          </Link>
        </p>
      </form>
    </div>
  );
}
