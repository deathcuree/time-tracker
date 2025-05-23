import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileForm } from "@/components/account/ProfileForm";
import { PasswordForm } from "@/components/account/PasswordForm";

const AccountPage = () => {
  const { user, updateProfile, updatePassword, validateCurrentPassword } = useAuth();
  
  return (
    <div className="flex min-h-full flex-col justify-start items-center py-6 space-y-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        <Card>
          <ProfileForm
            initialFirstName={user?.name?.split(' ')[0] || ""}
            initialLastName={user?.name?.split(' ').slice(1).join(' ') || ""}
            onUpdateProfile={updateProfile}
          />
        </Card>

        <Card className="mt-6">
          <PasswordForm
            onUpdatePassword={updatePassword}
            validateCurrentPassword={validateCurrentPassword}
          />
        </Card>
      </div>
    </div>
  );
};

export default AccountPage; 