import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';

type LoginFormProps = {
  onSubmit: (email: string, password: string) => Promise<void> | void;
  isSubmitting?: boolean;
  className?: string;
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  submitText?: string;
};

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isSubmitting = false,
  className = '',
  emailPlaceholder = 'Email',
  passwordPlaceholder = 'Password',
  submitText = 'Sign in',
}) => {

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string) ?? '';
    const password = (formData.get('password') as string) ?? '';
    await onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={emailPlaceholder}
          required
          disabled={isSubmitting}
          className="focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <PasswordInput
          id="password"
          name="password"
          placeholder={passwordPlaceholder}
          required
          disabled={isSubmitting}
          className="focus:ring-2 focus:ring-primary"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : submitText}
      </Button>
    </form>
  );
};

export default LoginForm;