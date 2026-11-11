interface BadgeProps {
  label: string;
  color: string;
  bg: string;
}

/** Etiqueta de estado: rectángulo suave, como en la tabla de los mockups. */
export function Badge({ label, color, bg }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-md text-[13px] leading-none whitespace-nowrap"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}
