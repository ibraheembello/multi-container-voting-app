export interface WorkerConfig {
  databaseUrl: string;
  redisUrl: string;
  healthPort: number;
}

export function loadConfig(): WorkerConfig {
  const databaseUrl = process.env.DATABASE_URL;
  const redisUrl = process.env.REDIS_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  if (!redisUrl) throw new Error('REDIS_URL is required');
  return {
    databaseUrl,
    redisUrl,
    healthPort: Number(process.env.WORKER_HEALTH_PORT) || 4100,
  };
}
