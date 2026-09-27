export const ValidationMessage = {
  NAME_REQUIRED: 'Name is required',
  NAME_STRING: 'Name must be a string',
  NAME_INVALID:
    'Name can only contain letters, spaces, hyphens, and apostrophes',
  NAME_LENGTH: 'Name must be between 2 and 100 characters',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Email must be a valid email address',
  EMAIL_STRING: 'Email must be a string',
  GENDER_REQUIRED: 'Gender is required',
  GENDER_STRING: 'Gender must be a string',
  GENDER_INVALID: 'Gender must be either Male, Female, or Others',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_STRING: 'Password must be a string',
  PASSWORD_LENGTH: 'Password must be between 4 and 50 characters',
  UNKNOWN_PAYLOAD_KEYS: 'Unknown key(s) in the request payload',
} as const;
