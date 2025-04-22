import React from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Building, FileText } from "lucide-react";

const VendorDashboardContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name || 'Vendor'}</h1>
          <p className="text-muted-foreground">Manage your properties and contracts</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Properties
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View Properties</div>
            <p className="text-xs text-muted-foreground">
              Manage your assigned properties and services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contracts
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View Contracts</div>
            <p className="text-xs text-muted-foreground">
              Manage your service contracts and orders
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const VendorDashboard: React.FC = () => {
  return (
    <AppLayout>
      <VendorDashboardContent />
    </AppLayout>
  );
};

export default VendorDashboard; 