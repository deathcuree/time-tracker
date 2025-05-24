import { useState } from "react";
import { FormErrors, UsePasswordFormProps, UsePasswordFormReturn } from "@/types/password";
import { validateNewPassword, validateConfirmPassword, debounce } from "@/utils/passwordValidation";
import { useToast } from "@/components/ui/use-toast";

export const usePasswordForm = ({
  onUpdatePassword,
  validateCurrentPassword,
}: UsePasswordFormProps): UsePasswordFormReturn => {
  const { toast } = useToast();
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
  };

  const validateCurrentPasswordField = async (password: string) => {
    if (!password) {
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: "Current password is required"
      }));
      return false;
    }

    setIsCheckingPassword(true);
    try {
      const isValid = await validateCurrentPassword(password);
      if (!isValid) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
        return false;
      }
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: undefined
      }));
      return true;
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const debouncedValidateCurrentPassword = debounce(validateCurrentPasswordField, 500);

  const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentPassword(value);
    if (value) {
      debouncedValidateCurrentPassword(value);
    } else {
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: "Current password is required"
      }));
    }
  };

  const handleCurrentPasswordBlur = () => {
    if (currentPassword) {
      validateCurrentPasswordField(currentPassword);
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    const error = validateNewPassword(value, currentPassword);
    setPasswordErrors(prev => ({
      ...prev,
      newPassword: error,
      confirmPassword: confirmPassword ? validateConfirmPassword(confirmPassword, value) : prev.confirmPassword
    }));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    const error = validateConfirmPassword(value, newPassword);
    setPasswordErrors(prev => ({
      ...prev,
      confirmPassword: error
    }));
  };

  const validatePasswordForm = async (): Promise<boolean> => {
    const errors: FormErrors = {};
    
    const isCurrentPasswordValid = await validateCurrentPasswordField(currentPassword);
    if (!isCurrentPasswordValid) {
      return false;
    }
    
    const newPasswordError = validateNewPassword(newPassword, currentPassword);
    if (newPasswordError) {
      errors.newPassword = newPasswordError;
    }
    
    const confirmPasswordError = validateConfirmPassword(confirmPassword, newPassword);
    if (confirmPasswordError) {
      errors.confirmPassword = confirmPasswordError;
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isPasswordUpdating) return;
    
    const isValid = await validatePasswordForm();
    if (!isValid) return;

    setIsPasswordUpdating(true);
    
    try {
      await onUpdatePassword(currentPassword, newPassword);
      resetForm();
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error: any) {
      const serverMessage = error.response?.data?.message;
      if (serverMessage === 'Current password is incorrect') {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
      } else {
        const serverErrors = error.response?.data?.errors;
        if (serverErrors) {
          setPasswordErrors(serverErrors);
        }
      }
      toast({
        title: "Error",
        description: serverMessage || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  return {
    currentPassword,
    newPassword,
    confirmPassword,
    passwordErrors,
    isPasswordUpdating,
    isCheckingPassword,
    handleCurrentPasswordChange,
    handleCurrentPasswordBlur,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    handlePasswordUpdate,
    resetForm,
  };
}; 