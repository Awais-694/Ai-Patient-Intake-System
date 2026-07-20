import { LoaderCircle } from "lucide-react";

const sizeClasses = {
  small: "size-4",
  medium: "size-6",
  large: "size-10",
};

export default function LoadingSpinner({
  size = "medium",
  label = "Loading...",
  showLabel = false,
  fullScreen = false,
  className = "",
}) {
  const spinnerSize =
    sizeClasses[size] || sizeClasses.medium;

  const content = (
    <div
      className={`flex items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className={`${spinnerSize} animate-spin text-primary`}
        aria-hidden="true"
      />

      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {label}
        </span>
      )}

      {!showLabel && (
        <span className="sr-only">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        {content}
      </div>
    );
  }

  return content;
}