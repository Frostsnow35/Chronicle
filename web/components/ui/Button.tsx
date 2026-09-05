import React from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

type Variant = "ghost" | "default" | "primary" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  as?: keyof JSX.IntrinsicElements;
  href?: string;
}

export default function Button({
  variant = "default",
  size = "md",
  className,
  as: Tag,
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const sizes: Record<Size, string> = {
    sm: "text-xs px-3.5 py-1.5",
    md: "text-sm px-5 py-2",
    lg: "text-base px-7 py-3"
  };
  const variants: Record<Variant, string> = {
    ghost:
      "text-ink-700 hover:bg-white/70 border border-white/40 backdrop-blur-md",
    default: "glass-button text-ink-900",
    primary: "glass-button-primary",
    accent: "glass-button-accent",
    danger:
      "glass-button text-white border-red-500/30 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-glass"
  };

  const cls = twMerge(clsx(base, sizes[size], variants[variant], className));

  if (Tag) {
    return (
      // @ts-expect-error dynamic tag
      <Tag className={cls} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
