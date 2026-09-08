const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const db = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

async function main() {
  await db.user.upsert({
    where: { phone: '09121145687' },
    update: {
      role: 'ADMIN',
      name: 'مدیر سیستم',
      email: 'admin@liceno.ir',
    },
    create: {
      phone: '09121145687',
      role: 'ADMIN',
      name: 'مدیر سیستم',
      email: 'admin@liceno.ir',
      password: hashPassword('admin123456') // Temporary password
    }
  });
  console.log('Admin user 09121145687 configured.');
}
main().catch(console.error).finally(() => db.$disconnect());
