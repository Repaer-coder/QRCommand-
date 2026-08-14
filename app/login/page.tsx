import React from 'react';
import AuthForm from '@/components/auth-form';
import { Suspense } from 'react';
export default function LoginPage(){return <main className="authpage"><Suspense fallback={<div className="card authcard">Loading secure sign in...</div>}><AuthForm/></Suspense></main>}
