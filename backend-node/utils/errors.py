from functools import wraps
from flask import jsonify

class APIError(Exception):
    """Base error class for API errors."""
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class NotFoundError(APIError):
    """Error raised when a resource is not found."""
    def __init__(self, message="Resource not found"):
        super().__init__(message, status_code=404)

class ValidationError(APIError):
    """Error raised when request validation fails."""
    def __init__(self, message="Validation error"):
        super().__init__(message, status_code=400)

def handle_error(error):
    """Global error handler for the application."""
    if isinstance(error, APIError):
        response = jsonify({"error": error.message})
        response.status_code = error.status_code
    else:
        response = jsonify({"error": str(error)})
        response.status_code = 500
    return response

def async_handler(f):
    """Decorator to handle async routes and catch exceptions."""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            return handle_error(e)
    return decorated 