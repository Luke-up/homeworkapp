'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    const accessToken = sessionStorage.getItem('access_token');
    if (accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/auth-status/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      .then(res => res.json())
      .then(data => {
        const userType = data.userType;
        if (userType === 'school') {
          router.push('/school-home');
        } else if (userType === 'teacher') {
          router.push('/teacher-home');
        } else if (userType === 'student') {
          router.push('/student-home');
        } else {
          router.push('/signup');
        }
      })
      .catch(error => {
        console.error('Error checking authentication status:', error);
        router.push('/signup');
      });
    } else {
      router.push('/signup');
    }
  }, [router]);

  return <div>Redirecting...</div>;
};

export default HomePage;
