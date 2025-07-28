import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await axios.get(`/api/courses/${id}`);
      setCourse(res.data.course);
    } catch (e) {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5">در حال بارگذاری...</div>;
  if (!course) return <div className="text-center py-5 text-muted">دوره یافت نشد.</div>;

  return (
    <div className="course-detail-page fade-in">
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <img
            src={course.thumbnail || '/placeholder-course.jpg'}
            alt={course.title}
            className="img-fluid rounded shadow"
            style={{ maxHeight: 220, objectFit: 'cover' }}
            onError={e => { e.target.src = '/placeholder-course.jpg'; }}
          />
        </div>
        <div className="col-md-8">
          <h2 className="mb-2">{course.title}</h2>
          <p className="text-muted mb-3">{course.description}</p>
          <div className="mb-2">
            <span className="badge bg-primary me-2">مدرس: {course.instructor?.name || '---'}</span>
            <span className="badge bg-success">{course.price ? `${course.price.toLocaleString()} تومان` : 'رایگان'}</span>
          </div>
        </div>
      </div>
      <div className="card p-4 mb-4">
        <h5 className="mb-3">جلسات دوره</h5>
        {course.lessons?.length === 0 ? (
          <div className="text-muted">جلسه‌ای ثبت نشده است.</div>
        ) : (
          <ul className="list-group">
            {course.lessons.map((lesson, idx) => (
              <li
                key={idx}
                className={`list-group-item d-flex justify-content-between align-items-center ${selectedLesson === lesson ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedLesson(lesson)}
              >
                <span>{lesson.title}</span>
                <span className="badge bg-secondary">{lesson.duration ? `${lesson.duration} دقیقه` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedLesson && (
        <div className="card p-4 mb-4">
          <h6 className="mb-3">{selectedLesson.title}</h6>
          {selectedLesson.videoUrl && (
            <div className="mb-3">
              <video controls width="100%" style={{ borderRadius: 8 }}>
                <source src={selectedLesson.videoUrl} type="video/mp4" />
                مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
              </video>
            </div>
          )}
          <div>{selectedLesson.content}</div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail; 