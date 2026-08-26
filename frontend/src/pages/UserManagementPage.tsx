import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { Group as GroupIcon, PersonAdd as PersonAddIcon, History as HistoryIcon } from '@mui/icons-material';
import ActionButton from '../components/common/ActionButton';
import { usersApi } from '@/api/users.api';
import { AppUser } from '@/api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Users, Edit2, Trash2, Mail, Shield, Calendar, UserCog } from 'lucide-react';

const AVAILABLE_MODULES = [
  { id: 'database', label: 'Demand & Generation Data' },
  { id: 'markets', label: 'IEX Market' },
  { id: 'resource-center', label: 'Resource Center' },
  { id: 'market-operations', label: 'Market Operations' },
  { id: 'savings-calculator', label: 'Savings Calculator' },
  { id: 'savings-calculator-new', label: 'Savings Calculator (New)' },
  { id: 'forecast', label: 'Forecast Analytics' },
  { id: 'api-logs', label: 'API Logs' },
  { id: 'user-management', label: 'User Management' },
  { id: 'customer-lead', label: 'Customer Lead' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CLIENT' | 'SUPER_ADMIN'>('CLIENT');
  const [hiddenModules, setHiddenModules] = useState<string[]>(AVAILABLE_MODULES.map(m => m.id));
  const [readOnlyModules, setReadOnlyModules] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error('Failed to fetch users', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const data = await usersApi.getAuditLogs();
      setAuditLogs(data);
    } catch (error: any) {
      toast.error('Failed to fetch audit logs', { description: error.message });
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setEmail('');
    setRole('CLIENT');
    setHiddenModules(AVAILABLE_MODULES.map(m => m.id)); // Default: all hidden
    setReadOnlyModules([]);
    setIsModalOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setRole(user.role);
    setHiddenModules(user.hiddenModules || []);
    setReadOnlyModules(user.readOnlyModules || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersApi.deleteUser(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to delete user', { description: error.message });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      if (editingUser) {
        const payload: any = { username, email, role, hiddenModules, readOnlyModules };
        await usersApi.updateUser(editingUser.id, payload);
        toast.success('User updated successfully');
      } else {
        await usersApi.createUser({ username, email, role, hiddenModules, readOnlyModules } as any);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to save user', { description: error.response?.data?.message || error.message });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#EEF8F9] text-[#0B2149] -m-4 sm:-m-6 md:-m-8 p-4 sm:p-6 md:p-8">
      {/* Top Navbar / Breadcrumb area (if we want it to look exactly like screenshot inside the container) */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 mb-8">
        <div className="flex items-center font-bold text-xl text-red-600 italic tracking-tighter">
          <span className="text-black">Prolt</span> <span className="text-blue-900 ml-1">Energy</span>
        </div>
        <div className="text-xs text-gray-500 mt-2 mr-4">By Probus</div>
        <div className="text-sm font-medium text-gray-500 border-l border-gray-300 pl-4">
          Home &nbsp;&gt;&nbsp; <span className="text-[#0B2149] font-bold">Admin</span>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2.5,
          mb: 4
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ 
              color: '#3B8FF3', 
              backgroundColor: '#DDF3FC',
              p: 2,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64
            }}>
              <GroupIcon fontSize="large" sx={{ color: '#3B8FF3' }} />
            </Box>
            <Box>
              <Typography variant="h1" sx={{ color: '#0B2149', fontWeight: 700, fontSize: '24px', letterSpacing: '-0.5px', mb: 0.5 }}>
                User Management
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280' }}>
                Manage system access, assign administrative roles, and configure user permissions.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {activeTab === 'users' && (
              <Button 
                variant="outline" 
                onClick={openAddModal}
                className="rounded-full border-blue-400 text-blue-500 hover:bg-blue-50 hover:text-blue-600 px-6 py-2 h-auto"
              >
                <PersonAddIcon fontSize="small" className="mr-2" />
                Add New User
              </Button>
            )}
          </Box>
        </Box>

        <div className="border-b border-blue-200 mb-6 flex gap-6">
          <button 
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('users')}
          >
            <GroupIcon fontSize="small" /> Users
          </button>
          <button 
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 ${activeTab === 'audit' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('audit')}
          >
            <HistoryIcon fontSize="small" /> Audit Trail
          </button>
        </div>

        {activeTab === 'users' ? (
        <div className="rounded-xl bg-[#EEF8F9] border border-gray-300 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#EEF8F9] hover:bg-[#EEF8F9] border-b border-gray-400">
                <TableHead className="font-bold text-[#111827]">User</TableHead>
                <TableHead className="font-bold text-[#111827]">Contact</TableHead>
                <TableHead className="font-bold text-[#111827]">Access Level</TableHead>
                <TableHead className="font-bold text-[#111827]">Joined Date</TableHead>
                <TableHead className="text-right font-bold text-[#111827]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-[#EEF8F9]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : users.filter(user => user.role !== 'SUPER_ADMIN').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No users found</TableCell>
                </TableRow>
              ) : (
                users.filter(user => user.role !== 'SUPER_ADMIN').map(user => (
                  <TableRow key={user.id} className="group transition-colors hover:bg-gray-50 border-b border-gray-400">
                    <TableCell className="font-medium text-[#111827]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-[#111827] font-bold text-xs uppercase">
                          {user.username.slice(0, 2)}
                        </div>
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[#4B5563]">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-[#4B5563] uppercase">
                        {user.role.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[#4B5563] text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {new Date(user.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-2">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-600 hover:text-blue-500 rounded-l border border-gray-400 hover:border-blue-500 bg-white" onClick={() => openEditModal(user)}>
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-600 hover:text-red-500 rounded-r border border-gray-400 border-l-0 hover:border-red-500 hover:border-l bg-white" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        ) : (
        <div className="rounded-xl bg-[#EEF8F9] border border-gray-300 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#EEF8F9] hover:bg-[#EEF8F9] border-b border-gray-400">
                <TableHead className="font-bold text-[#111827]">Timestamp</TableHead>
                <TableHead className="font-bold text-[#111827]">Action By</TableHead>
                <TableHead className="font-bold text-[#111827]">Action</TableHead>
                <TableHead className="font-bold text-[#111827]">Target User</TableHead>
                <TableHead className="font-bold text-[#111827]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-[#EEF8F9]">
              {loadingAudit ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Loading audit logs...</TableCell>
                </TableRow>
              ) : auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No audit logs found</TableCell>
                </TableRow>
              ) : (
                auditLogs.map(log => (
                  <TableRow key={log.id} className="group transition-colors hover:bg-gray-50 border-b border-gray-400">
                    <TableCell className="text-[#4B5563] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-[#111827]">
                      {log.performedBy}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.action === 'DELETE' ? 'destructive' : log.action === 'CREATE' ? 'default' : 'secondary'}
                        className="font-medium shadow-none"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-[#111827]">
                      {log.targetUser}
                    </TableCell>
                    <TableCell>
                      <pre className="text-xs text-[#4B5563] whitespace-pre-wrap max-w-xs break-words">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v: 'SUPER_ADMIN'|'ADMIN'|'CLIENT') => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingUser?.role === 'SUPER_ADMIN') && (
                      <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                    )}
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="CLIENT">CLIENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role !== 'SUPER_ADMIN' && (
                <div className="space-y-3">
                  <Label>Allowed Services (Modules)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4 bg-muted/20 max-h-[300px] overflow-y-auto">
                    {AVAILABLE_MODULES.map((mod) => {
                      let currentAccess = 'none';
                      if (!hiddenModules.includes(mod.id)) {
                        if (readOnlyModules.includes(mod.id)) {
                          currentAccess = 'view';
                        } else if (readOnlyModules.includes(`${mod.id}-nodelete`)) {
                          currentAccess = 'edit_no_delete';
                        } else {
                          currentAccess = 'edit';
                        }
                      }
                      
                      return (
                        <div key={mod.id} className="flex flex-col space-y-1.5 p-2 rounded border bg-background">
                          <Label className="font-medium text-sm">{mod.label}</Label>
                          <Select
                            value={currentAccess}
                            onValueChange={(val: 'none' | 'view' | 'edit' | 'edit_no_delete') => {
                              let newHidden = [...hiddenModules];
                              let newReadOnly = [...readOnlyModules];
                              
                              newHidden = newHidden.filter(id => id !== mod.id);
                              newReadOnly = newReadOnly.filter(id => id !== mod.id && id !== `${mod.id}-nodelete`);
                              
                              if (val === 'none') {
                                newHidden.push(mod.id);
                              } else if (val === 'view') {
                                newReadOnly.push(mod.id);
                              } else if (val === 'edit_no_delete') {
                                newReadOnly.push(`${mod.id}-nodelete`);
                              }
                              
                              setHiddenModules(newHidden);
                              setReadOnlyModules(newReadOnly);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Access</SelectItem>
                              <SelectItem value="view">View Only</SelectItem>
                              {mod.id === 'savings-calculator' && (
                                <SelectItem value="edit_no_delete">View, Edit & No Delete</SelectItem>
                              )}
                              <SelectItem value="edit">View & Edit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

}
