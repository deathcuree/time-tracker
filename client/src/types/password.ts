export interface PasswordFormProps {
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  validateCurrentPassword: (password: string) => Promise<boolean>;
}

export interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface UsePasswordFormProps {
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  validateCurrentPassword: (password: string) => Promise<boolean>;
}

export interface UsePasswordFormReturn {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordErrors: FormErrors;
  isPasswordUpdating: boolean;
  isCheckingPassword: boolean;
  handleCurrentPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCurrentPasswordBlur: () => void;
  handleNewPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordUpdate: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export interface PasswordFormFieldsProps {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordErrors: FormErrors;
  isPasswordUpdating: boolean;
  isCheckingPassword: boolean;
  onCurrentPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCurrentPasswordBlur: () => void;
  onNewPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
} 