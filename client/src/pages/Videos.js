import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await axios.get('/api/videos');
      setVideos(res.data.videos || []);
    } catch (e) {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5">در حال بارگذاری...</div>;
  }

  return (
    <div className="videos-page fade-in">
      <h2 className="mb-4">
        <i className="fas fa-video text-primary me-2"></i>
        ویدئوهای آموزشی
      </h2>
      {videos.length === 0 ? (
        <div className="text-center text-muted py-5">ویدئویی یافت نشد.</div>
      ) : (
        <div className="row">
          {videos.map(video => (
            <div key={video._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <img
                  src={video.thumbnail || '/placeholder-video.jpg'}
                  className="card-img-top"
                  alt={video.title}
                  style={{ height: 180, objectFit: 'cover' }}
                  onError={e => { e.target.src = '/placeholder-video.jpg'; }}
                />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{video.title}</h5>
                  <p className="card-text text-muted small">{video.description?.substring(0, 80)}...</p>
                  <div className="mt-auto">
                    <Link to={`/video/${video._id}`} className="btn btn-primary w-100">
                      مشاهده ویدئو
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

export default Videos; 