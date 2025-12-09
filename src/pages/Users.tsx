import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, Users as UsersIcon, Plus, Edit, Trash2, Check, X, Clock, UserCheck, UserX, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Database } from "@/integrations/supabase/types";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { EditUserProfileDialog } from "@/components/EditUserProfileDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  role: AppRole;
  is_activated: boolean;
  activation_status: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, created_at, is_activated, activation_status");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const allUsers = profiles?.map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        
        return {
          id: profile.id,
          name: profile.full_name,
          email: "Loading...",
          created_at: profile.created_at,
          role: (userRole?.role || "learner") as AppRole,
          is_activated: profile.is_activated ?? false,
          activation_status: profile.activation_status ?? "pending",
        };
      }) || [];

      // Separate active and pending users
      const active = allUsers.filter(u => u.is_activated || u.activation_status === "activated");
      const pending = allUsers.filter(u => !u.is_activated && u.activation_status === "pending");
      
      setUsers(active);
      setPendingUsers(pending);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // First delete existing role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
      }

      // Then insert the new role using the assign_user_role function to bypass RLS
      const { error } = await supabase.rpc("assign_user_role", {
        p_user_id: userId,
        p_role: newRole as AppRole,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activateUser = async (userId: string, role: AppRole) => {
    try {
      // Update profile activation status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          is_activated: true, 
          activation_status: "activated" 
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Assign role using the function
      const { error: roleError } = await supabase.rpc("assign_user_role", {
        p_user_id: userId,
        p_role: role,
      });

      if (roleError) throw roleError;

      toast({
        title: "User Activated",
        description: `User has been activated with ${role} role`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to activate user",
        variant: "destructive",
      });
    }
  };

  const denyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_activated: false, 
          activation_status: "denied" 
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User Denied",
        description: "User access has been denied",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deny user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const UserTable = ({ userList, showActivation = false }: { userList: UserProfile[], showActivation?: boolean }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>{showActivation ? "Status" : "Current Role"}</TableHead>
            <TableHead>Joined Date</TableHead>
            <TableHead>{showActivation ? "Assign Role & Activate" : "Change Role"}</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>
                {showActivation ? (
                  <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                ) : (
                  <Badge
                    variant={user.role === "admin" ? "default" : user.role === "finance" ? "outline" : "secondary"}
                    className={cn(
                      "gap-1",
                      user.role === "finance" && "border-green-500 text-green-600",
                      user.role === "visitor" && "border-blue-500 text-blue-600"
                    )}
                  >
                    {user.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                    {user.role === "finance" && <DollarSign className="h-3 w-3" />}
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {showActivation ? (
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => activateUser(user.id, value as AppRole)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="learner">Learner</SelectItem>
                        <SelectItem value="visitor">Visitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Select
                    value={user.role}
                    onValueChange={(value) => updateUserRole(user.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="learner">Learner</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {showActivation ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => denyUser(user.id)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Deny
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser({ id: user.id, name: user.name });
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setUserToDelete({ id: user.id, name: user.name });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users & Roles</h1>
            <p className="text-muted-foreground">Manage user access and permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create User
            </Button>
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" />
                {pendingUsers.length} Pending
              </Badge>
            )}
            <Badge variant="secondary" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              {users.length} Active
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Active Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending Approval ({pendingUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>View and manage activated user roles</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No active users found</div>
                ) : (
                  <UserTable userList={users} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approval</CardTitle>
                <CardDescription>Users who signed up and are waiting for activation</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No pending users</div>
                ) : (
                  <UserTable userList={pendingUsers} showActivation />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchUsers}
      />
      
      <EditUserProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userId={selectedUser?.id || null}
        userName={selectedUser?.name || ""}
        onSuccess={fetchUsers}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
              All associated data including roles, profiles, and session information will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Users;