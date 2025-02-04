package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIError struct {
	Status  int    `json:"-"`
	Message string `json:"error"`
}

func (e *APIError) Error() string {
	return e.Message
}

func NewNotFoundError(message string) *APIError {
	return &APIError{
		Status:  http.StatusNotFound,
		Message: message,
	}
}

func NewValidationError(message string) *APIError {
	return &APIError{
		Status:  http.StatusBadRequest,
		Message: message,
	}
}

func NewInternalError(message string) *APIError {
	return &APIError{
		Status:  http.StatusInternalServerError,
		Message: message,
	}
}

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors[0].Err
			if apiErr, ok := err.(*APIError); ok {
				c.JSON(apiErr.Status, gin.H{"error": apiErr.Message})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
		}
	}
}
