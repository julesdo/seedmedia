"use client";

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserProfileCard } from "@/components/layout/UserProfileCard";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

const adminNavSections = [
  {
    title: "Administration",
    items: [
      {
        title: "Utilisateurs",
        href: "/admin/users",
        icon: "user-bold",
      },
      {
        title: "Articles",
        href: "/admin/articles",
        icon: "document-bold",
      },
      {
        title: "Missions",
        href: "/admin/missions",
        icon: "target-bold",
      },
    ] as NavItem[],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const user = useQuery(api.auth.getCurrentUser);
  const accounts = useQuery(api.accounts.getUserAccounts);

  return (
    <Sidebar className="w-[18rem] border-r border-sidebar-border/50 backdrop-blur-[18px]">
      <SidebarHeader className="px-[18px] h-16 flex border-b border-sidebar-border/50">
        <Link href="/admin/users" className="flex items-center gap-2 group">
          <Image
            src="/logo.svg"
            alt="Seed Admin"
            width={91}
            height={37}
            className="h-10 w-auto transition-opacity group-hover:opacity-90"
          />
          <span className="text-xs font-medium text-muted-foreground">Admin</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-[18px] pt-6">
        {adminNavSections.map((section, sectionIndex) => (
          <SidebarGroup key={sectionIndex} className="space-y-3">
            {section.title && (
              <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-[0.03em] opacity-50">
                <span className="text-gradient-light">{section.title}</span>
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3 w-full">
                          <SolarIcon
                            icon={item.icon as any}
                            className={cn(
                              "h-4 w-4 flex-shrink-0 transition-transform",
                              isActive
                                ? "icon-gradient-active"
                                : "icon-gradient-light"
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm font-medium transition-all flex-1",
                              isActive
                                ? "text-gradient-active"
                                : "text-gradient-light"
                            )}
                          >
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-[18px] pb-6 pt-4 border-t border-sidebar-border/50">
        <UserProfileCard user={user} accounts={accounts} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

