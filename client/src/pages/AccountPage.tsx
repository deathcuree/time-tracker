import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const AccountPage = () => {
  const { user, updateProfile, updatePassword, validateCurrentPassword } = useAuth();
  const { toast } = useToast();
  
  // Separate loading states for each form
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  
  // Form errors
  const [profileErrors, setProfileErrors] = useState<FormErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  
  // Profile form state
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || "");
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Add debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Validate current password against the backend
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

  // Debounced version of validateCurrentPassword
  const debouncedValidateCurrentPassword = debounce(validateCurrentPasswordField, 500);

  // Real-time validation for new password
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

  // Real-time validation for confirm password
  const validateConfirmPassword = (confirmPass: string) => {
    if (!confirmPass) {
      return "Please confirm your new password";
    }
    if (confirmPass !== newPassword) {
      return "Passwords do not match";
    }
    return undefined;
  };

  // Update password field handlers with real-time validation
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

  // Add onBlur handler for immediate validation
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsProfileUpdating(true);
    
    try {
      await updateProfile({ firstName, lastName });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setProfileErrors({});
    } catch (error: any) {
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        setProfileErrors(serverErrors);
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsPasswordUpdating(true);
    
    try {
      await updatePassword(currentPassword, newPassword);
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

  const validateProfileForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }
    
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="flex min-h-full flex-col justify-start items-center py-6 space-y-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (profileErrors.firstName) {
                        setProfileErrors(prev => ({ ...prev, firstName: undefined }));
                      }
                    }}
                    placeholder="First name"
                    disabled={isProfileUpdating}
                    aria-invalid={!!profileErrors.firstName}
                  />
                  {profileErrors.firstName && (
                    <p className="text-sm text-destructive">{profileErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (profileErrors.lastName) {
                        setProfileErrors(prev => ({ ...prev, lastName: undefined }));
                      }
                    }}
                    placeholder="Last name"
                    disabled={isProfileUpdating}
                    aria-invalid={!!profileErrors.lastName}
                  />
                  {profileErrors.lastName && (
                    <p className="text-sm text-destructive">{profileErrors.lastName}</p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={isProfileUpdating}>
                {isProfileUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={handleCurrentPasswordChange}
                    onBlur={handleCurrentPasswordBlur}
                    disabled={isPasswordUpdating}
                    aria-invalid={!!passwordErrors.currentPassword}
                  />
                  {isCheckingPassword && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
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
                <Input
                  id="confirmPassword"
                  type="password"
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
        </Card>
      </div>
    </div>
  );
};

export default AccountPage; 