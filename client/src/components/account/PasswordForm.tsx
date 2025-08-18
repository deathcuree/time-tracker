import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface PasswordFormProps {
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  validateCurrentPassword: (password: string) => Promise<boolean>;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const PasswordForm = ({ onUpdatePassword, validateCurrentPassword }: PasswordFormProps) => {
  const { toast } = useToast();
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const validateCurrentPasswordField = async (password: string) => {
    if (!password) {
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: "Current password is required"
      }));
      return;
    }

    setIsCheckingPassword(true);
    try {
      const isValid = await validateCurrentPassword(password);
      if (!isValid) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
      } else {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: undefined
        }));
      }
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const debouncedValidateCurrentPassword = debounce(validateCurrentPasswordField, 500);

  const validateNewPassword = (password: string) => {
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

  const validateConfirmPassword = (confirmPass: string) => {
    if (!confirmPass) {
      return "Please confirm your new password";
    }
    if (confirmPass !== newPassword) {
      return "Passwords do not match";
    }
    return undefined;
  };

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
    const error = validateNewPassword(value);
    setPasswordErrors(prev => ({
      ...prev,
      newPassword: error,
      confirmPassword: confirmPassword ? validateConfirmPassword(confirmPassword) : prev.confirmPassword
    }));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    const error = validateConfirmPassword(value);
    setPasswordErrors(prev => ({
      ...prev,
      confirmPassword: error
    }));
  };

  const validatePasswordForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    
    const newPasswordError = validateNewPassword(newPassword);
    if (newPasswordError) {
      errors.newPassword = newPasswordError;
    }
    
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    if (confirmPasswordError) {
      errors.confirmPassword = confirmPasswordError;
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsPasswordUpdating(true);
    
    try {
      await onUpdatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
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

  return (
    <>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={handleCurrentPasswordChange}
              onBlur={handleCurrentPasswordBlur}
              disabled={isPasswordUpdating}
              aria-invalid={!!passwordErrors.currentPassword}
              rightAdornment={
                isCheckingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : undefined
              }
            />
            {passwordErrors.currentPassword && (
              <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={handleNewPasswordChange}
              disabled={isPasswordUpdating}
              aria-invalid={!!passwordErrors.newPassword}
            />
            {passwordErrors.newPassword && (
              <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={isPasswordUpdating}
              aria-invalid={!!passwordErrors.confirmPassword}
            />
            {passwordErrors.confirmPassword && (
              <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
            )}
          </div>
          <Button type="submit" disabled={isPasswordUpdating}>
            {isPasswordUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </CardContent>
    </>
  );
}; 