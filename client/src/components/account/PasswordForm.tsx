import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePasswordForm } from "@/hooks/usePasswordForm";
import { PasswordFormFields } from "@/components/ui/password-form/PasswordFormFields";

interface PasswordFormProps {
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  validateCurrentPassword: (password: string) => Promise<boolean>;
}

export const PasswordForm = ({ onUpdatePassword, validateCurrentPassword }: PasswordFormProps) => {
  const {
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
  } = usePasswordForm({ onUpdatePassword, validateCurrentPassword });

  return (
    <>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <PasswordFormFields
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordErrors={passwordErrors}
          isPasswordUpdating={isPasswordUpdating}
          isCheckingPassword={isCheckingPassword}
          onCurrentPasswordChange={handleCurrentPasswordChange}
          onCurrentPasswordBlur={handleCurrentPasswordBlur}
          onNewPasswordChange={handleNewPasswordChange}
          onConfirmPasswordChange={handleConfirmPasswordChange}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </>
  );
}; 