import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Mail, Store, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { adminApi } from '@/api/adminApi';
import { toast } from 'sonner';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVendor = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const vendorData = await adminApi.getVendorDetails(id);
        setVendor(vendorData);
      } catch (error) {
        console.error('Failed to load vendor:', error);
        toast.error('Failed to load vendor details');
        navigate('/admin/vendors');
      } finally {
        setIsLoading(false);
      }
    };

    loadVendor();
  }, [id, navigate]);

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
          <h1 className="text-3xl font-bold tracking-tight">Vendor Details</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarFallback className="text-2xl bg-primary text-white">
                  {vendor.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{vendor.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{vendor.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>Services:</span>
                <div className="flex flex-wrap gap-1">
                  {vendor.services.map((service: any) => (
                    <Badge key={service.id} variant="secondary">
                      {service.type}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {format(new Date(vendor.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Details</CardTitle>
              <Button variant="outline" onClick={() => navigate(`/admin/vendors/edit/${vendor.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Vendor
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Services Provided</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {vendor.services.map((service: any) => (
                    <Badge key={service.id} variant="outline">
                      {service.type}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium">Contact Information</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {vendor.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default VendorDetails;
