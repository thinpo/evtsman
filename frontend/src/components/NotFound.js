import React from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorPage from './ErrorPage';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <ErrorPage
      code="404"
      title="Page Not Found"
      message="We couldn't find the page you're looking for. The page might have been removed, had its name changed, or is temporarily unavailable."
      action={
        <button onClick={() => navigate('/')} className="action-button">
          Go to Homepage
        </button>
      }
    />
  );
};

export default NotFound; 