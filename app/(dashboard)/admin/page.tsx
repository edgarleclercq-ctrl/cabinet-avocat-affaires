"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ROLES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import {
  Settings,
  Users,
  UserPlus,
  Building2,
  Upload,
  FileText,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function roleBadgeClass(role: string) {
  switch (role) {
    case "associe":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "collaborateur":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "secretaire":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "stagiaire":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    default:
      return "";
  }
}

export default function AdminPage() {
  const router = useRouter();
  const user = useQuery(api.users.me);
  const users = useQuery(api.users.list, {});

  const invite = useMutation(api.users.invite);
  const updateRole = useMutation(api.users.updateRole);
  const deactivate = useMutation(api.users.deactivate);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteNom, setInviteNom] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("");
  const [isInviting, setIsInviting] = useState(false);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserNom, setSelectedUserNom] = useState("");
  const [newRole, setNewRole] = useState<string>("");

  // Redirect if not associe
  useEffect(() => {
    if (user && user.role !== "associe") {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (user.role !== "associe") {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-muted-foreground">
          Acces restreint aux associes.
        </div>
      </div>
    );
  }

  async function handleInvite() {
    if (!inviteNom || !inviteEmail || !inviteRole) return;
    setIsInviting(true);
    try {
      await invite({
        name: inviteNom,
        email: inviteEmail,
        role: inviteRole as any,
      });
      setInviteDialogOpen(false);
      setInviteNom("");
      setInviteEmail("");
      setInviteRole("");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleUpdateRole() {
    if (!selectedUserId || !newRole) return;
    try {
      await updateRole({
        userId: selectedUserId as any,
        role: newRole as any,
      });
    } finally {
      setRoleDialogOpen(false);
      setSelectedUserId("");
      setNewRole("");
    }
  }

  async function handleDeactivate(userId: string) {
    await deactivate({ userId: userId as any });
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Administration
        </h1>
        <p className="text-muted-foreground">
          Gestion des utilisateurs et parametres du cabinet
        </p>
      </div>

      {/* Section A: Gestion des utilisateurs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Gestion des utilisateurs
          </CardTitle>
          <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Inviter un utilisateur
          </Button>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun utilisateur.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">
                        {u.nom ?? "-"}
                      </TableCell>
                      <TableCell>{u.email ?? "-"}</TableCell>
                      <TableCell>
                        <Badge className={roleBadgeClass(u.role)}>
                          {ROLES[u.role as keyof typeof ROLES] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.actif === false ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactif
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Actif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(u._id);
                              setSelectedUserNom(u.nom ?? u.email);
                              setNewRole(u.role);
                              setRoleDialogOpen(true);
                            }}
                          >
                            Changer role
                          </Button>
                          {u.actif !== false && u._id !== user?._id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeactivate(u._id)}
                            >
                              Desactiver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Section B: Parametres du cabinet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Parametres du cabinet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo upload placeholder */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Logo du cabinet</Label>
            <div className="flex items-center justify-center h-32 rounded-md border border-dashed text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6" />
                <span>Upload du logo (a venir)</span>
              </div>
            </div>
          </div>

          {/* Cabinet info placeholder */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Informations du cabinet
            </Label>
            <div className="flex items-center justify-center h-24 rounded-md border border-dashed text-sm text-muted-foreground">
              Nom, adresse, SIRET, etc. (a venir)
            </div>
          </div>

          {/* Conditions generales placeholder */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Conditions generales par defaut
            </Label>
            <div className="flex items-center justify-center h-24 rounded-md border border-dashed text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Configuration des conditions generales (a venir)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                placeholder="Nom complet"
                value={inviteNom}
                onChange={(e) => setInviteNom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@cabinet.fr"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(val) => val !== null && setInviteRole(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectionner un role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleInvite}
              disabled={isInviting || !inviteNom || !inviteEmail || !inviteRole}
            >
              {isInviting ? "Envoi en cours..." : "Inviter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role change dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le role de {selectedUserNom}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nouveau role</Label>
              <Select value={newRole} onValueChange={(val) => val !== null && setNewRole(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectionner un role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateRole} disabled={!newRole}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
