import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-sky-line/60 bg-sky-void/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="relative block h-2.5 w-2.5 rounded-full bg-star-frontend shadow-[0_0_14px_#7dd3fc]" />
          <span className="font-display text-lg tracking-tight text-slate-100">
            Conn<span className="text-star-frontend">stellation</span>
          </span>
        </Link>

        {user && (
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/events" className="btn-ghost">
              My events
            </Link>
            <Link to="/profile" className="btn-ghost">
              {user.name.split(' ')[0]}
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn-ghost"
            >
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
