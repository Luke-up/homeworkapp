'use client';

import React, { useState, useEffect } from 'react';
import './styles.scss';

const ClassesPage = () => {
  const [classes, setClasses] = useState(["No classes found"]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
          },
        });
        if (res.status === 401) {
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            const retryRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/`, {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
              },
            });
            const retryData = await retryRes.json();
            if (retryData != '[]') {
              setClasses(retryData.classes);
            }
          } else {
            throw new Error('Unable to refresh token');
          }
        } else {
          const data = await res.json();
          if (data != '[]') {
            console.log(data);
            setClasses(data.classes);
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    const refreshToken = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: sessionStorage.getItem('refresh_token'),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem('access_token', data.access);
          sessionStorage.setItem('refresh_token', data.refresh);
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="classes">
      <h1>Classes</h1>
      <ul>
        {classes.map((classItem) => (
          <li key={classItem.id}>{classItem.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ClassesPage;
