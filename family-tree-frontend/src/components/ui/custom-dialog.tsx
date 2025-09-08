"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface CustomDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomDialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomDialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface CustomDialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={handleBackdropClick}
      />

      {/* Dialog Content */}
      <div className="relative z-10 animate-in zoom-in-95 fade-in-0 duration-200 w-full max-w-xl">
        {children}
      </div>
    </div>
  );
};

const CustomDialogContent: React.FC<CustomDialogContentProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "relative bg-background border rounded-lg shadow-lg max-h-[90vh] overflow-y-auto w-full p-6",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

const CustomDialogHeader: React.FC<CustomDialogHeaderProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left pb-4",
        className
      )}
    >
      {children}
    </div>
  );
};

const CustomDialogTitle: React.FC<CustomDialogTitleProps> = ({
  className,
  children,
}) => {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </h2>
  );
};

const CustomDialogDescription: React.FC<CustomDialogDescriptionProps> = ({
  className,
  children,
}) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
};

const CustomDialogFooter: React.FC<CustomDialogFooterProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4",
        className
      )}
    >
      {children}
    </div>
  );
};

const CustomDialogClose: React.FC<{
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}> = ({ className, children, onClick }) => {
  return (
    <button
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
        className
      )}
      onClick={onClick}
    >
      {children || <X className="h-4 w-4" />}
    </button>
  );
};

export {
  CustomDialog,
  CustomDialogContent,
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogDescription,
  CustomDialogFooter,
  CustomDialogClose,
};
