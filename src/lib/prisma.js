import { PrismaClient } from '@prisma/client'

/**
 * @type {PrismaClient}
 * הקוד הזה דואג ש-VS Code יזהה את פריזמה וייתן לך השלמות אוטומטיות (IntelliSense)
 */
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query'], // אופציונלי: מדפיס את השאילתות לטרמינל, עוזר מאוד בפיתוח
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma;