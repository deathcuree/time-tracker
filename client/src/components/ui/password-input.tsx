import * as React from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.ComponentProps<"input"> & {
  rightAdornment?: React.ReactNode;
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, rightAdornment, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    const inputType = show ? "text" : "password";
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={inputType}
          className={cn("pr-10", className)}
          {...props}
        />
        {rightAdornment ? (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            {rightAdornment}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };