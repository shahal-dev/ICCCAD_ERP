import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@shared/schema";

const roleColors = {
  [UserRole.ADMIN]: "bg-red-100 text-red-800",
  [UserRole.PROJECT_OFFICER]: "bg-blue-100 text-blue-800",
  [UserRole.EMPLOYEE]: "bg-green-100 text-green-800",
};

export default function Header() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Welcome, {user.name}</h1>
        
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className={roleColors[user.role]}>
            {user.role.replace("_", " ").toUpperCase()}
          </Badge>
          
          <Avatar>
            <AvatarFallback>
              {user.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
