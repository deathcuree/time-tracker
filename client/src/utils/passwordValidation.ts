export interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const validateNewPassword = (newPassword: string, currentPassword: string): string | undefined => {
  if (!newPassword) {
    return "New password is required";
  }
  if (newPassword.length < 6) {
    return "Password must be at least 6 characters long";
  }
  if (newPassword === currentPassword) {
    return "New password must be different from current password";
  }
  return undefined;
};

export const validateConfirmPassword = (confirmPassword: string, newPassword: string): string | undefined => {
  if (!confirmPassword) {
    return "Please confirm your new password";
  }
  if (confirmPassword !== newPassword) {
    return "Passwords do not match";
  }
  return undefined;
};

export const validatePasswordForm = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): FormErrors => {
  const errors: FormErrors = {};
  
  if (!currentPassword) {
    errors.currentPassword = "Current password is required";
  }
  
  const newPasswordError = validateNewPassword(newPassword, currentPassword);
  if (newPasswordError) {
    errors.newPassword = newPasswordError;
  }
  
  const confirmPasswordError = validateConfirmPassword(confirmPassword, newPassword);
  if (confirmPasswordError) {
    errors.confirmPassword = confirmPasswordError;
  }
  
  return errors;
}; 