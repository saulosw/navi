import type pg from 'pg';
import type { HealthProbe } from '../../application/ports/health-probe.ts';

export function postgresHealthProbe(pool: pg.Pool): HealthProbe {
  return {
    async check() {
      await pool.query('SELECT 1');
    },
  };
}
