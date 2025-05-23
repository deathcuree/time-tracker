import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  initialFirstName: string;
  initialLastName: string;
  onUpdateProfile: (data: { firstName: string; lastName: string }) => Promise<void>;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
}

export const ProfileForm = ({ initialFirstName, initialLastName, onUpdateProfile }: ProfileFormProps) => {
  const { toast } = useToast();
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [profileErrors, setProfileErrors] = useState<FormErrors>({});
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsProfileUpdating(true);
    
    try {
      await onUpdateProfile({ firstName, lastName });
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

  return (
    <>
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
    </>
  );
}; 