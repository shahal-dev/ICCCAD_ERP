import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  FolderKanban, 
  UserCheck,
  Settings,
  LogOut,
  DollarSign,
  FileText
} from "lucide-react";
import { SiIcinga } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Attendance", href: "/attendance", icon: UserCheck },
  { name: "Budget", href: "/budget", icon: DollarSign, roles: ["admin", "project_officer"] },
  { name: "Reports", href: "/reports", icon: FileText, roles: ["admin", "project_officer"] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const filteredNavigation = navigation.filter(
    item => !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <div className="flex flex-col h-full bg-sidebar border-r">
      <div className="p-6">
        <div className="flex items-center gap-2 px-2">
          <SiIcinga size={24} className="text-sidebar-primary" />
          <span className="font-semibold text-lg text-sidebar-foreground">ICCCAD ERP</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col gap-1">
          {filteredNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-4">
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.PROJECT_OFFICER) && (
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}