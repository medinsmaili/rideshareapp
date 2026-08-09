import { LayoutDashboard, Users, Car, MapPin, Route, BookOpen, Flag, Languages, Settings, FileText, Bell, ShieldCheck, Pin, ScrollText } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Users", url: "/users", icon: Users },
  { title: "Rides", url: "/rides", icon: Route },
  { title: "Bookings", url: "/bookings", icon: BookOpen },
  { title: "Vehicles", url: "/vehicles", icon: Car },
  { title: "Verifications", url: "/verifications", icon: ShieldCheck },
  { title: "Reports", url: "/reports", icon: Flag },
];

const configItems = [
  { title: "Cities", url: "/cities", icon: MapPin },
  { title: "Meeting Points", url: "/meeting-points", icon: Pin },
  { title: "Languages", url: "/languages", icon: Languages },
  { title: "Translations", url: "/translations", icon: FileText },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Logs", url: "/logs", icon: ScrollText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Car className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-sidebar-primary-foreground">NISU Admin</h1>
              <p className="text-xs text-sidebar-muted">Ridesharing Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Car className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="transition-colors duration-150" activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider">Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="transition-colors duration-150" activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
