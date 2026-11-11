import { ICON_PATHS } from '@/constants/icons';

interface IconProps {
  n: string;
  s?: number;
  c?: string;
  cls?: string;
  /** Grosor del trazo. */
  w?: number;
}

export function Icon({ n, s = 18, c = 'currentColor', cls = '', w = 1.75 }: IconProps) {
  return (
    <svg
      width={s} height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[n] ?? '' }}
    />
  );
}
