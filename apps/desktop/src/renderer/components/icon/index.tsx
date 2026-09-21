import * as styles from './styles.css';

const paths = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  direct:
    'M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5ZM7 10h9M7 14h6',
  group:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  plus: 'M12 5v14M5 12h14',
  hash: 'M4 9h16M3 15h16M10 3 8 21M16 3l-2 18',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  send: 'm22 2-7 20-4-9L2 9Zm0 0L11 13',
  chevron: 'm8 5 7 7-7 7',
  close: 'm6 6 12 12M6 18 18 6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  logout: 'M9 21H4V3h5m7 4 5 5-5 5M8 12h13',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  eyeOff:
    'M2 12s3-7 10-7c1.5 0 2.9.3 4.1.9M22 12s-3 7-10 7c-1.5 0-2.9-.3-4.1-.9M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18',
  lock: 'M5 10h14v11H5Zm3 0V7a4 4 0 0 1 8 0v3',
  menu: 'M4 6h16M4 12h16M4 18h16',
  refresh: 'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M5 16a8 8 0 0 0 13 2',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = '' }: Readonly<{ name: IconName; className?: string }>) {
  return (
    <svg
      className={`${styles.icon} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
