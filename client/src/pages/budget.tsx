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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetItemSchema, BudgetItem, Project, UserRole } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export default function BudgetPage() {
  const { user } = useAuth();
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const canManageBudget = user?.role === UserRole.ADMIN || user?.role === UserRole.PROJECT_OFFICER;

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
              <h2 className="text-2xl font-bold">Budget Management</h2>
            </div>

            <div className="grid gap-6">
              {projects?.map((project) => (
                <ProjectBudgetCard key={project.id} project={project} canManage={canManageBudget} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProjectBudgetCard({ project, canManage }: { project: Project; canManage: boolean }) {
  const { data: budgetItems } = useQuery<BudgetItem[]>({
    queryKey: ["/api/projects", project.id, "budget"],
  });

  const { data: summary } = useQuery<{ allocated: number; spent: number }>({
    queryKey: ["/api/projects", project.id, "budget/summary"],
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{project.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Total Budget: ${project.budget.toLocaleString()}</p>
        </div>
        {canManage && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Budget Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Budget Item</DialogTitle>
              </DialogHeader>
              <NewBudgetItemForm projectId={project.id} />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${project.budget.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Allocated</CardTitle>
              </CardHeader>
              <CardContent>
                {/* <div className="text-2xl font-bold">${summary?.allocated.toLocaleString() ?? 0}</div> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Spent</CardTitle>
              </CardHeader>
              <CardContent>
                {/* <div className="text-2xl font-bold">${summary?.spent.toLocaleString() ?? 0}</div> */}
              </CardContent>
            </Card>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Recent Transactions</h4>
            <div className="space-y-4">
              {budgetItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    
                    {/* <p className="text-sm text-muted-foreground">
                    console.log(item.date);  // Log the date value

                      {format(new Date(item.date), "MMMM d, yyyy")}
                    </p> */}
                  </div>
                  {/* <div className={item.type === "income" ? "text-green-600" : "text-red-600"}>
                    {item.type === "income" ? "+" : "-"}${item.amount.toLocaleString()}
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewBudgetItemForm({ projectId }: { projectId: number }) {
  const form = useForm({
    resolver: zodResolver(insertBudgetItemSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: "expense" as const,
      category: "other" as const,
      date: new Date().toISOString().split("T")[0],
      projectId,
    },
  });

  const createBudgetItem = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/budget`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "budget/summary"] });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createBudgetItem.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
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
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={createBudgetItem.isPending}>
          Add Budget Item
        </Button>
      </form>
    </Form>
  );
}
