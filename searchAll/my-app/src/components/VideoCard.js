import React from 'react';

const VideoCard = ({ video, onClick }) => {
  const isLiked = video.isLiked;
  const timeAgo = video.timeAgo;

  return (
    <div className="video-card" data-video-id={video.id} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="video-thumbnail">
        <img
          src={video.thumbnail || 'https://via.placeholder.com/300x200/333/ffffff?text=ویدئو'}
          alt={video.title}
          onError={e => (e.target.src = 'https://via.placeholder.com/300x200/333/ffffff?text=ویدئو')}
        />
        <div className="play-button">
          <i className="fas fa-play"></i>
        </div>
      </div>
      <div className="video-info">
        <div className="video-title">{video.title}</div>
        <div className="video-meta">
          <span>{video.user_name || 'کاربر ناشناس'}</span>
          <div className="video-stats">
            <span>
              <i className="fas fa-eye"></i>
              {video.views}
            </span>
            <span>
              <i className={`fas fa-heart ${isLiked ? 'text-danger' : ''}`}></i>
              {video.likes}
            </span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard; 