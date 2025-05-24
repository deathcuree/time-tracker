import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordFormProps } from "@/types/password";
import { PasswordFormFields } from "./PasswordFormFields";
import { usePasswordForm } from "@/hooks/usePasswordForm";

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
    handlePasswordUpdate,
  } = usePasswordForm({
    onUpdatePassword,
    validateCurrentPassword,
  });

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
          onSubmit={handlePasswordUpdate}
        />
      </CardContent>
    </>
  );
}; 