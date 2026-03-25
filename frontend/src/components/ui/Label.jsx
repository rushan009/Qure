import React from "react";

export const Label = ({ children, className = "", variant = "default", ...props }) => {
  // Manual variants
  let variantClass = "";
  if (variant === "default") variantClass = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
  if (variant === "secondary") variantClass = "text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
  if (variant === "highlight") variantClass = "text-sm font-semibold text-primary leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

  return (
    <label className={`${variantClass} ${className}`} {...props}>
      {children}
    </label>
  );
};