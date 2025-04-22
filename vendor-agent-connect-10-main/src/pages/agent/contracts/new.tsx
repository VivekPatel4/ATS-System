
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { sampleVendors } from '@/data/sampleData';
import { Vendor } from '@/types';

const NewContract = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorIdFromUrl = searchParams.get('vendorId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>(vendorIdFromUrl || '');
  const [title, setTitle] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  useEffect(() => {
    // In a real app, this would be an API call to get active vendors
    const activeVendors = sampleVendors.filter(vendor => vendor.status === 'active');
    setVendors(activeVendors);
    
    // If vendor ID is provided in URL, pre-select that vendor
    if (vendorIdFromUrl) {
      setSelectedVendor(vendorIdFromUrl);
    }
  }, [vendorIdFromUrl]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !selectedVendor || !expiryDate || !value) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Contract created successfully!');
      setIsLoading(false);
      navigate('/agent/contracts');
    }, 1000);
  };
  
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/agent/contracts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create New Contract</h1>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
              <CardDescription>Create a new contract with a vendor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Contract Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter contract title"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="vendor">Select Vendor</Label>
                <Select
                  value={selectedVendor}
                  onValueChange={(value) => setSelectedVendor(value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} - {vendor.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="value">Contract Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter contract value"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional details or terms..."
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/agent/contracts')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </div>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Contract
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

export default NewContract;
