"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

/**
 * Page de gestion des utilisateurs
 */
export function UsersClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const users = useQuery(api.admin.getAllUsers, {
    limit,
    skip: page * limit,
    search: searchQuery || undefined,
  });

  const filteredUsers = users || [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Utilisateurs</h2>
        <p className="text-muted-foreground">
          Gérer tous les utilisateurs de l'application
        </p>
      </div>

      {/* Recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Rechercher par email, nom ou username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users === undefined ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead className="min-w-[150px]">Nom</TableHead>
                      <TableHead className="min-w-[120px]">Username</TableHead>
                      <TableHead className="min-w-[80px]">Niveau</TableHead>
                      <TableHead className="min-w-[120px]">Rôle</TableHead>
                      <TableHead className="min-w-[100px]">Premium</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{user.email}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{user.name || "-"}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{user.username || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.level || 0}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline">{user.role || "explorateur"}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary">{user.premiumTier || "free"}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Link
                            href={`/admin/users/${user._id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            Modifier
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

