import React from 'react';
import PropTypes from 'prop-types';
import './ErrorPage.css';

const ErrorPage = ({ code, title, message, error, action }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="error-page">
      <div className="error-content">
        {code && <div className="error-code">{code}</div>}
        <h1 className="error-title">{title}</h1>
        <p className="error-message">{message}</p>
        {action && <div className="error-action">{action}</div>}
        {isDevelopment && error && (
          <div className="error-details">
            <pre>{error.message}</pre>
            {error.stack && (
              <pre className="error-stack">{error.stack}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ErrorPage.propTypes = {
  code: PropTypes.string,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  error: PropTypes.object,
  action: PropTypes.node
};

export default ErrorPage; 