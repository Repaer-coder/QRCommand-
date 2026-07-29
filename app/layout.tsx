import './globals.css';
import Link from 'next/link';
export const metadata={title:'QR Command — Smart QR Infrastructure',description:'Create, manage and measure dynamic QR experiences.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><nav className="nav"><div className="container navin"><Link className="logo" href="/">QR<span>Command</span></Link><div className="links"><Link href="/#features">Features</Link><Link href="/pricing">Pricing</Link><Link href="/login">Sign in</Link><Link className="btn" href="/dashboard">Open dashboard</Link></div></div></nav>{children}</body></html>}
