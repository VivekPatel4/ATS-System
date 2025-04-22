
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Service } from '@/types';

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (service: Service) => void;
  service: Service | null;
}

export const EditServiceDialog = ({ open, onOpenChange, onSave, service }: EditServiceDialogProps) => {
  const [formData, setFormData] = useState({
    serviceName: '',
    serviceDescription: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when service changes
  useEffect(() => {
    if (service) {
      setFormData({
        serviceName: service.name,
        serviceDescription: service.description
      });
      setErrors({});
    }
  }, [service]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.serviceName.trim()) {
      newErrors.serviceName = 'Service name is required';
    }
    
    if (!formData.serviceDescription.trim()) {
      newErrors.serviceDescription = 'Service description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    // Clear error when user types
    if (errors[id]) {
      setErrors({ ...errors, [id]: '' });
    }
  };

  const handleSave = () => {
    if (validateForm() && service) {
      onSave({
        ...service,
        name: formData.serviceName,
        description: formData.serviceDescription
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>
            Update the service details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="serviceName">Service Name*</Label>
            <Input
              id="serviceName"
              value={formData.serviceName}
              onChange={handleInputChange}
              placeholder="Service Name"
              className={errors.serviceName ? "border-red-500" : ""}
            />
            {errors.serviceName && <p className="text-xs text-red-500">{errors.serviceName}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="serviceDescription">Service Description*</Label>
            <Textarea
              id="serviceDescription"
              value={formData.serviceDescription}
              onChange={handleInputChange}
              placeholder="Provide a detailed description of the service"
              className={errors.serviceDescription ? "border-red-500" : ""}
              rows={4}
            />
            {errors.serviceDescription && <p className="text-xs text-red-500">{errors.serviceDescription}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
