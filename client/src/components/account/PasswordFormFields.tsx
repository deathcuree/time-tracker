import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PasswordFormFieldsProps } from "@/types/password";

export const PasswordFormFields = ({
  currentPassword,
  newPassword,
  confirmPassword,
  passwordErrors,
  isPasswordUpdating,
  isCheckingPassword,
  onCurrentPasswordChange,
  onCurrentPasswordBlur,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit
}: PasswordFormFieldsProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={onCurrentPasswordChange}
            onBlur={onCurrentPasswordBlur}
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
          onChange={onNewPasswordChange}
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
          onChange={onConfirmPasswordChange}
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
  );
}; 