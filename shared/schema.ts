import { pgTable, text, serial, integer, boolean, timestamp, json, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const UserRole = {
  ADMIN: 'admin',
  PROJECT_OFFICER: 'project_officer',
  EMPLOYEE: 'employee'
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: Object.values(UserRole) }).notNull().default(UserRole.EMPLOYEE),
  name: text("name").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status", { enum: ["planned", "active", "completed", "on_hold"] }).notNull().default("planned"),
  managerId: integer("manager_id").references(() => users.id),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  assigneeId: integer("assignee_id").references(() => users.id),
  status: text("status", { enum: ["todo", "in_progress", "completed"] }).notNull().default("todo"),
  dueDate: timestamp("due_date"),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  date: timestamp("date").notNull(),
  status: text("status", { enum: ["present", "absent", "late"] }).notNull(),
});

// New tables for enhanced ERP features
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  category: text("category", { enum: ["salary", "equipment", "travel", "supplies", "other"] }).notNull(),
  date: date("date").notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status", { enum: ["pending", "completed", "delayed"] }).notNull().default("pending"),
  completionDate: date("completion_date"),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["progress", "financial", "milestone", "other"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  attachments: json("attachments").default([]),
});

// Base schema without confirmPassword
const baseUserSchema = createInsertSchema(users);

// Login schema
export const loginSchema = baseUserSchema.pick({
  username: true,
  password: true,
});

// Registration schema with confirmPassword and role validation
export const insertUserSchema = baseUserSchema.extend({
  confirmPassword: z.string(),
  role: z.enum([UserRole.ADMIN, UserRole.PROJECT_OFFICER, UserRole.EMPLOYEE])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Export schemas for all tables
export const insertProjectSchema = createInsertSchema(projects);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertAttendanceSchema = createInsertSchema(attendance);
export const insertBudgetItemSchema = createInsertSchema(budgetItems);
export const insertMilestoneSchema = createInsertSchema(milestones);
export const insertReportSchema = createInsertSchema(reports);

// Export types for all tables
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Report = typeof reports.$inferSelect;