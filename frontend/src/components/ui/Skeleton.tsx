import type React from "react";

/** F6: Reusable skeleton for loading state; uses .skeleton class from states-toast-skeleton.css */
export function Skeleton({
  width,
  height = "1rem",
  className = "",
  "aria-label": ariaLabel,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  "aria-label"?: string;
}) {
  const style: React.CSSProperties = {
    width: width ?? "100%",
    height: typeof height === "number" ? `${height}px` : height,
  };
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={style}
      role="progressbar"
      aria-busy="true"
      aria-label={ariaLabel ?? "Loading"}
    />
  );
}
