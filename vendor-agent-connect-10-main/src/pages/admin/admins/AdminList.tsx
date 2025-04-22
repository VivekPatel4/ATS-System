import React, { useEffect, useState } from 'react';
import { adminApi } from '@/api/adminApi';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";

interface Admin {
  adminID: number;
  name: string;
  email: string;
  createdAt: string;
}

const AdminListContent: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [open, setOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const data = await adminApi.getAllAdmins();
      setAdmins(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch admins');
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewAdmin({ name: '', email: '', password: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.registerAdmin({
        adminID: 0,
        name: newAdmin.name,
        email: newAdmin.email,
        passwordHash: newAdmin.password,
        createdAt: new Date().toISOString()
      });
      
      if (response.message === "Admin registered successfully!") {
        toast.success('Admin added successfully');
        handleClose();
        fetchAdmins();
      } else {
        throw new Error('Failed to add admin');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (adminId: number) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await adminApi.deleteAdmin(adminId);
        toast.success('Admin deleted successfully');
        fetchAdmins();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete admin');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpen}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                Create a new admin account with name, email and password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  name="name"
                  placeholder="Full Name"
                  value={newAdmin.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={newAdmin.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={newAdmin.password}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Admin'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow key="header">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={`admin-${admin.adminID}`}>
                <TableCell>{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(admin.adminID)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const AdminList: React.FC = () => {
  return (
    <AppLayout>
      <AdminListContent />
    </AppLayout>
  );
};

export default AdminList; 