"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type User = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("agent");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError("Failed to load team members");
    }
    setLoading(false);
  };

  const handleAddUser = async () => {
    if (!newEmail || !newPassword) return;
    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(`User ${newEmail} added successfully!`);
        setNewEmail("");
        setNewPassword("");
        setNewRole("agent");
        setShowAddDialog(false);
        await fetchUsers();
      } else {
        setError(data.error || "Failed to add user");
      }
    } catch {
      setError("Network error");
    }
    setAdding(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      await fetchUsers();
    } catch {
      setError("Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Remove ${email} from the team? They will lose CRM access.`)) return;

    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      if (res.ok) {
        setSuccess(`${email} removed from team.`);
        await fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to remove user");
      }
    } catch {
      setError("Network error");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Team</h1>
            <p className="text-gray-500 mt-1">Manage agents who have access to this CRM.</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-500">
            + Add Member
          </Button>
        </header>

        {/* Messages */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center justify-between">
            <span>✅ {success}</span>
            <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-emerald-600">✕</button>
          </div>
        )}

        {/* Team Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({users.length})</CardTitle>
            <CardDescription>Everyone with access to the CRM dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-gray-400">Loading team...</div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-400">No team members found.</p>
                <p className="text-sm text-gray-400 mt-1">The admin user exists in Supabase Auth but not in the CRM User table.</p>
                <Button onClick={() => setShowAddDialog(true)} variant="outline" className="mt-4">
                  Add your first team member
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                            user.role === "admin" ? "bg-slate-800" : "bg-emerald-600"
                          }`}>
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.email}</p>
                            <p className="text-xs text-gray-400">{user.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer ${
                            user.role === "admin"
                              ? "bg-slate-900 text-white"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          <option value="admin">Admin</option>
                          <option value="agent">Agent</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-amber-800">
                <p className="font-bold">Setup Required</p>
                <p className="mt-1">
                  To add team members, add your Supabase service role key to <code className="bg-amber-200/50 px-1 rounded text-xs">.env</code>:
                </p>
                <pre className="mt-2 bg-amber-100 p-2 rounded text-xs font-mono">
                  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add User Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Create a new user who can access the CRM. They&apos;ll use these credentials to log in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="agent@cureforever.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-200"
                >
                  <option value="agent">Agent — Can manage tasks and call logs</option>
                  <option value="admin">Admin — Full access including settings</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button
                onClick={handleAddUser}
                disabled={adding || !newEmail || !newPassword}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {adding ? "Creating..." : "Add Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
