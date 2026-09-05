import React from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

type Variant = "default" | "strong";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  as?: keyof JSX.IntrinsicElements;
}

export default function GlassCard({
  variant = "default",
  className,
  children,
  as: Tag = "div",
  ...rest
}: GlassCardProps) {
  const cls = twMerge(
    clsx(variant === "strong" ? "glass-card-strong" : "glass-card", className)
  );
  return (
    // @ts-expect-error dynamic tag
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
