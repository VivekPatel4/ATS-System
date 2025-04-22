
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractCard } from "@/components/shared/ContractCard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContracts, updateContractStatus } from "@/api/api";
import { Contract } from "@/types";
import { ContractActions } from "./ContractActions";

const VendorContracts = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Fetch contracts for the current vendor
  const { data: vendorContracts = [], isLoading, refetch } = useQuery({
    queryKey: ['contracts', 'vendor', user.name],
    queryFn: async () => {
      // In a real app, this would use the vendor's ID
      return getContracts({ vendorName: user.name });
    }
  });
  
  // Group contracts by status
  const pendingContracts = vendorContracts.filter(c => c.status === 'sent');
  const activeContracts = vendorContracts.filter(c => c.status === 'signed');
  const expiredContracts = vendorContracts.filter(c => c.status === 'expired' || c.status === 'cancelled');
  
  const handleStatusUpdate = async (contract: Contract) => {
    try {
      await updateContractStatus(contract.id, contract.status);
      toast.success(`Contract status updated to ${contract.status}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update contract status');
    }
  };
  
  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Contracts</h1>
          <p className="text-muted-foreground">View and manage contracts from agents</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{pendingContracts.length}</CardTitle>
              <CardDescription>Pending Review</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{activeContracts.length}</CardTitle>
              <CardDescription>Active</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{expiredContracts.length}</CardTitle>
              <CardDescription>Expired/Cancelled</CardDescription>
            </CardHeader>
          </Card>
        </div>
        
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Contracts</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  Loading contracts...
                </div>
              ) : vendorContracts.length > 0 ? (
                vendorContracts.map(contract => (
                  <ContractCard 
                    key={contract.id} 
                    contract={contract}
                    onStatusUpdate={handleStatusUpdate}
                    actions={<ContractActions contract={contract} onStatusUpdate={handleStatusUpdate} />}
                  />
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  No contracts found.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  Loading contracts...
                </div>
              ) : pendingContracts.length > 0 ? (
                pendingContracts.map(contract => (
                  <ContractCard 
                    key={contract.id} 
                    contract={contract}
                    onStatusUpdate={handleStatusUpdate}
                    actions={<ContractActions contract={contract} onStatusUpdate={handleStatusUpdate} />}
                  />
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  No pending contracts found.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  Loading contracts...
                </div>
              ) : activeContracts.length > 0 ? (
                activeContracts.map(contract => (
                  <ContractCard 
                    key={contract.id} 
                    contract={contract}
                    onStatusUpdate={handleStatusUpdate}
                    actions={<ContractActions contract={contract} onStatusUpdate={handleStatusUpdate} />}
                  />
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  No active contracts found.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="expired" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  Loading contracts...
                </div>
              ) : expiredContracts.length > 0 ? (
                expiredContracts.map(contract => (
                  <ContractCard 
                    key={contract.id} 
                    contract={contract}
                    onStatusUpdate={handleStatusUpdate}
                    actions={<ContractActions contract={contract} onStatusUpdate={handleStatusUpdate} />}
                  />
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  No expired contracts found.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default VendorContracts;
