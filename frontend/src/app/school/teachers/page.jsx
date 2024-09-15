import './styles.scss';
import { useState, useEffect } from 'react';
import axiosInterceptor from '@/utils/axiosInterceptor';
import Link from 'next/link';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);

  const fetchStudents = async () => {
    try {
      const res = await axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/students/`);
      const data = await res.data;
      setStudents(data.students);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div>
      <h1>Students</h1>
      <ul>
        {students.map((student) => (
          <li key={student.id}>
            <Link href={`/school/students/${student.id}`}>{student.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentsPage;