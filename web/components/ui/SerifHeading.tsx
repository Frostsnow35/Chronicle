import React from "react";
import { twMerge } from "tailwind-merge";

type Level = 1 | 2 | 3 | 4;

interface SerifHeadingProps {
  level?: Level;
  className?: string;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

const sizeMap: Record<Level, string> = {
  1: "text-4xl md:text-5xl leading-[1.15] tracking-tight font-semibold",
  2: "text-3xl md:text-4xl leading-[1.2] tracking-tight font-semibold",
  3: "text-2xl md:text-3xl leading-[1.3] font-semibold",
  4: "text-xl md:text-2xl leading-[1.35] font-semibold"
};

export default function SerifHeading({
  level = 2,
  className,
  children,
  as
}: SerifHeadingProps) {
  const Tag: keyof JSX.IntrinsicElements =
    as ?? (`h${level}` as keyof JSX.IntrinsicElements);
  return React.createElement(
    Tag,
    {
      className: twMerge(
        "font-serif text-ink-950",
        sizeMap[level],
        className
      )
    },
    children
  );
}
