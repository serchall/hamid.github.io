import React from 'react';
import VideoCard from './VideoCard';

const VideoGrid = ({ videos, onVideoClick }) => {
  if (!videos || videos.length === 0) {
    return (
      <div className="no-videos">
        <i className="fas fa-video"></i>
        <h4>ویدئویی یافت نشد</h4>
        <p>هنوز هیچ ویدئویی آپلود نشده است.</p>
      </div>
    );
  }

  return (
    <div className="video-grid">
      {videos.map((video, idx) => (
        <VideoCard key={video.id || idx} video={video} onClick={() => onVideoClick(video)} />
      ))}
    </div>
  );
};

export default VideoGrid; 