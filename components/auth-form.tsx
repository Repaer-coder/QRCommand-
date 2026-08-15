'use client';

import React from 'react';

import { type FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeReturnPath } from '@/lib/paths';
import LegalLinks from '@/components/legal-links';
import { legalPolicyLinks } from '@/lib/legal';
import { useI18n } from '@/components/i18n-provider';

import type { LocaleContext } from '@/lib/i18n/translate';

export default function AuthForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const next = safeReturnPath(searchParams.get('next'));
  const [mode, setMode] = useState<'signin' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(searchParams.get('error') ? t('auth.errorSignInUnavailable') : '');
  const [loading, setLoading] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    if (mode === 'signin') {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      setLoading(false);
      if (!response.ok) return setMessage(payload.error ?? t('auth.errorSignInUnavailable'));
      window.location.assign(next);
      return;
    }

    if (!acceptedPolicies) {
      setLoading(false);
      return setMessage(t('auth.consentRequired'));
    }

    const supabase = createClient();
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    if (result.error) return setMessage(result.error.message);
    if (!result.data.session) {
      setMessage(t('auth.checkEmailSignup'));
      return;
    }
    window.location.assign(next);
  }

  async function resetPassword() {
    if (!email) return setMessage(t('auth.forgotMessage'));
    setLoading(true);
    const result = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent('/auth/update-password')}`,
    });
    setLoading(false);
    setMessage(result.error ? result.error.message : t('auth.passwordResetSent'));
  }

  return (
    <div className="authcard card">
      <LocaleHeader />
      <h1>{mode === 'signin' ? t('auth.welcome') : t('auth.buildCenter')}</h1>
      <p className="muted">{t('auth.subtitle')}</p>
      <form onSubmit={submit} className="authform">
        <label>
          {t('auth.emailLabel')}
          <input className="input" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('auth.emailLabel')} />
        </label>
        <label>
          {t('auth.passwordLabel')}
          <input
            className="input"
            type="password"
            minLength={8}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('auth.passwordLabel')}
          />
        </label>
        <button className="btn" disabled={loading}>{loading ? t('auth.working') : (mode === 'signin' ? t('auth.signInSubmit') : t('auth.createSubmit'))}</button>
      </form>
      {message && <p className="notice" role="status">{message}</p>}

      {mode === 'signup' && (
        <label className="checkfield auth-consent">
          <input
            type="checkbox"
            name="policy-consent"
            checked={acceptedPolicies}
            onChange={(event) => setAcceptedPolicies(event.currentTarget.checked)}
            required
          />
          <span>
            {t('auth.consentPrefix')}{' '}
            <a href={legalPolicyLinks[0].href} target="_blank" rel="noopener noreferrer">
              {t('legalPages.terms.title')}
            </a>{' '}
            {t('auth.consentAnd')}{' '}
            <a href={legalPolicyLinks[3].href} target="_blank" rel="noopener noreferrer">
              {t('legalPages.refund.title')}
            </a>{' '}
            {t('auth.consentAcknowledge')}{' '}
            <a href={legalPolicyLinks[1].href} target="_blank" rel="noopener noreferrer">
              {t('legalPages.privacy.title')}
            </a>{' '}
            {t('auth.consentAnd')}
            <a href={legalPolicyLinks[2].href} target="_blank" rel="noopener noreferrer">
              {' '}
              {t('legalPages.acceptableUse.title')}
            </a>
            .
          </span>
        </label>
      )}

      <div className="auth-options">
        <LegalLinks />
        <div className="actions">
          <button
            className="textbutton"
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setMessage('');
            }}
          >
            {mode === 'signin' ? t('auth.needAccount') : t('auth.alreadyHave')}
          </button>
          {mode === 'signin' && (
            <button className="textbutton" type="button" disabled={loading} onClick={resetPassword}>
              {t('auth.forgotPassword')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LocaleHeader() {
  const { t } = useI18n() as LocaleContext;
  return <div className="eyebrow">{t('auth.secureWorkspace')}</div>;
}
