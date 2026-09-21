import type { ButtonHTMLAttributes } from 'react';
import * as styles from './styles.css';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles.variant }) {
  return (
    <button
      type="button"
      className={`${styles.base} ${styles.variant[variant]} ${className}`}
      {...props}
    />
  );
}
