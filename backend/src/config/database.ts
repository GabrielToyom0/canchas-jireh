import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient, type Prisma } from '../generated/prisma/client.js';
import { env } from './env.js';

/** Único cliente de base de datos de toda la aplicación. */
export const prisma = new PrismaClient({ adapter: new PrismaMssql(env.DATABASE_URL) });

/**
 * Cliente normal o transacción abierta. Los repositorios lo reciben como último parámetro
 * para que un servicio pueda agrupar varias operaciones en una sola transacción.
 */
export type Db = PrismaClient | Prisma.TransactionClient;
