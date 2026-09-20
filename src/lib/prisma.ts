import { PrismaClient } from '@prisma/client';

// Ensure DATABASE_URL is set for serverless environments
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  // Enable WAL mode, busy timeout and foreign keys for SQLite concurrency & performance safety
  client.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`)
    .then(() => client.$queryRawUnsafe(`PRAGMA busy_timeout = 10000;`))
    .then(() => client.$queryRawUnsafe(`PRAGMA foreign_keys = ON;`))
    .then(() => client.$queryRawUnsafe(`PRAGMA synchronous = NORMAL;`))
    .catch((err) => {
      console.warn('Prisma SQLite PRAGMA initialization warning:', err.message);
    });

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

