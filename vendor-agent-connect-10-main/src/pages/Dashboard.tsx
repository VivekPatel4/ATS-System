import { useState, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Briefcase, MapPin, Calendar, ClipboardCheck } from "lucide-react";
import { adminApi } from "@/api/adminApi";
import vendorApi from '@/api/vendorApi';
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  totalVendors: number;
  totalAgents: number;
  totalServices: number;
  activeCities: string[];
  serviceTypes: string[];
  recentAssignments: any[];
}

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

const AdminDashboardContent = ({ stats }: { stats: DashboardStats }) => {
  return (
    <>
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Completed: {stats.completedAssignments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
            <p className="text-xs text-muted-foreground">Registered vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">Registered agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">Available services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cities</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCities.length}</div>
            <p className="text-xs text-muted-foreground">Cities with assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Active Cities</CardTitle>
            <CardDescription>Cities with property assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.activeCities.map(city => (
                <div key={city} className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{city}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Service Types</CardTitle>
            <CardDescription>Available service categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.serviceTypes.map(type => (
                <div key={type} className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
          <CardDescription>Latest property assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentAssignments.map(assignment => (
              <div key={assignment.propertyID} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-medium">{assignment.address}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{assignment.city}, {assignment.state}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{assignment.vendor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(assignment.assignedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const VendorDashboardContent = ({ properties }: { properties: AssignedProperty[] }) => {
  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">Assigned properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cities</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(properties.map(p => p.city)).size}
            </div>
            <p className="text-xs text-muted-foreground">Cities with properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Types</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(properties.map(p => p.serviceType)).size}
            </div>
            <p className="text-xs text-muted-foreground">Different services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(properties.map(p => p.agent.agentID)).size}
            </div>
            <p className="text-xs text-muted-foreground">Working with you</p>
          </CardContent>
        </Card>
      </div>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Properties</CardTitle>
          <CardDescription>List of all properties assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
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
              {properties.map((property) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

const DashboardContent = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<DashboardStats>({
    totalAssignments: 0,
    completedAssignments: 0,
    totalVendors: 0,
    totalAgents: 0,
    totalServices: 0,
    activeCities: [],
    serviceTypes: [],
    recentAssignments: []
  });
  const [vendorProperties, setVendorProperties] = useState<AssignedProperty[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (user?.role === 'admin') {
        const response = await adminApi.getDashboardStats();
        if (response.data) {
          setAdminStats(response.data);
        }
      } else if (user?.role === 'vendor') {
        const data = await vendorApi.getAssignedProperties();
        setVendorProperties(data);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || (user?.role === 'admin' ? 'Admin' : 'Vendor')}
        </p>
      </div>

      {user?.role === 'admin' ? (
        <AdminDashboardContent stats={adminStats} />
      ) : (
        <VendorDashboardContent properties={vendorProperties} />
      )}
    </div>
  );
};

const Dashboard = () => {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  );
};

export default Dashboard;