
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Contract, Agent, Vendor } from '@/types';
import { getContractById, getAgentById, getVendorById, updateContractStatus } from '@/api/api';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Download, FileText, Mail, Send, User, XCircle } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const contractData = await getContractById(id);
        
        if (contractData) {
          setContract(contractData);
          
          // Fetch related agent and vendor data
          try {
            const [agentData, vendorData] = await Promise.all([
              getAgentById(contractData.agentId),
              getVendorById(contractData.vendorId)
            ]);
            
            setAgent(agentData);
            setVendor(vendorData);
          } catch (error) {
            console.error("Failed to load related data", error);
          }
          
        } else {
          toast.error("Contract not found");
          navigate('/admin/contracts');
        }
      } catch (error) {
        toast.error("Failed to load contract details");
        navigate('/admin/contracts');
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const handleStatusUpdate = async (status: Contract['status']) => {
    if (!contract) return;
    
    setIsLoading(true);
    try {
      await updateContractStatus(contract.id, status);
      setContract({ ...contract, status });
      toast.success(`Contract marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update contract status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!contract) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading contract details...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/contracts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Contract Details</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Contract Status</span>
                <StatusBadge status={contract.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created On</h3>
                <p>{new Date(contract.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Expires On</h3>
                <p>{new Date(contract.expiresAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Contract Value</h3>
                <p className="text-xl font-semibold">${contract.value.toLocaleString()}</p>
              </div>
              <Separator />
              <div className="pt-2">
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Contract Document
                </Button>
              </div>
              {contract.status === 'signed' && (
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Signed Contract
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{contract.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Agent Information */}
                <div className="space-y-4">
                  <h3 className="font-medium">Agent Information</h3>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {agent?.name.substring(0, 2).toUpperCase() || 'AG'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{agent?.name}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        <span>{agent?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Vendor Information */}
                <div className="space-y-4">
                  <h3 className="font-medium">Vendor Information</h3>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {vendor?.name.substring(0, 2).toUpperCase() || 'VE'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{vendor?.name}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        <span>{vendor?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-muted-foreground">
                  {contract.notes || 'No additional notes provided for this contract.'}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {contract.status === 'draft' && (
                <>
                  <Button variant="outline" onClick={() => handleStatusUpdate('cancelled')} disabled={isLoading}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Contract
                  </Button>
                  <Button onClick={() => handleStatusUpdate('sent')} disabled={isLoading}>
                    <Send className="mr-2 h-4 w-4" />
                    Send to Vendor
                  </Button>
                </>
              )}
              {contract.status === 'sent' && (
                <Button 
                  variant="outline" 
                  className="ml-auto"
                  onClick={() => toast.success('Reminder sent to vendor')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reminder
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ContractDetails;
