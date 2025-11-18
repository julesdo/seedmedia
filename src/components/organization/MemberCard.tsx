"use client";

import { Link } from "next-view-transitions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface MemberCardProps {
  member: {
    _id: Id<"organizationMembers">;
    userId: Id<"users">;
    role: "owner" | "admin" | "member";
    joinedAt: number;
    user: {
      _id: Id<"users">;
      email: string;
      name?: string | null;
      image?: string | null;
    } | null;
  };
}

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

const roleIcons: Record<string, string> = {
  owner: "crown-bold",
  admin: "shield-check-bold",
  member: "user-bold",
};

const roleColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  owner: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/30",
    icon: "text-primary",
  },
  admin: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/30",
    icon: "text-blue-500",
  },
  member: {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    border: "border-border/30",
    icon: "text-muted-foreground",
  },
};

export function MemberCard({ member }: MemberCardProps) {
  const roleColor = roleColors[member.role] || roleColors.member;
  const displayName = member.user?.name || member.user?.email || "Utilisateur";
  const initials = member.user?.name?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Link href={`/profile/${member.userId}`}>
      <Card className="group relative overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/2 group-hover:to-primary/0 transition-all duration-500 pointer-events-none" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            {/* Avatar avec effet au survol */}
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-105">
                <AvatarImage
                  src={member.user?.image || undefined}
                  alt={displayName}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              {/* Badge de rôle sur l'avatar */}
              <div className={cn(
                "absolute -bottom-1 -right-1 rounded-full p-1.5 border-2 border-background",
                roleColor.bg,
                roleColor.border
              )}>
                <SolarIcon 
                  icon={roleIcons[member.role] || "user-bold"} 
                  className={cn("h-3 w-3", roleColor.icon)}
                />
              </div>
            </div>

            {/* Informations du membre */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Nom et badge de rôle */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gradient-light group-hover:text-primary transition-colors line-clamp-1">
                    {displayName}
                  </h3>
                </div>
                
                {member.user?.email && (
                  <p className="text-sm text-muted-foreground/80 truncate flex items-center gap-1.5">
                    <SolarIcon icon="letter-bold" className="h-3.5 w-3.5 shrink-0" />
                    <span>{member.user.email}</span>
                  </p>
                )}
              </div>

              {/* Badge de rôle et date */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/30">
                <Badge
                  variant="outline"
                  className={cn(
                    "backdrop-blur-sm shrink-0",
                    roleColor.bg,
                    roleColor.text,
                    roleColor.border
                  )}
                >
                  <SolarIcon 
                    icon={roleIcons[member.role] || "user-bold"} 
                    className="h-3 w-3 mr-1.5" 
                  />
                  {roleLabels[member.role]}
                </Badge>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <SolarIcon icon="calendar-bold" className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">
                    {new Date(member.joinedAt).toLocaleDateString("fr-FR", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

