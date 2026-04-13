'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { dashboardPathForUserType } from '@/utils/authRedirect';
import { clearTimedDemoLocalState } from '@/utils/timedDemo';

const ReCAPTCHA = dynamic(() => import('react-google-recaptcha'), { ssr: false });

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [demoEndedMessage, setDemoEndedMessage] = useState(false);
  const recaptchaRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search).get('demo_expired');
    setDemoEndedMessage(q === '1');
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (recaptchaSiteKey && !recaptchaToken) {
      setError('Please complete the captcha.');
      return;
    }
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!base) {
        setError('Missing NEXT_PUBLIC_BACKEND_URL. Check frontend/.env.local.');
        return;
      }

      const signupBody = {
        email,
        password,
        name: schoolName,
        user_type: 'school',
      };
      if (recaptchaSiteKey) {
        signupBody.recaptcha_token = recaptchaToken;
      }

      const signupRes = await fetch(`${base}/core/create-school/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupBody),
      });

      if (!signupRes.ok) {
        let payload = null;
        try {
          payload = await signupRes.json();
        } catch {
          setError(`Signup failed (${signupRes.status}).`);
          return;
        }
        let msg =
          (typeof payload?.error === 'string' && payload.error) ||
          (typeof payload?.detail === 'string' && payload.detail) ||
          (Array.isArray(payload?.detail) && payload.detail.join(' ')) ||
          '';
        if (!msg && payload && typeof payload === 'object') {
          const bits = [];
          Object.entries(payload).forEach(([k, v]) => {
            if (Array.isArray(v)) bits.push(`${k}: ${v.join(' ')}`);
            else if (typeof v === 'string') bits.push(`${k}: ${v}`);
          });
          msg = bits.join(' · ') || 'Signup failed';
        }
        setError(msg || 'Signup failed');
        recaptchaRef.current?.reset();
        setRecaptchaToken('');
        return;
      }

      const loginRes = await fetch(`${base}/core/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        let payload = null;
        try {
          payload = await loginRes.json();
        } catch {
          setError('School created but login failed. Try logging in manually.');
          return;
        }
        const msg =
          (typeof payload?.error === 'string' && payload.error) ||
          (typeof payload?.detail === 'string' && payload.detail) ||
          'School created but login failed. Try logging in manually.';
        setError(msg);
        return;
      }

      const data = await loginRes.json();
      clearTimedDemoLocalState();
      sessionStorage.setItem('access_token', data.access);
      sessionStorage.setItem('refresh_token', data.refresh);
      router.replace(dashboardPathForUserType(data.user_type));
    } catch (err) {
      console.error(err);
      setError('Network error — is the API running?');
    }
  };

  return (
    <div className="signup">
      <h1>Signup</h1>
      {demoEndedMessage ? (
        <p className="auth-page-error" role="status">
          Your 20-minute live demo has ended (time limit). You can start another from the{' '}
          <a href="/">home page</a>.
        </p>
      ) : null}
      {error ? <p className="auth-page-error">{error}</p> : null}
      <form onSubmit={handleSignup}>
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <Input
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
        <Input
          label="School Name"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          type="text"
          required
        />
        {recaptchaSiteKey ? (
          <div className="signup-recaptcha">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={recaptchaSiteKey}
              onChange={(token) => setRecaptchaToken(token || '')}
            />
          </div>
        ) : null}
        <Button type="submit" text="Sign Up"></Button>
      </form>
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default SignupPage;
