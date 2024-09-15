import React, { useState } from 'react';
import './classblock.scss';
import Button from '../Button/Button';
import Input from '../../components/Input/Input';
import InputSelect from '../../components/InputSelect/InputSelect';
import axiosInterceptor from '@/utils/axiosInterceptor';

const ClassBlock = ({ classItem, teachers, students, fetchClasses}) => {
    const [studentAdd, setStudentAdd] = useState('');

    const handleDeleteClass = async (e) => {
        e.preventDefault();
        console.log(classItem.id);
        try {
          const res = await axiosInterceptor.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/delete/`, {
            data: { class_id: classItem.id },
          });
          const data = await res.data;
          if (data.message === "Class deleted successfully") {
            fetchClasses();
          }
        } catch (error) {
          console.log(error);
        }
      };

    const toggleAddStudent = (classId) => (e) => {
      e.preventDefault();
      const form = document.querySelector(`#id_class_${classId} .class-students`);
      form.classList.toggle('form-open');
    }

    return (
        <div className="class-item" key={classItem.id} id={`id_class_${classItem.id}`}>
          <div className="class-top">
            <div className="class-name">
            {classItem && classItem.name}
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
              <button className="open-close" onClick={toggleAddStudent(classItem.id)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                  <line x1="1.5" y1="10.5" x2="19.5" y2="10.5" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="10.5" y1="1.5" x2="10.5" y2="19.5" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="students-add-form">
              <form>
                <InputSelect label="Add Student" value={studentAdd} onChange={setStudentAdd} type="text" options={students} required/>

                <Button type="submit" text="Add Student"></Button>
              </form>
            </div>
            {classItem.students ? 
            students.map((student, index) => (
              classItem.students.includes(student.id) && (
              <div key={student.id} className={`student ${index % 2 === 0 ? 'even' : 'odd'}`}>
                {student.name}
              </div>
              )
            )) : null}
          </div>
          { classItem.students && classItem.students.length === 0  && classItem.teachers.length === 0 ? <Button type="submit" text="Delete Class" color="dark" onClick={handleDeleteClass}/> : ""}
        </div>
    );
  };
  
  export default ClassBlock;
