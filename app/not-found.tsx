import Link from 'next/link';
export default function NotFound() { return <main className="authpage"><section className="card authcard empty"><div className="emptyicon">404</div><h1>That resource is not here.</h1><p className="muted">It may have been moved, archived, or outside your workspace.</p><Link className="btn" href="/dashboard">Return to dashboard</Link></section></main>; }
