'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { dashboardPathForUserType } from '@/utils/authRedirect';
import { clearTimedDemoLocalState } from '@/utils/timedDemo';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!base) {
        setError('Missing NEXT_PUBLIC_BACKEND_URL. Check frontend/.env.local.');
        return;
      }

      const res = await fetch(`${base}/core/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        clearTimedDemoLocalState();
        sessionStorage.setItem('access_token', data.access);
        sessionStorage.setItem('refresh_token', data.refresh);
        router.replace(dashboardPathForUserType(data.user_type));
        return;
      }

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        setError(`Login failed (${res.status}).`);
        return;
      }

      const msg =
        (typeof payload?.error === 'string' && payload.error) ||
        (typeof payload?.detail === 'string' && payload.detail) ||
        (Array.isArray(payload?.detail) && payload.detail.join(' ')) ||
        (Array.isArray(payload?.non_field_errors) && payload.non_field_errors.join(' ')) ||
        'Login failed';
      setError(msg);
    } catch (err) {
      console.error(err);
      setError('Network error — is the API running?');
    }
  };

  return (
    <div className="login">
      <h1>Login</h1>
      {error ? <p className="auth-page-error">{error}</p> : null}
      <form onSubmit={handleLogin}>
      <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required/>
      <Input label="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required/>
      <Button type="submit" text="Login"></Button>
      </form>
      <p>
        Don&apos;t have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
};

export default LoginPage;
