export const validateNewPassword = (password: string, currentPassword: string): string | undefined => {
  if (!password) {
    return "New password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters long";
  }
  if (password === currentPassword) {
    return "New password must be different from current password";
  }
  return undefined;
};

export const validateConfirmPassword = (confirmPass: string, newPassword: string): string | undefined => {
  if (!confirmPass) {
    return "Please confirm your new password";
  }
  if (confirmPass !== newPassword) {
    return "Passwords do not match";
  }
  return undefined;
};

export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 