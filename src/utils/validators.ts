import * as yup from 'yup';

// Common validation schemas
export const emailSchema = yup
  .string()
  .email('Please enter a valid email address')
  .required('Email is required');

export const passwordSchema = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
  .required('Password is required');

export const nameSchema = yup
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .required('Name is required');

// Auth validation schemas
export const loginSchema = yup.object({
  email: emailSchema,
  password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const passwordResetRequestSchema = yup.object({
  email: emailSchema,
});

export const passwordResetSchema = yup.object({
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

// Database validation schemas
export const collectionQuerySchema = yup.object({
  page: yup.number().min(1).default(1),
  limit: yup.number().min(1).max(100).default(10),
  search: yup.string().optional(),
  sortBy: yup.string().optional(),
  sortOrder: yup.string().oneOf(['asc', 'desc']).default('asc'),
});

// Settings validation schemas
export const userSettingsSchema = yup.object({
  name: nameSchema,
  email: emailSchema,
  notifications: yup.object({
    email: yup.boolean().default(true),
    push: yup.boolean().default(true),
    sms: yup.boolean().default(false),
  }),
  theme: yup.string().oneOf(['light', 'dark', 'system']).default('system'),
});

// Custom validation functions
export const validateJson = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

export const validateObjectId = (value: string): boolean => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(value);
};

export const validateUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// Validation error formatter
export const formatValidationErrors = (
  error: yup.ValidationError
): Record<string, string> => {
  const errors: Record<string, string> = {};

  error.inner.forEach((err) => {
    if (err.path) {
      errors[err.path] = err.message;
    }
  });

  return errors;
};

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type PasswordResetRequestData = yup.InferType<
  typeof passwordResetRequestSchema
>;
export type PasswordResetData = yup.InferType<typeof passwordResetSchema>;
export type CollectionQueryData = yup.InferType<typeof collectionQuerySchema>;
export type UserSettingsData = yup.InferType<typeof userSettingsSchema>;
