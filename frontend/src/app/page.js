'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/global.scss';

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
    } 
  }, [router]);

  return (
    <>
  <div className="homefold">
    <div className="homewelcome">

      <h1>Granadilla</h1>
  
      <p>Granadilla is a platform for teachers to create and share educational content with their students.</p>

      <a href="/signup" className="button">Sign Up</a>

      <p className="italics">Granadilla is a proof of concept and is not yet ready for production use.</p>

    </div>
  </div>
  <div className="homefooter">
    <div className="footer">
      <p>Granadilla is a project by Luke Paine.</p>
      </div>
  </div>
  </>
)
};

export default HomePage;
