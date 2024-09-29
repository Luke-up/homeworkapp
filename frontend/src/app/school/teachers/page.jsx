'use client';

import './styles.scss';
import { useState, useEffect } from 'react';
import axiosInterceptor from '@/utils/axiosInterceptor';
import Link from 'next/link';

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);

  const fetchTeachers = async () => {
    try {
      const res = await axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teachers/`);
      const data = await res.data;
      setTeachers(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  return (
    <div>
      <h1>Teachers</h1>
      <ul>
        {teachers ? teachers.map((teacher) => (
          <li key={teacher.id}>
            <Link href={`/school/teachers/${teacher.id}`}>{teacher.name}</Link>
          </li>
        )): ''}
      </ul>
    </div>
  );
};

export default TeachersPage;