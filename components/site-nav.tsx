'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/dashboard') || pathname === '/onboarding') return null;
  return <nav className="nav"><div className="container navin"><Link className="logo" href="/">QR<span>Command</span></Link><div className="links"><Link href="/#platform">Platform</Link><Link href="/#systems">Growth systems</Link><Link href="/pricing">Pricing</Link><Link href="/login">Sign in</Link><Link className="btn" href="/login?mode=signup">Start building</Link></div></div></nav>;
}
