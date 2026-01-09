import { PrismaClient } from '@prisma/client';

/**
 * @type {PrismaClient}
 */
let prisma;

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

if (process.env.NODE_ENV === 'production') {
  prisma = prismaClientSingleton();
} else {
  // בשימוש ב-globalThis בסביבת JS, אנחנו מגדירים את הטיפוס ב-JSDoc
  if (!globalThis.prismaGlobal) {
    globalThis.prismaGlobal = prismaClientSingleton();
  }
  prisma = globalThis.prismaGlobal;
}

/** * ייצוא ה-Client עם תיעוד כדי ש-VS Code יזהה את ה-Schema
 * @type {PrismaClient} 
 */
export default prisma;