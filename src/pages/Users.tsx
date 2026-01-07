import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { getCachedData } from "@/hooks/useAdminNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, Users as UsersIcon, Plus, Edit, Trash2, Clock, UserCheck, UserX, DollarSign, MoreHorizontal, Search, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { checkAccess, isVisitor, isFinance, checkFinanceAccess } = useVisitorAccess();

  // Check for prefetched data from navigation
  const prefetchedData = useMemo(() => getCachedData('/users'), []);

  const fetchUsers = async (usePrefetched = false) => {
    try {
      // If we have prefetched data, use it immediately
      if (usePrefetched && prefetchedData?.profiles && prefetchedData?.userRoles) {
        const profiles = prefetchedData.profiles;
        const roles = prefetchedData.userRoles;
        
        const allUsers = profiles?.map((profile: any) => {
          const userRole = roles?.find((r: any) => r.user_id === profile.id);
          return {
            id: profile.id,
            name: profile.full_name,
            email: "—",
            created_at: profile.created_at,
            role: (userRole?.role || "learner") as AppRole,
            is_activated: profile.is_activated ?? false,
            activation_status: profile.activation_status ?? "pending",
            avatar_url: profile.avatar_url,
          };
        }) || [];

        const active = allUsers.filter((u: any) => u.is_activated || u.activation_status === "activated");
        const pending = allUsers.filter((u: any) => !u.is_activated && u.activation_status === "pending");
        
        setUsers(active);
        setPendingUsers(pending);
        setLoading(false);
        setInitialLoadComplete(true);
        
        // Fetch emails in background
        fetchUserEmails(profiles);
        return;
      }
      
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, created_at, is_activated, activation_status, avatar_url");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const userEmails: Record<string, string> = {};
      
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
      setInitialLoadComplete(true);
    }
  };

  // Fetch emails in background after prefetched data is used
  const fetchUserEmails = async (profiles: any[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
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
        const emailMap: Record<string, string> = {};
        emailData.emails?.forEach((e: { id: string; email: string }) => {
          emailMap[e.id] = e.email;
        });
        
        // Update users with emails
        setUsers(prev => prev.map(u => ({ ...u, email: emailMap[u.id] || u.email })));
        setPendingUsers(prev => prev.map(u => ({ ...u, email: emailMap[u.id] || u.email })));
      }
    } catch (e) {
      console.log("Could not fetch emails:", e);
    }
  };

  useEffect(() => {
    // Use prefetched data if available
    if (prefetchedData?.profiles) {
      fetchUsers(true);
    } else {
      fetchUsers(false);
    }
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!checkFinanceAccess("change user roles", false)) return;
    try {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
      }

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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, phone_number")
        .eq("id", userId)
        .single();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          is_activated: true, 
          activation_status: "activated" 
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase.rpc("assign_user_role", {
        p_user_id: userId,
        p_role: role,
      });

      if (roleError) throw roleError;

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

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingUsers = pendingUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;

  const UserTable = ({ userList, showActivation = false }: { userList: UserProfile[], showActivation?: boolean }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 py-2 text-xs">Photo</TableHead>
            <TableHead className="py-2 text-xs">Name</TableHead>
            <TableHead className="py-2 text-xs hidden md:table-cell">Email</TableHead>
            <TableHead className="py-2 text-xs">{showActivation ? "Status" : "Role"}</TableHead>
            <TableHead className="py-2 text-xs hidden lg:table-cell">Joined</TableHead>
            <TableHead className="py-2 text-xs">{showActivation ? "Assign Role" : "Change Role"}</TableHead>
            <TableHead className="w-12 py-2 text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.map((user) => (
            <TableRow key={user.id} className="h-12">
              <TableCell className="py-1.5">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                  <AvatarFallback className={`${getAvatarColor(user.name)} text-white text-xs`}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="py-1.5 text-sm font-medium">{user.name}</TableCell>
              <TableCell className="py-1.5 text-sm text-muted-foreground hidden md:table-cell">{user.email}</TableCell>
              <TableCell className="py-1.5">
                {showActivation ? (
                  <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 text-xs">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                ) : (
                  <Badge
                    variant={user.role === "admin" ? "default" : user.role === "finance" ? "outline" : "secondary"}
                    className={cn(
                      "gap-1 text-xs",
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
              <TableCell className="py-1.5 text-sm text-muted-foreground hidden lg:table-cell">
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="py-1.5">
                {showActivation ? (
                  <Select onValueChange={(value) => activateUser(user.id, value as AppRole)} disabled={isVisitor || isFinance}>
                    <SelectTrigger className="w-28 h-8 text-xs">
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
                ) : (
                  <Select
                    value={user.role}
                    onValueChange={(value) => updateUserRole(user.id, value)}
                    disabled={isVisitor || isFinance}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
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
              <TableCell className="py-1.5">
                {showActivation ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    disabled={isVisitor || isFinance}
                    onClick={() => denyUser(user.id)}
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
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
  );

  // Show full-page loading state until initial data is fetched
  if (!initialLoadComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading users...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Users & Roles</h1>
            <p className="text-sm text-muted-foreground">Manage user access and permissions</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                if (checkFinanceAccess("create users", false)) {
                  setCreateDialogOpen(true);
                }
              }}
              size="sm"
              disabled={isVisitor || isFinance}
              className="h-9"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Create User</span>
            </Button>
          </div>
        </div>

        {/* Tabs & Table */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 pt-4 pb-2 border-b flex items-center justify-between">
              <TabsList className="h-8">
                <TabsTrigger value="active" className="text-xs h-7 px-3">
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                  Active ({users.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs h-7 px-3">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Pending ({pendingUsers.length})
                </TabsTrigger>
              </TabsList>
            </div>
            <CardContent className="p-0">
              <TabsContent value="active" className="m-0">
                {loading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No active users found</div>
                ) : (
                  <UserTable userList={filteredUsers} />
                )}
              </TabsContent>
              <TabsContent value="pending" className="m-0">
                {loading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
                ) : filteredPendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No pending users</div>
                ) : (
                  <UserTable userList={filteredPendingUsers} showActivation />
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
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