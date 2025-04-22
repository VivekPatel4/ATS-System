import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/api/adminApi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const EditVendor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const [vendorData, servicesData] = await Promise.all([
          adminApi.getVendorDetails(id),
          adminApi.getServices()
        ]);
        setVendor(vendorData);
        setServices(servicesData);
        setSelectedServices(vendorData.services.map((s: any) => s.id.toString()));
      } catch (error) {
        console.error('Failed to load vendor:', error);
        toast.error('Failed to load vendor details');
        navigate('/admin/vendors');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const handleChange = (field: string, value: string) => {
    if (vendor) {
      setVendor({ ...vendor, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !id) return;

    try {
      setIsSaving(true);
      
      if (selectedServices.length === 0) {
        toast.error("Please select at least one service");
        return;
      }

      await adminApi.updateVendor(id, {
        name: vendor.name,
        email: vendor.email,
        serviceIds: selectedServices.map(id => parseInt(id, 10))
      });
      
      toast.success('Vendor updated successfully');
      navigate('/admin/vendors');
    } catch (error: any) {
      console.error('Failed to update vendor:', error);
      toast.error(error.response?.data?.message || 'Failed to update vendor');
    } finally {
      setIsSaving(false);
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

  if (!vendor) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/vendors')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Vendor</h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
              <CardDescription>Make changes to the vendor's information here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={vendor.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Vendor Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={vendor.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Email Address"
                />
              </div>
              <div className="grid gap-2">
                <Label>Services</Label>
                <ScrollArea className="h-[200px] w-full border rounded-md p-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.id.toString())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service.id.toString()]);
                          } else {
                            setSelectedServices(selectedServices.filter(id => id !== service.id.toString()));
                          }
                        }}
                      />
                      <Label htmlFor={`service-${service.id}`}>{service.type}</Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/admin/vendors')} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EditVendor;
