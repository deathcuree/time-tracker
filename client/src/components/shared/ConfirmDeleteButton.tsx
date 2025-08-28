import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";

export type ConfirmDeleteButtonProps = {
  onConfirm: () => void;
  disabled?: boolean;
  disabledTooltip?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  ariaLabel?: string;
  title?: string;
  size?: "icon" | "sm" | "default" | "lg";
  variant?:
    | "destructive"
    | "outline"
    | "default"
    | "secondary"
    | "ghost"
    | "link";
  icon?: React.ReactNode;
  tooltip?: string;
  className?: string;
};

export const ConfirmDeleteButton: React.FC<ConfirmDeleteButtonProps> = ({
  onConfirm,
  disabled = false,
  disabledTooltip = "Action is disabled",
  confirmTitle = "Delete item?",
  confirmDescription = "This action cannot be undone. This will permanently delete the selected item.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  ariaLabel = "Delete",
  title,
  size = "icon",
  variant = "destructive",
  icon,
  tooltip,
  className,
}) => {
  const resolvedTooltip = disabled
    ? disabledTooltip
    : tooltip ?? title ?? ariaLabel ?? "Delete";

  return (
    <AlertDialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant={variant}
                size={size}
                disabled={disabled}
                aria-label={ariaLabel}
                title={title ?? ariaLabel}
                className={className}
              >
                {icon ?? <Trash2 />}
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{resolvedTooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDeleteButton;
