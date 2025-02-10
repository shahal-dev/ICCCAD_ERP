import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Project, Task } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/projects", projects?.[0]?.id, "tasks"],
    enabled: !!projects?.[0]?.id,
  });

  const projectStats = projects?.reduce((acc, project) => {
    acc.totalBudget += project.budget;
    acc.totalProjects += 1;
    return acc;
  }, { totalBudget: 0, totalProjects: 0 });

  const taskStats = tasks?.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      
      <div className="flex-1 overflow-auto">
        <Header />
        
        <main className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatsCard
              title="Total Projects"
              value={projectStats?.totalProjects ?? 0}
              loading={loadingProjects}
            />
            <StatsCard
              title="Total Budget"
              value={`$${projectStats?.totalBudget?.toLocaleString() ?? 0}`}
              loading={loadingProjects}
            />
            <StatsCard
              title="Active Tasks"
              value={taskStats?.in_progress ?? 0}
              loading={loadingProjects}
            />
            <StatsCard
              title="Completed Tasks"
              value={taskStats?.completed ?? 0}
              loading={loadingProjects}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Budget Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {projects ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projects}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="budget" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Skeleton className="w-full h-full" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {tasks ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(taskStats || {}).map(([status, count]) => ({
                        status: status.replace("_", " ").toUpperCase(),
                        count
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Skeleton className="w-full h-full" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatsCard({ title, value, loading }: { title: string; value: string | number; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-[100px]" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
