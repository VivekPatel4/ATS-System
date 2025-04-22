import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vendor } from '@/types';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVendor: (data: any) => Promise<void>;
  services: any[];
}

// Service types available for selection
const SERVICE_TYPES = ['IT Consulting', 'Software Development', 'Cloud Services', 'Security Services', 'Hardware Supply', 'Network Infrastructure', 'Managed IT Services', 'Data Analytics', 'Database Management', 'Web Development', 'Mobile App Development', 'AI and Machine Learning', 'DevOps Services', 'QA Testing', 'Technical Support'];

export function AddVendorDialog({ open, onOpenChange, onAddVendor, services }: AddVendorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedServices.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddVendor({
        ...formData,
        serviceIds: selectedServices.map(id => parseInt(id)),
      });
      setFormData({ name: "", email: "", password: "" });
      setSelectedServices([]);
    } catch (error) {
      console.error("Failed to add vendor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Enter the details of the new vendor below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Vendor Name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email Address"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password"
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
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Adding...
                </div>
              ) : (
                "Add Vendor"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}