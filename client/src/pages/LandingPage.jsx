import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-star-frontend">
        connect using constellations
      </p>
      <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
        Every person you meet
        <br />
        draws a line in the sky.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-slate-400">
        Connstellation turns event networking into a living night sky. Attendees are stars, coloured
        by what they build and brightened by who they have met. Every connection draws a line, so by
        the end of the event the sky shows who actually talked to whom.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/register" className="btn-primary">
          Create your star
        </Link>
        <Link to="/login" className="btn-ghost">
          Log in
        </Link>
      </div>

      <div className="panel mx-auto mt-16 grid max-w-2xl gap-6 p-8 text-left sm:grid-cols-3">
        {[
          ['Your colour', 'Set by the first skill on your profile.'],
          ['Your brightness', 'Grows with every connection you make.'],
          ['Your constellation', 'Dim the sky to see only the people you met.'],
        ].map(([title, body]) => (
          <div key={title}>
            <h3 className="text-sm">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
