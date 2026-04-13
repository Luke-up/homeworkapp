'use client';

import '../../school-dashboard.scss';
import './styles.scss';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axiosInterceptor from '@/utils/axiosInterceptor';

const TeacherDetailPage = () => {
  const params = useParams();
  const id = params?.id;
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchTeacher = async () => {
      try {
        const res = await axiosInterceptor.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teachers/${id}/`
        );
        setTeacher(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchTeacher();
  }, [id]);

  if (!teacher) {
    return <p className="school-dashboard__muted">Loading…</p>;
  }

  const queue = teacher.homework || [];

  return (
    <div className="classes">
      <p>
        <Link href="/school/teachers">← Teacher search</Link>
      </p>
      <h1>{teacher.name}</h1>

      <div className="class-item">
        <h2>Classes</h2>
        {!teacher.classes?.length ? (
          <p>Not assigned to any class.</p>
        ) : (
          <ul>
            {teacher.classes.map((c) => (
              <li key={c.id}>
                {c.name} (level {c.level})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="class-item">
        <h2>Students reached</h2>
        {!teacher.students?.length ? (
          <p>No students in this teacher&apos;s classes.</p>
        ) : (
          <ul>
            {teacher.students.map((s) => (
              <li key={s.id}>
                <Link href={`/school/students/${s.id}`}>{s.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="class-item">
        <h2>Homework awaiting feedback</h2>
        {!queue.length ? (
          <p>Queue is clear.</p>
        ) : (
          <ul>
            {queue.map((sh) => (
              <li key={sh.id}>
                {sh.homework?.title || 'Assignment'} (student #{sh.student})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeacherDetailPage;
