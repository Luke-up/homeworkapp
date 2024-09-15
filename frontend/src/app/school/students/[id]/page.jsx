import './styles.scss';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axiosInterceptor from '@/utils/axiosInterceptor';

const StudentDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);

  const fetchStudent = async () => {
    try {
      const res = await axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/students/${id}/`);
      const data = await res.data;
      setStudent(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  if (!student) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{student.name}</h1>
      <p>Details about the student...</p>
    </div>
  );
};

export default StudentDetailPage;