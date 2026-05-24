import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const variants = {
    primary: 'bg-[#0F6CBD] text-white hover:bg-[#0D5AAD]',
    secondary: 'bg-[#14B8A6] text-white hover:bg-[#0F9B8E]',
    outline: 'border-2 border-[#0F6CBD] text-[#0F6CBD] hover:bg-[#0F6CBD]/10',
    ghost: 'text-[#0F6CBD] hover:bg-[#0F6CBD]/10',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 sm:px-6 py-2.5',
    lg: 'px-5 sm:px-8 py-3.5 text-base sm:text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
