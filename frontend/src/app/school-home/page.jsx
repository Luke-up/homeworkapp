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
                    <div className="delete-teacher">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <line x1="14.2441" y1="5.75874" x2="5.75886" y2="14.244" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="14.242" y1="14.2426" x2="5.75676" y2="5.75736" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    </div>
                  </div>
                )
              )) : null}
              <span className="open-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                  <line x1="1.5" y1="10.5" x2="19.5" y2="10.5" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="10.5" y1="1.5" x2="10.5" y2="19.5" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </div>
          </div>
          <div className="class-students">
            <div className="students-add">
              Students
              <span className="open-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                  <line x1="1.5" y1="10.5" x2="19.5" y2="10.5" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="10.5" y1="1.5" x2="10.5" y2="19.5" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </div>
            {/* <div className="students-add">
              <form>
                <Input label="Add Student" type="text" required/>
                <Button type="submit" text="Add Student"></Button>
              </form>
            </div> */}
            {classItem.students ? 
            students.map((student, index) => (
              classItem.students.includes(student.id) && (
              <div key={student.id} className={`student ${index % 2 === 0 ? 'even' : 'odd'}`}>
                {student.name}
              </div>
              )
            )) : null}
          </div>
          {classItem.students.length === 0 && classItem.teachers.length === 0 ? <Button type="submit" text="Delete Class" color="dark">Delete Class</Button> : ""}
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
