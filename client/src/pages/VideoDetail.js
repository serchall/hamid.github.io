import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const VideoDetail = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideo();
    // eslint-disable-next-line
  }, [id]);

  const fetchVideo = async () => {
    try {
      const res = await axios.get(`/api/videos/${id}`);
      setVideo(res.data.video);
    } catch (e) {
      setVideo(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5">در حال بارگذاری...</div>;
  if (!video) return <div className="text-center py-5 text-muted">ویدئو یافت نشد.</div>;

  return (
    <div className="video-detail-page fade-in">
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="video-player-wrapper">
            <video controls width="100%" style={{ borderRadius: 8 }}>
              <source src={video.url} type="video/mp4" />
              مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
            </video>
          </div>
        </div>
        <div className="col-md-6">
          <h2 className="mb-2">{video.title}</h2>
          <p className="text-muted mb-3">{video.description}</p>
          <div className="mb-2">
            <span className="badge bg-primary me-2">مدت: {video.duration ? `${video.duration} دقیقه` : '---'}</span>
            <span className="badge bg-secondary">{new Date(video.createdAt).toLocaleDateString('fa-IR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail; 