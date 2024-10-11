import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  primaryKey,
  boolean,
  pgSchema,
} from "drizzle-orm/pg-core";

import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "member"]);

export const appPermissionEnum = pgEnum("app_permission", [
  "profiles.show",
  "organization.create",
  "organization.update",
  "organization.delete",
  "training.create.public",
  "training.update.public",
  "training.delete.public",
  "training.create.private",
  "training.update.private",
  "training.delete.private",
  "enrollment.manage",
  "session.manage",
]);

// Updated user_roles table
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.role] }),
  })
);

// Updated role_permissions table
export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: userRoleEnum("role").notNull(),
    permission: appPermissionEnum("permission").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.role, table.permission] }),
  })
);

export const trainings = pgTable("trainings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageURL: text("image_url").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id")
    .references(() => trainings.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id")
    .references(() => trainings.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizations = pgTable(
  "organizations",
  {
    id: serial("id").primaryKey(),
    name: text("name"), // Allow null
    domain: text("domain").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    domainIdx: uniqueIndex("domain_idx").on(table.domain),
  })
);

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => auth.users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const authSchema = pgSchema("auth");

// Reference to Supabase's auth.users table
export const auth = {
  users: authSchema.table("users", {
    id: uuid("id").primaryKey(),
    // Add other fields from auth.users if needed
  }),
};
