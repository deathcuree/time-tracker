import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

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

      <div className="space-y-2 relative">
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder={passwordPlaceholder}
          required
          disabled={isSubmitting}
          className="focus:ring-2 focus:ring-primary"
        />

        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-[90%] pt-0.5 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : submitText}
      </Button>
    </form>
  );
};

export default LoginForm;