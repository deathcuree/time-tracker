import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { FormErrors, validatePasswordForm, validateNewPassword, validateConfirmPassword } from "@/utils/passwordValidation";

interface UsePasswordFormProps {
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  validateCurrentPassword: (password: string) => Promise<boolean>;
}

export const usePasswordForm = ({ onUpdatePassword, validateCurrentPassword }: UsePasswordFormProps) => {
  const { toast } = useToast();
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  const [hasValidatedCurrentPassword, setHasValidatedCurrentPassword] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      } else {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: undefined
        }));
        setHasValidatedCurrentPassword(true);
        return true;
      }
    } catch (error) {
      // If there's an error validating, we'll handle it silently and validate during form submission
      return false;
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentPassword(value);
    // Clear the current password error when user starts typing
    if (passwordErrors.currentPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: undefined
      }));
    }
    // Reset validation state when password changes
    setHasValidatedCurrentPassword(false);
  };

  const handleCurrentPasswordBlur = async () => {
    // Only validate on blur if there's a value and we haven't validated yet
    if (currentPassword && !hasValidatedCurrentPassword) {
      await validateCurrentPasswordField(currentPassword);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields first
    const errors = validatePasswordForm(currentPassword, newPassword, confirmPassword);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // If we haven't validated the current password yet, do it now
    if (!hasValidatedCurrentPassword) {
      const isValid = await validateCurrentPasswordField(currentPassword);
      if (!isValid) return;
    }

    setIsPasswordUpdating(true);
    
    try {
      await onUpdatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
      setHasValidatedCurrentPassword(false);
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
        setHasValidatedCurrentPassword(false);
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
    handleSubmit
  };
}; 