import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Group as GroupIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
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
  { id: 'forecast', label: 'Forecast Analytics' },
  { id: 'api-logs', label: 'API Logs' },
  { id: 'user-management', label: 'User Management' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CLIENT' | 'SUPER_ADMIN'>('CLIENT');
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('CLIENT');
    setHiddenModules([]);
    setIsModalOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(''); // Don't populate password
    setRole(user.role);
    setHiddenModules(user.hiddenModules || []);
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
      if (editingUser) {
        const payload: any = { username, email, role, hiddenModules };
        if (password) payload.password = password;
        await usersApi.updateUser(editingUser.id, payload);
        toast.success('User updated successfully');
      } else {
        await usersApi.createUser({ username, email, role, password, hiddenModules } as any);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to save user', { description: error.response?.data?.message || error.message });
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2.5,
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{ 
            color: '#3B8FF3', 
            backgroundColor: '#3B8FF315',
            p: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GroupIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.5px', mb: 0.5 }}>
              User Management
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Manage system access, assign administrative roles, and configure user permissions.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ActionButton 
            variant="secondary" 
            startIcon={<PersonAddIcon fontSize="small" />} 
            onClick={openAddModal}
            accentColor="#3B8FF3"
          >
            Add New User
          </ActionButton>
        </Box>
      </Box>

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Access Level</TableHead>
              <TableHead className="font-semibold">Joined Date</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">No users found</TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {user.username.slice(0, 2)}
                      </div>
                      {user.username}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'SUPER_ADMIN' ? 'destructive' : user.role === 'ADMIN' ? 'default' : 'secondary'}
                      className="font-medium shadow-none"
                    >
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(user.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => openEditModal(user)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 hover:border-destructive" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
                  <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="CLIENT">CLIENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {editingUser && '(Leave blank to keep unchanged)'}</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {role !== 'SUPER_ADMIN' && (
              <div className="space-y-3">
                <Label>Hidden Services (Modules)</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-4 bg-muted/20">
                  {AVAILABLE_MODULES.map((mod) => (
                    <div key={mod.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        id={`hide-${mod.id}`}
                        checked={hiddenModules.includes(mod.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setHiddenModules([...hiddenModules, mod.id]);
                          } else {
                            setHiddenModules(hiddenModules.filter((id) => id !== mod.id));
                          }
                        }}
                      />
                      <Label htmlFor={`hide-${mod.id}`} className="font-normal text-sm cursor-pointer leading-none">
                        {mod.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
