import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

function requireAuth(req: Express.Request, res: Express.Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireRole(roles: string[]) {
  return (req: Express.Request, res: Express.Response, next: Function) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Projects
  app.get("/api/projects", requireAuth, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.post("/api/projects", requireAuth, requireRole(["admin", "project_officer"]), async (req, res) => {
    const project = await storage.createProject(req.body);
    res.status(201).json(project);
  });

  // Tasks
  app.get("/api/projects/:projectId/tasks", requireAuth, async (req, res) => {
    const tasks = await storage.getTasks(parseInt(req.params.projectId));
    res.json(tasks);
  });

  app.post("/api/projects/:projectId/tasks", requireAuth, requireRole(["admin", "project_officer"]), async (req, res) => {
    const task = await storage.createTask({
      ...req.body,
      projectId: parseInt(req.params.projectId)
    });
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:taskId/status", requireAuth, async (req, res) => {
    const task = await storage.updateTaskStatus(parseInt(req.params.taskId), req.body.status);
    res.json(task);
  });

  // Attendance
  app.post("/api/attendance", requireAuth, async (req, res) => {
    const attendance = await storage.markAttendance({
      userId: req.user!.id,
      date: new Date(),
      status: req.body.status
    });
    res.status(201).json(attendance);
  });

  app.get("/api/attendance", requireAuth, async (req, res) => {
    const attendance = await storage.getAttendance(req.user!.id, new Date());
    res.json(attendance);
  });

  // Budget Items
  app.get("/api/projects/:projectId/budget", requireAuth, async (req, res) => {
    const { startDate, endDate } = req.query;
    const budgetItems = await storage.getBudgetItems(
      parseInt(req.params.projectId),
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json(budgetItems);
  });

  app.post("/api/projects/:projectId/budget", requireAuth, requireRole(["admin", "project_officer"]), async (req, res) => {
    const budgetItem = await storage.createBudgetItem({
      ...req.body,
      projectId: parseInt(req.params.projectId),
      createdBy: req.user!.id
    });
    res.status(201).json(budgetItem);
  });

  app.get("/api/projects/:projectId/budget/summary", requireAuth, async (req, res) => {
    const summary = await storage.getProjectBudgetSummary(parseInt(req.params.projectId));
    res.json(summary);
  });

  // Milestones
  app.get("/api/projects/:projectId/milestones", requireAuth, async (req, res) => {
    const milestones = await storage.getMilestones(parseInt(req.params.projectId));
    res.json(milestones);
  });

  app.post("/api/projects/:projectId/milestones", requireAuth, requireRole(["admin", "project_officer"]), async (req, res) => {
    const milestone = await storage.createMilestone({
      ...req.body,
      projectId: parseInt(req.params.projectId)
    });
    res.status(201).json(milestone);
  });

  app.patch("/api/milestones/:id/status", requireAuth, requireRole(["admin", "project_officer"]), async (req, res) => {
    const milestone = await storage.updateMilestoneStatus(
      parseInt(req.params.id),
      req.body.status,
      req.body.completionDate ? new Date(req.body.completionDate) : undefined
    );
    res.json(milestone);
  });

  // Reports
  app.get("/api/projects/:projectId/reports", requireAuth, async (req, res) => {
    const reports = await storage.getReports(parseInt(req.params.projectId));
    res.json(reports);
  });

  app.post("/api/projects/:projectId/reports", requireAuth, requireRole(["admin", "project_officer"]), async (req, res) => {
    const report = await storage.createReport({
      ...req.body,
      projectId: parseInt(req.params.projectId),
      createdBy: req.user!.id
    });
    res.status(201).json(report);
  });

  app.get("/api/reports/:id", requireAuth, async (req, res) => {
    const report = await storage.getReport(parseInt(req.params.id));
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  });

  // Add this route after the existing routes
  app.get("/api/users", requireAuth, async (req, res) => {
    const users = await storage.getUsers();
    // Don't send password in the response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  });

  const httpServer = createServer(app);
  return httpServer;
}