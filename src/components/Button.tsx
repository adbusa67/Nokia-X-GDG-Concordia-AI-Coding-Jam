import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-amex text-white shadow-lg shadow-amex/25 hover:bg-[#0080f0] focus:ring-amex/60",
  secondary:
    "bg-white/5 text-white border border-white/15 hover:bg-white/10 focus:ring-white/30",
  danger:
    "bg-aeroplan text-white shadow-lg shadow-aeroplan/25 hover:bg-[#ff2a3d] focus:ring-aeroplan/60",
  ghost: "bg-transparent text-gray-300 hover:bg-white/5 hover:text-white focus:ring-white/20",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-6 py-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", fullWidth, className = "", ...props },
    ref
  ) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
