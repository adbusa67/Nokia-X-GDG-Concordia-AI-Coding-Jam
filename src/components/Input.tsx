import { InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 backdrop-blur transition-colors focus:border-amex/60 focus:outline-none focus:ring-2 focus:ring-amex/30 ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
