import { z } from 'zod';

// Email validation schema
const emailSchema = z.string().email({
  message: "Invalid email format"
});

// Password validation schema
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const validateEmail = (email: string): { success: boolean; error?: string } => {
  const result = emailSchema.safeParse(email);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || "Invalid email format"
    };
  }
  return { success: true };
};

export const validatePassword = (password: string): { success: boolean; error?: string } => {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || "Invalid password format"
    };
  }
  return { success: true };
};

export const validateLoginInput = (email: string, password: string): { 
  success: boolean; 
  errors: { email?: string; password?: string } 
} => {
  const errors: { email?: string; password?: string } = {};
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.success) {
    errors.email = emailValidation.error;
  }
  
  if (!password) {
    errors.password = "Password is required";
  }
  
  return {
    success: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegistrationInput = (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): {
  success: boolean;
  errors: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }
} => {
  const errors: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  } = {};
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.success) {
    errors.email = emailValidation.error;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.success) {
    errors.password = passwordValidation.error;
  }
  
  if (!firstName?.trim()) {
    errors.firstName = "First name is required";
  }
  
  if (!lastName?.trim()) {
    errors.lastName = "Last name is required";
  }
  
  return {
    success: Object.keys(errors).length === 0,
    errors
  };
}; 