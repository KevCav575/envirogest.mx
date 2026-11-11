import type { ReactNode, CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'dark';
type Size    = 'sm' | 'md' | 'lg';

interface BtnProps {
  onClick?: () => void;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-green-600 hover:bg-green-700 text-white',
  secondary: 'bg-white hover:bg-stone-50 text-ink border border-stone-300',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  ghost:     'bg-transparent hover:bg-stone-100 text-stone-600',
  outline:   'bg-transparent border border-green-600 text-green-700 hover:bg-green-50',
  dark:      'bg-ink hover:bg-black text-white',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm tracking-wide',
};

export function Btn({
  onClick, children, variant = 'primary', size = 'md',
  disabled = false, className = '', style, type = 'button',
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors cursor-pointer
        ${VARIANTS[variant]} ${SIZES[size]} ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
