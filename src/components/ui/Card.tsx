import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ children, className = '', style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-white rounded-2xl border border-stone-200 ${className}`}
    >
      {children}
    </div>
  );
}
