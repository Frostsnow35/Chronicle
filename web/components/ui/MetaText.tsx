import React from "react";
import { twMerge } from "tailwind-merge";

interface MetaTextProps extends React.HTMLAttributes<HTMLSpanElement> {}

export default function MetaText({
  className,
  children,
  ...rest
}: MetaTextProps) {
  return (
    <span
      className={twMerge(
        "font-sans text-xs uppercase tracking-[0.18em] text-ink-500",
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
