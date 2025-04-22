import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/api/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceColumns } from './ServiceColumns';
import { ServiceActions } from './ServiceActions';
import { AddServiceDialog } from './AddServiceDialog';

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useAuth();

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const servicesData = await adminApi.getServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadServices();
    }
  }, [user, isAddDialogOpen]);

  const handleDelete = async (service: any) => {
    try {
      await adminApi.deleteService(service.id);
      await loadServices();
      toast.success(`${service.type} has been removed`);
    } catch (error: any) {
      console.error('Failed to delete service:', error);
      toast.error(error.response?.data?.message || 'Failed to delete service');
    }
  };

  const handleAddService = async (serviceData: any) => {
    try {
      await adminApi.addService(serviceData);
      await loadServices();
      toast.success(`${serviceData.serviceType} has been added as a service`);
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to add service:', error);
      toast.error(error.response?.data?.message || 'Failed to add service');
      throw error;
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>

        <DataTable 
          columns={ServiceColumns} 
          data={services} 
          isLoading={isLoading}
          actions={(service) => <ServiceActions service={service} onDelete={handleDelete} />}
        />

        <AddServiceDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddService={handleAddService}
        />
      </div>
    </AppLayout>
  );
};

export default Services;
