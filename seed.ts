import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

async function seed() {
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || randomBytes(8).toString('hex');
  const passwordHash = await hash(adminPassword, 10);
  
  console.log(`\n======================================================`);
  console.log(`🔒 ADMIN PASSWORD (SAVE THIS): ${adminPassword}`);
  console.log(`======================================================\n`);
  
  await db.insert(users).values({
    name: 'Admin Yayasan',
    email: 'admin@ruangsejahtera.org',
    passwordHash,
    role: 'ADMIN',
  }).onConflictDoNothing();

  console.log('Seeding completed.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
