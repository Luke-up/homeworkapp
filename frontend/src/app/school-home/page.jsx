'use client';

import React, { useState, useEffect } from 'react';
import './styles.scss';
import axiosInterceptor from '@/utils/axiosInterceptor';

const ClassesPage = () => {
  const [classes, setClasses] = useState([{"name":"No classes found", "id":0}]);
  const [teachers, setTeachers] = useState([{"name":"No teachers found", "id":0}]);
  const [students, setStudents] = useState([{"name":"No students found", "id":0}]);

  useEffect(() => {
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
    fetchClasses();
  }, []);

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
          </div>
        ))}
    </div>
  );
};

export default ClassesPage;
