import type { Metadata } from 'next';
import './globals.css';
import SiteNav from '@/components/site-nav';

export const metadata: Metadata = {
  title: { default: 'QR Command | Business Optimization Through Every Scan', template: '%s | QR Command' },
  description: 'Create permanent dynamic QR campaigns, connect locations, measure real scan activity, and operate growth workflows from one business command center.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteNav />{children}</body></html>;
}
