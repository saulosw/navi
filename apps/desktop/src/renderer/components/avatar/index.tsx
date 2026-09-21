import * as styles from './styles.css';

export function Avatar({ name }: Readonly<{ name: string }>) {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()}
    </span>
  );
}
