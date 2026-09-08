import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean, 
  numeric,
  json,
  pgEnum
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum('role', ['ADMIN', 'OPERATOR']);
export const trxTypeEnum = pgEnum('trx_type', ['IN', 'OUT']);
export const articleStatusEnum = pgEnum('article_status', ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']);
export const donationStatusEnum = pgEnum('donation_status', ['PENDING', 'SUCCESS', 'FAILED']);
export const programStatusEnum = pgEnum('program_status', ['ACTIVE', 'INACTIVE']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').default('OPERATOR').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  description: text('description'),
  targetAmount: numeric('target_amount'),
  status: programStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const financialTransactions = pgTable('financial_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: trxTypeEnum('type').notNull(),
  amount: numeric('amount').notNull(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  programId: uuid('program_id').references(() => programs.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  donorName: text('donor_name'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
});

export const activities = pgTable('activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  date: timestamp('date').notNull(),
  location: text('location'),
  description: text('description'),
  imageUrl: text('image_url'),
  tiktokUrl: text('tiktok_url'),
  programId: uuid('program_id').references(() => programs.id),
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  imageUrl: text('image_url'),
  imageAlt: text('image_alt'),
  imageCaption: text('image_caption'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  status: articleStatusEnum('status').default('DRAFT').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
  scheduledAt: timestamp('scheduled_at'),
  archivedAt: timestamp('archived_at'),
});

export const donations = pgTable('donations', {
  id: uuid('id').defaultRandom().primaryKey(),
  donorName: text('donor_name').notNull(),
  amount: numeric('amount').notNull(),
  programId: uuid('program_id').references(() => programs.id),
  status: donationStatusEnum('status').default('PENDING').notNull(),
  paymentMethod: text('payment_method'),
  proofImage: text('proof_image'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const gallery = pgTable('gallery', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title'),
  description: text('description'),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, PUBLISH, LOGIN
  tableName: text('table_name').notNull(),
  recordId: text('record_id'),
  oldData: json('old_data'),
  newData: json('new_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').unique().notNull(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
