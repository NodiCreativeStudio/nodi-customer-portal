import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Rocket, FolderKanban, Upload, KeyRound,
  Layers, Contact, Download, Shield, Users, DollarSign, BarChart3, Settings,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export function AppSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const { role } = useAuth();
  const { t } = useTranslation();
  const collapsed = state === "collapsed";

  const mainItems = [
    { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("nav.onboarding"), url: "/onboarding", icon: Rocket },
    { title: t("nav.projects"), url: "/projects", icon: FolderKanban },
    { title: t("nav.uploads"), url: "/uploads", icon: Upload },
    { title: t("nav.credentials"), url: "/credentials", icon: KeyRound },
    { title: t("nav.stack"), url: "/stack", icon: Layers },
    { title: t("nav.contacts"), url: "/contacts", icon: Contact },
    { title: t("nav.downloads"), url: "/downloads", icon: Download },
  ];

  const adminItems = [
    { title: t("nav.dashboard"), url: "/admin", icon: Shield, exact: true },
    { title: t("nav.clients"), url: "/admin/clients", icon: Users },
    { title: t("nav.revenue"), url: "/admin/revenue", icon: DollarSign },
    { title: t("nav.analytics"), url: "/admin/analytics", icon: BarChart3 },
    { title: t("nav.settings"), url: "/admin/config", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] text-primary-foreground font-bold">
            N
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">NODI</span>
              <span className="text-xs text-muted-foreground">Client Portal</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <NavLink to={item.url} end className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const active = item.exact
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink to={item.url} end={item.exact} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
