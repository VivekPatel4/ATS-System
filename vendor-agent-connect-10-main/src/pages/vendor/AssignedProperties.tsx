import React, { useEffect, useState } from 'react';
import vendorApi from '@/api/vendorApi';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { format } from 'date-fns';

interface Agent {
  agentID: number;
  name: string;
  email: string;
}

interface AssignedProperty {
  propertyID: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  ownName: string;
  ownEmail: string;
  assignedAt: string;
  serviceType: string;
  agent: Agent;
}

const AssignedPropertiesContent: React.FC = () => {
  const [properties, setProperties] = useState<AssignedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssignedProperties();
  }, []);

  const fetchAssignedProperties = async () => {
    try {
      const data = await vendorApi.getAssignedProperties();
      setProperties(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch assigned properties');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assigned Properties</h1>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property ID</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Assigned Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No properties assigned</TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.propertyID}>
                  <TableCell>{property.propertyID}</TableCell>
                  <TableCell>
                    <div>
                      <div>{property.address}</div>
                      <div className="text-sm text-muted-foreground">
                        {property.city}, {property.state} {property.pincode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{property.ownName}</div>
                      <div className="text-sm text-muted-foreground">{property.ownEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{property.serviceType}</TableCell>
                  <TableCell>
                    <div>
                      <div>{property.agent.name}</div>
                      <div className="text-sm text-muted-foreground">{property.agent.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(property.assignedAt), 'MMM dd, yyyy')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const AssignedProperties: React.FC = () => {
  return (
    <AppLayout>
      <AssignedPropertiesContent />
    </AppLayout>
  );
};

export default AssignedProperties; 