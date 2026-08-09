import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { getUploadUrl } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "??";
  const avatarUrl = getUploadUrl(user?.profile_picture, "profiles");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4 shrink-0">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {user && (
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.first_name} {user.last_name}
                </span>
              )}
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  {initials}
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
