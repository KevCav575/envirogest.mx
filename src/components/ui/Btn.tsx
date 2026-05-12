import type { ReactNode, CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
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
  primary:   'bg-green-800 hover:bg-green-900 text-white',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  ghost:     'bg-transparent hover:bg-gray-100 text-gray-600',
  outline:   'bg-transparent border border-green-700 text-green-700 hover:bg-green-50',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
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
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-all cursor-pointer border-0 outline-none
        ${VARIANTS[variant]} ${SIZES[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
