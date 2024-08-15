'use client';

import React, { useState, useEffect } from 'react';
import './styles.scss';
import axiosInterceptor from '@/utils/axiosInterceptor';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

const ClassesPage = () => {
  const [classes, setClasses] = useState([{"name":"No classes found", "id":0}]);
  const [teachers, setTeachers] = useState([{"name":"No teachers found", "id":0}]);
  const [students, setStudents] = useState([{"name":"No students found", "id":0}]);
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
        console.log(res);
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
      console.log(data);
      fetchClasses();
      setNewClass('');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="classes">
      <h1>Classes</h1>
      {classes.map((classItem) => (
        <div className="class-item" key={classItem.id}>
          <div className="class-top">
            <div className="class-name">
            {classItem.name}
            </div>
            <div className='class-teachers'>
              Teachers: 
              {classItem.teachers ? teachers.map((teacher) => (
                classItem.teachers.includes(teacher.id) && (
                  <div key={teacher.id} className='teacher'>
                    {teacher.name}
                    <div className="delete-teacher">X</div>
                  </div>
                )
              )) : null}
              <span>X</span>
            </div>
          </div>
          <div className="class-students">
            <span>Students:</span><span>X</span>
            {classItem.students ? students.map((student) => (
              classItem.students.includes(student.id) && (
              <div key={student.id} className='student'>
                {student.name}
              </div>
              )
            )): null}
          </div>
          {classItem.students && classItem.teachers ? <button type="submit" text="Delete Class">Delete Class</button> : ""}
        </div>
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
