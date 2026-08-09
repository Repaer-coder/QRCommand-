'use client';

import { type FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeReturnPath } from '@/lib/paths';

type Mode = 'signin' | 'signup';

export default function AuthForm() {
  const searchParams = useSearchParams();
  const next = safeReturnPath(searchParams.get('next'));
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(searchParams.get('error') ? 'The sign-in link could not be completed. Please try again.' : '');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const result = mode === 'signup'
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === 'signup' && !result.data.session) {
      setMessage('Check your email to confirm the account, then return here to sign in.');
      return;
    }
    window.location.assign(next);
  }

  async function resetPassword() {
    if (!email) return setMessage('Enter your email address first.');
    setLoading(true);
    const result = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent('/auth/update-password')}`,
    });
    setLoading(false);
    setMessage(result.error ? result.error.message : 'Check your email for a secure password reset link.');
  }

  return (
    <div className="authcard card">
      <div className="eyebrow">Secure business workspace</div>
      <h1>{mode === 'signin' ? 'Welcome back' : 'Build your QR command center'}</h1>
      <p className="muted">Create permanent campaign links, connect locations, and turn every scan into useful business data.</p>
      <form onSubmit={submit} className="authform">
        <label>Email<input className="input" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
        <label>Password<input className="input" type="password" minLength={8} required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
        <button className="btn" disabled={loading}>{loading ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      </form>
      {message && <p className="notice" role="status">{message}</p>}
      <div className="auth-options">
        <button className="textbutton" type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>
          {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
        {mode === 'signin' && <button className="textbutton" type="button" disabled={loading} onClick={resetPassword}>Forgot your password?</button>}
      </div>
    </div>
  );
}
