import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data.courses || []);
    } catch (e) {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5">در حال بارگذاری...</div>;
  }

  return (
    <div className="courses-page fade-in">
      <h2 className="mb-4">
        <i className="fas fa-graduation-cap text-primary me-2"></i>
        دوره‌های آموزشی
      </h2>
      {courses.length === 0 ? (
        <div className="text-center text-muted py-5">دوره‌ای یافت نشد.</div>
      ) : (
        <div className="row">
          {courses.map(course => (
            <div key={course._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <img
                  src={course.thumbnail || '/placeholder-course.jpg'}
                  className="card-img-top"
                  alt={course.title}
                  style={{ height: 180, objectFit: 'cover' }}
                  onError={e => { e.target.src = '/placeholder-course.jpg'; }}
                />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text text-muted small">{course.description?.substring(0, 80)}...</p>
                  <div className="mt-auto">
                    <Link to={`/course/${course._id}`} className="btn btn-primary w-100">
                      مشاهده دوره
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses; 