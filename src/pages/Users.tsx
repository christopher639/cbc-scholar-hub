import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, Users as UsersIcon, Plus, Edit, Trash2, Check, X, Clock, UserCheck, UserX, DollarSign, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const avatarColors = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
  "bg-orange-500", "bg-cyan-500"
];

const getAvatarColor = (name: string) => {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
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
import { useVisitorAccess } from "@/hooks/useVisitorAccess";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  role: AppRole;
  is_activated: boolean;
  activation_status: string;
  avatar_url?: string;
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
  const { checkAccess, isVisitor, isFinance, checkFinanceAccess } = useVisitorAccess();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, created_at, is_activated, activation_status, avatar_url");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch user emails from auth via edge function or use stored emails
      const userEmails: Record<string, string> = {};
      
      // Try to get emails from Supabase auth (this requires admin access)
      // For now, we'll get them from the auth metadata if available
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-emails`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds: profiles?.map(p => p.id) || [] }),
          });
          if (response.ok) {
            const emailData = await response.json();
            emailData.emails?.forEach((e: { id: string; email: string }) => {
              userEmails[e.id] = e.email;
            });
          }
        } catch (e) {
          console.log("Could not fetch emails:", e);
        }
      }

      const allUsers = profiles?.map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        
        return {
          id: profile.id,
          name: profile.full_name,
          email: userEmails[profile.id] || "—",
          created_at: profile.created_at,
          role: (userRole?.role || "learner") as AppRole,
          is_activated: profile.is_activated ?? false,
          activation_status: profile.activation_status ?? "pending",
          avatar_url: profile.avatar_url,
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
    if (!checkFinanceAccess("change user roles", false)) return;
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
    if (!checkFinanceAccess("activate users", false)) return;
    try {
      // Get user profile info for notification
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, phone_number")
        .eq("id", userId)
        .single();

      // Get user email from auth (if available via edge function or stored)
      const userEmail = null; // Will be fetched from edge function

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

      // Send account verified notification via SMS and email
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-account-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              notificationType: "account_verified",
              phone: profileData?.phone_number,
              fullName: profileData?.full_name,
            }),
          });
        }
      } catch (notifError) {
        console.error("Failed to send verification notification:", notifError);
      }

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
    if (!checkFinanceAccess("deny users", false)) return;
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
    if (!checkFinanceAccess("delete users", false)) return;
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

  // Mobile card view for small screens
  const UserCard = ({ user, showActivation = false }: { user: UserProfile, showActivation?: boolean }) => (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar_url || ""} alt={user.name} />
          <AvatarFallback className={`${getAvatarColor(user.name)} text-white text-sm`}>
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        {showActivation ? (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 shrink-0">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        ) : (
          <Badge
            variant={user.role === "admin" ? "default" : user.role === "finance" ? "outline" : "secondary"}
            className={cn(
              "gap-1 shrink-0",
              user.role === "finance" && "border-green-500 text-green-600",
              user.role === "visitor" && "border-blue-500 text-blue-600"
            )}
          >
            {user.role === "admin" && <ShieldCheck className="h-3 w-3" />}
            {user.role === "finance" && <DollarSign className="h-3 w-3" />}
            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
          </Badge>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        {showActivation ? (
          <>
            <Select onValueChange={(value) => activateUser(user.id, value as AppRole)} disabled={isVisitor || isFinance}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select role to activate" />
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
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={isVisitor || isFinance}
              onClick={() => denyUser(user.id)}
            >
              <UserX className="h-4 w-4 mr-1" />
              Deny
            </Button>
          </>
        ) : (
          <>
            <Select
              value={user.role}
              onValueChange={(value) => updateUserRole(user.id, value)}
              disabled={isVisitor || isFinance}
            >
              <SelectTrigger className="flex-1">
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isVisitor || isFinance}
                onClick={() => {
                  if (checkFinanceAccess("edit users", false)) {
                    setSelectedUser({ id: user.id, name: user.name });
                    setEditDialogOpen(true);
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                disabled={isVisitor || isFinance}
                onClick={() => {
                  if (checkFinanceAccess("delete users", false)) {
                    setUserToDelete({ id: user.id, name: user.name });
                    setDeleteDialogOpen(true);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const UserTable = ({ userList, showActivation = false }: { userList: UserProfile[], showActivation?: boolean }) => (
    <>
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {userList.map((user) => (
          <UserCard key={user.id} user={user} showActivation={showActivation} />
        ))}
      </div>
      
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{showActivation ? "Status" : "Current Role"}</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead>{showActivation ? "Assign Role & Activate" : "Change Role"}</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userList.map((user) => (
              <TableRow key={user.id} className="h-10">
                <TableCell className="py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                    <AvatarFallback className={`${getAvatarColor(user.name)} text-white text-xs`}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium py-2">{user.name}</TableCell>
                <TableCell className="py-2 text-muted-foreground text-sm">{user.email}</TableCell>
                <TableCell className="py-2">
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
                <TableCell className="py-2">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-2">
                  {showActivation ? (
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(value) => activateUser(user.id, value as AppRole)} disabled={isVisitor || isFinance}>
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
                      disabled={isVisitor || isFinance}
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
                <TableCell className="py-2">
                  {showActivation ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isVisitor || isFinance}
                      onClick={() => denyUser(user.id)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Deny
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={isVisitor || isFinance}
                          onClick={() => {
                            if (checkFinanceAccess("edit users", false)) {
                              setSelectedUser({ id: user.id, name: user.name });
                              setEditDialogOpen(true);
                            }
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isVisitor || isFinance}
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (checkFinanceAccess("delete users", false)) {
                              setUserToDelete({ id: user.id, name: user.name });
                              setDeleteDialogOpen(true);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3">
                {/* Header row - title, stats, and create button */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex items-center justify-between lg:justify-start gap-4">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Users & Roles</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Manage user access and permissions</CardDescription>
                    </div>
                    
                    {/* Stats - visible on large screens between title and button */}
                    <div className="hidden lg:flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/10 text-green-600 border border-green-500/30">
                        <span className="font-medium text-sm">{users.length}</span>
                        <span className="text-sm">Active</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/30">
                        <span className="font-medium text-sm">{pendingUsers.length}</span>
                        <span className="text-sm">Pending</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      if (checkFinanceAccess("create users", false)) {
                        setCreateDialogOpen(true);
                      }
                    }} 
                    size="sm"
                    disabled={isVisitor || isFinance}
                    className="shrink-0 w-full lg:w-auto"
                  >
                    <Plus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Create User</span>
                  </Button>
                </div>
                
                {/* Stats on small screens + tabs row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Stats - visible on small/medium screens */}
                  <div className="flex lg:hidden items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-600 border border-green-500/30 text-xs sm:text-sm">
                      <span className="font-medium">{users.length}</span>
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/30 text-xs sm:text-sm">
                      <span className="font-medium">{pendingUsers.length}</span>
                      <span>Pending</span>
                    </div>
                  </div>
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="active" className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
                      <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Active</span> ({users.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Pending</span> ({pendingUsers.length})
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="active" className="mt-0">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No active users found</div>
                ) : (
                  <UserTable userList={users} />
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-0">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No pending users</div>
                ) : (
                  <UserTable userList={pendingUsers} showActivation />
                )}
              </TabsContent>
            </CardContent>
          </Card>
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