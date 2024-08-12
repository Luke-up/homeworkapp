'use client';

import React, { useState, useEffect } from 'react';
import './styles.scss';
import axiosInterceptor from '@/utils/axiosInterceptor';

const ClassesPage = () => {
  const [classes, setClasses] = useState([{"name":"No classes found", "id":0}]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/`, {
        });
        const data = await res.json();
        if (data != '[]') {
          console.log(data);
          setClasses(data.classes);
        }
      } catch (error) {
        console.log(error);
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
