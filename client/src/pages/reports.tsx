import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema, Report, Project, UserRole } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";

export default function ReportsPage() {
  const { user } = useAuth();
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const canCreateReports = user?.role === UserRole.ADMIN || user?.role === UserRole.PROJECT_OFFICER;

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <Header />
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Project Reports</h2>
              {canCreateReports && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Report</DialogTitle>
                    </DialogHeader>
                    <NewReportForm projects={projects || []} />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="grid gap-6">
              {projects?.map((project) => (
                <ProjectReports key={project.id} project={project} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProjectReports({ project }: { project: Project }) {
  const { data: reports } = useQuery<Report[]>({
    queryKey: ["/api/projects", project.id, "reports"],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports?.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{report.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {report.content.slice(0, 100)}...
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {report.type.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(report.createdAt), "PP")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NewReportForm({ projects }: { projects: Project[] }) {
  const form = useForm({
    resolver: zodResolver(insertReportSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "progress" as const,
      projectId: projects[0]?.id,
    },
  });

  const createReport = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "POST",
        `/api/projects/${data.projectId}/reports`,
        data
      );
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", variables.projectId, "reports"],
      });
      form.reset();
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createReport.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[200px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="progress">Progress Report</SelectItem>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="milestone">Milestone Report</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={createReport.isPending}
        >
          Create Report
        </Button>
      </form>
    </Form>
  );
}
