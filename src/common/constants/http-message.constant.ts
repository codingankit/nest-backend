export const HttpMessage = {
  Success: {
    GENERIC: 'Request successful',
  },
  Error: {
    Type: {
      GENERIC: 'Error',
      BAD_REQUEST: 'Bad Request',
      UNAUTHORIZED: 'Unauthorized',
      FORBIDDEN: 'Forbidden',
      NOT_FOUND: 'Not Found',
      CONFLICT: 'Conflict',
      UNPROCESSABLE_ENTITY: 'Unprocessable Entity',
      TOO_MANY_REQUESTS: 'Too Many Requests',
      INTERNAL_SERVER_ERROR: 'Internal Server Error',
      SERVICE_UNAVAILABLE: 'Service Unavailable',
      BAD_GATEWAY: 'Bad Gateway',
      GATEWAY_TIMEOUT: 'Gateway Timeout',
    },
    Message: {
      GENERIC: 'Unexpected error',
      RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
      FORBIDDEN: 'You do not have permission to access this resource',
      INVALID_PAYLOAD: 'Invalid request payload',
    },
  },
} as const;
