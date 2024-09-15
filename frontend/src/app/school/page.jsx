'use client';

import React, { useState, useEffect } from 'react';
import './styles.scss';
import axiosInterceptor from '@/utils/axiosInterceptor';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import ClassBlock from '../../components/ClassBlock/ClassBlock';
import Link from 'next/link';

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [newClass, setNewClass] = useState('');

  const fetchClasses = async () => {
    try {
      const res = await axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/`, {
      });
      const data = await res.data;
      if (data != '[]') {
        setClasses(data.classes);
        setTeachers(data.teachers);
        setStudents(data.students);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateNewClass = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInterceptor.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/create`, {
          name: newClass,
          description: 'school',
          level: 1,
      });
      const data = await res.data;
      fetchClasses();
      setNewClass('');
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInterceptor.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logout/`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="classes">
      <nav>
        <Link href="/school/">Classes</Link>
        <Link href="/school/students">Students</Link>
        <Link href="/school/teachers">Teachers</Link>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <h1>Classes</h1>
      {classes.map((classItem) => (
        <ClassBlock key={classItem.id} classItem={classItem} teachers={teachers} students={students} fetchClasses={fetchClasses}/>
      ))}
      <div className="class-item">
        <form onSubmit={handleCreateNewClass} className="class-top new-class">
          <Input label="Class Name" value={newClass} onChange={(e) => setNewClass(e.target.value)} type="text" required/>
          <Button type="submit" text="Add Class"></Button>
        </form>
      </div>
    </div>
  );
};

export default ClassesPage;
