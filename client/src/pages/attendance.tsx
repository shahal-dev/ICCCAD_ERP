import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Attendance } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());

  const { data: attendance, isLoading } = useQuery<Attendance>({
    queryKey: ["/api/attendance"],
  });

  const markAttendance = useMutation({
    mutationFn: async (status: Attendance["status"]) => {
      const res = await apiRequest("POST", "/api/attendance", { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Attendance Marked",
        description: "Your attendance has been recorded successfully.",
      });
    },
  });

  const hasMarkedAttendance = attendance !== undefined;
  const currentTime = new Date().getHours();
  const isLate = currentTime >= 10; // Consider late after 10 AM

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1">
          <Header />
          <div className="flex items-center justify-center h-[calc(100vh-65px)]">
            <Clock className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <Header />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg mb-2">
                      Today: {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {hasMarkedAttendance
                        ? `Marked as ${attendance.status.toUpperCase()}`
                        : "You haven't marked your attendance yet"}
                    </p>
                  </div>
                  {!hasMarkedAttendance && (
                    <div className="space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => markAttendance.mutate("present")}
                        disabled={markAttendance.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Present
                      </Button>
                      {isLate && (
                        <Button
                          variant="outline"
                          onClick={() => markAttendance.mutate("late")}
                          disabled={markAttendance.isPending}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Mark Late
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => markAttendance.mutate("absent")}
                        disabled={markAttendance.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Mark Absent
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        <span>Present</span>
                      </div>
                      <span className="font-bold">15 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                        <span>Late</span>
                      </div>
                      <span className="font-bold">3 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        <span>Absent</span>
                      </div>
                      <span className="font-bold">2 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}