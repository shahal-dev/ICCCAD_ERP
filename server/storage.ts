import { users, projects, tasks, attendance, budgetItems, milestones, reports } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import { User, Project, Task, Attendance, BudgetItem, Milestone, Report, InsertUser, UserRole } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>; // Added getUsers method

  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: Omit<Project, "id">): Promise<Project>;

  // Task operations
  getTasks(projectId: number): Promise<Task[]>;
  createTask(task: Omit<Task, "id">): Promise<Task>;
  updateTaskStatus(id: number, status: Task["status"]): Promise<Task>;

  // Attendance operations
  markAttendance(attendance: Omit<Attendance, "id">): Promise<Attendance>;
  getAttendance(userId: number, date: Date): Promise<Attendance | undefined>;

  // Budget operations
  createBudgetItem(item: Omit<BudgetItem, "id">): Promise<BudgetItem>;
  getBudgetItems(projectId: number, startDate?: Date, endDate?: Date): Promise<BudgetItem[]>;
  getProjectBudgetSummary(projectId: number): Promise<{ allocated: number; spent: number }>;

  // Milestone operations
  createMilestone(milestone: Omit<Milestone, "id">): Promise<Milestone>;
  getMilestones(projectId: number): Promise<Milestone[]>;
  updateMilestoneStatus(id: number, status: Milestone["status"], completionDate?: Date): Promise<Milestone>;

  // Report operations
  createReport(report: Omit<Report, "id">): Promise<Report>;
  getReports(projectId: number): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      role: insertUser.role || UserRole.EMPLOYEE
    }).returning();
    return user;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: Omit<Project, "id">): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getTasks(projectId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async createTask(task: Omit<Task, "id">): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTaskStatus(id: number, status: Task["status"]): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ status })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async markAttendance(newAttendance: Omit<Attendance, "id">): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(newAttendance).returning();
    return record;
  }

  async getAttendance(userId: number, date: Date): Promise<Attendance | undefined> {
    const [record] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId));
    return record;
  }

  async createBudgetItem(item: Omit<BudgetItem, "id">): Promise<BudgetItem> {
    const [budgetItem] = await db.insert(budgetItems).values(item).returning();
    return budgetItem;
  }

  async getBudgetItems(projectId: number, startDate?: Date, endDate?: Date): Promise<BudgetItem[]> {
    let query = db.select().from(budgetItems).where(eq(budgetItems.projectId, projectId));

    if (startDate && endDate) {
      query = query.where(and(
        gte(budgetItems.date, startDate),
        lte(budgetItems.date, endDate)
      ));
    }

    return await query;
  }

  async getProjectBudgetSummary(projectId: number): Promise<{ allocated: number; spent: number }> {
    const items = await this.getBudgetItems(projectId);

    return items.reduce(
      (acc, item) => {
        if (item.type === "income") {
          acc.allocated += Number(item.amount);
        } else {
          acc.spent += Number(item.amount);
        }
        return acc;
      },
      { allocated: 0, spent: 0 }
    );
  }

  async createMilestone(milestone: Omit<Milestone, "id">): Promise<Milestone> {
    const [newMilestone] = await db.insert(milestones).values(milestone).returning();
    return newMilestone;
  }

  async getMilestones(projectId: number): Promise<Milestone[]> {
    return await db.select().from(milestones).where(eq(milestones.projectId, projectId));
  }

  async updateMilestoneStatus(id: number, status: Milestone["status"], completionDate?: Date): Promise<Milestone> {
    const [updatedMilestone] = await db
      .update(milestones)
      .set({ status, completionDate })
      .where(eq(milestones.id, id))
      .returning();
    return updatedMilestone;
  }

  async createReport(report: Omit<Report, "id">): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(projectId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.projectId, projectId));
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getUsers(): Promise<User[]> { // Added getUsers method implementation
    return await db.select().from(users);
  }
}

export const storage = new DatabaseStorage();