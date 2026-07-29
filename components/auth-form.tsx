'use client';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm() {
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMessage('');
    const supabase = createClient();
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === 'signup') return setMessage('Check your email to confirm your account.');
    location.href = '/dashboard';
  }

  return <div className="authcard card">
    <div className="eyebrow">Secure business account</div>
    <h1>{mode === 'signin' ? 'Welcome back' : 'Create your workspace'}</h1>
    <p className="muted">Save campaigns, edit live destinations, and measure every scan.</p>
    <form onSubmit={submit} className="authform">
      <label>Email<input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input className="input" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      <button className="btn" disabled={loading}>{loading ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
    </form>
    {message && <p className="notice">{message}</p>}
    <button className="textbutton" onClick={()=>setMode(mode === 'signin' ? 'signup' : 'signin')}>
      {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
    </button>
  </div>;
}
