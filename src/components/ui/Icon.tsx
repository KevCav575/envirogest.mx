import { ICON_PATHS } from '@/constants/icons';

interface IconProps {
  n: string;
  s?: number;
  c?: string;
  cls?: string;
}

export function Icon({ n, s = 18, c = 'currentColor', cls = '' }: IconProps) {
  return (
    <svg
      width={s} height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[n] ?? '' }}
    />
  );
}
