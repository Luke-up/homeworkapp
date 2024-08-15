'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import './styles.scss';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const signupRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/create-school/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: schoolName,
          user_type: 'school',
        }),
      });

      if (signupRes.ok) {
        const loginRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (loginRes.ok) {
          const data = await loginRes.json();
          sessionStorage.setItem('access_token', data.access);
          sessionStorage.setItem('refresh_token', data.refresh);
          router.push('/');
        } else {
          const data = await loginRes.json();
          setError(data.error || 'Login failed');
        }
      } else {
        const data = await signupRes.json();
        setError(data.error || 'Signup failed');
      }
    } catch (error) {
      setError('An error occurred');
    }
  };

  return (
    <div className="signup">
      <h1>Signup</h1>
      {error && <p>{error}</p>}
      <form onSubmit={handleSignup}>
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required/>
        <Input label="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required/>
        <Input label="School Name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} type="text" required/>
        <Button type="submit" text="Sign Up"></Button>
      </form>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
};

export default SignupPage;
