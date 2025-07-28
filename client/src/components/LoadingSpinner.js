import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">در حال بارگذاری...</span>
      </div>
      <p className="mt-3 text-muted">در حال بارگذاری...</p>
    </div>
  );
};

export default LoadingSpinner; 