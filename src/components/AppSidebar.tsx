import { useState } from "react";
import { 
  Home, 
  Library, 
  Bell, 
  Plus, 
  Users, 
  Settings,
  Search,
  MoreHorizontal,
  Music,
  Clock,
  User
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Library", url: "/library", icon: Library },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-sidebar-border">
      <SidebarContent className="bg-sidebar-background">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <Music className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Lachlan Carrick</span>
          </div>

          <Button className="w-full bg-gradient-primary hover:shadow-elegant transition-all duration-300 mb-6">
            <Plus className="h-4 w-4 mr-2" />
            New project
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
                          isActive ? 'bg-sidebar-accent text-primary font-medium' : ''
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <div className="text-sm text-muted-foreground">
            <div className="font-medium mb-1">My projects</div>
            <div className="text-xs">3 active projects</div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}