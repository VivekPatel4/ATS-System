import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/api/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { VendorColumns } from './VendorColumns';
import { VendorActions } from './VendorActions';
import { AddVendorDialog } from './AddVendorDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Vendors = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch vendors using React Query
  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await adminApi.getVendors();
      return response.data;
    },
    enabled: !!user
  });

  // Fetch services using React Query
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: adminApi.getServices,
    enabled: !!user
  });

  // Delete vendor mutation
  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      await adminApi.deleteVendor(vendorId);
    },
    onSuccess: () => {
      // Invalidate and refetch vendors query
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor has been removed');
    },
    onError: (error: any) => {
      console.error('Failed to delete vendor:', error);
      if (error?.response?.status !== 401) {
        toast.error('Failed to delete vendor');
      }
    }
  });

  // Add vendor mutation
  const addVendorMutation = useMutation({
    mutationFn: async (vendorData: any) => {
      await adminApi.addVendor(vendorData);
    },
    onSuccess: () => {
      // Invalidate and refetch vendors query
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor has been added successfully');
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('Failed to add vendor:', error);
      if (error?.response?.status !== 401) {
        toast.error('Failed to add vendor');
      }
    }
  });

  const handleDelete = async (vendor: any) => {
    deleteVendorMutation.mutate(vendor.id);
  };

  const handleAddVendor = async (vendorData: any) => {
    addVendorMutation.mutate(vendorData);
  };

  const isLoading = isLoadingVendors || isLoadingServices;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        <DataTable 
          columns={VendorColumns} 
          data={vendors} 
          isLoading={isLoading}
          actions={(vendor) => <VendorActions vendor={vendor} onDelete={handleDelete} />}
        />

        <AddVendorDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddVendor={handleAddVendor}
          services={services}
        />
      </div>
    </AppLayout>
  );
};

export default Vendors;
