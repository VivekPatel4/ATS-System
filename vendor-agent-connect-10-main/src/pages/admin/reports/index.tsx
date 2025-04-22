
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sampleContracts, sampleAgents, sampleVendors } from "@/data/sampleData";
import { BarChart, FileText, Download, Calendar, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminReports = () => {
  // Calculate summary statistics
  const totalValue = sampleContracts.reduce((sum, contract) => sum + contract.value, 0);
  const avgContractValue = totalValue / sampleContracts.length || 0;
  
  // Generate data for the charts
  const statusData = [
    { name: 'Signed', value: sampleContracts.filter(c => c.status === 'signed').length },
    { name: 'Draft', value: sampleContracts.filter(c => c.status === 'draft').length },
    { name: 'Sent', value: sampleContracts.filter(c => c.status === 'sent').length },
    { name: 'Expired', value: sampleContracts.filter(c => c.status === 'expired').length },
    { name: 'Cancelled', value: sampleContracts.filter(c => c.status === 'cancelled').length },
  ];
  
  // Create monthly contract data (simplified for demo)
  const monthlyData = [
    { name: 'Jan', value: 5 },
    { name: 'Feb', value: 8 },
    { name: 'Mar', value: 12 },
    { name: 'Apr', value: 7 },
    { name: 'May', value: 15 },
    { name: 'Jun', value: 10 },
    { name: 'Jul', value: 9 },
    { name: 'Aug', value: 11 },
    { name: 'Sep', value: 13 },
    { name: 'Oct', value: 7 },
    { name: 'Nov', value: 5 },
    { name: 'Dec', value: 6 },
  ];
  
  // Create agent performance data
  const agentPerformance = sampleAgents.map(agent => ({
    name: agent.name.split(' ')[0], // Just use first name to keep chart clean
    contracts: agent.contractsCount,
  }));
  
  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Analytics and reporting dashboard</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Reports
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{sampleContracts.length}</CardTitle>
              <CardDescription>Total Contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground flex justify-between">
                <span>This year:</span>
                <span className="font-medium">{sampleContracts.length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{formatCurrency(totalValue)}</CardTitle>
              <CardDescription>Total Contract Value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground flex justify-between">
                <span>Avg. contract:</span>
                <span className="font-medium">{formatCurrency(avgContractValue)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{sampleAgents.length}</CardTitle>
              <CardDescription>Total Agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground flex justify-between">
                <span>Active:</span>
                <span className="font-medium">
                  {sampleAgents.filter(a => a.status === 'active').length}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{sampleVendors.length}</CardTitle>
              <CardDescription>Total Vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground flex justify-between">
                <span>Active:</span>
                <span className="font-medium">
                  {sampleVendors.filter(v => v.status === 'active').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Activity</CardTitle>
                <CardDescription>Monthly contract creation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Contracts" fill="#3b82f6" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Status Breakdown</CardTitle>
                  <CardDescription>Distribution by current status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Contracts" fill="#6366f1" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Agent Performance</CardTitle>
                  <CardDescription>Contracts by agent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={agentPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="contracts" name="Contracts" fill="#10b981" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Contract Report</CardTitle>
                  <CardDescription>Detailed contract analytics</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-4">
                    <FileText className="h-16 w-16 mx-auto opacity-50" />
                    <div>
                      <p>Contract reports would be displayed here</p>
                      <p className="text-sm mt-1">Showing detailed contract metrics and trends</p>
                    </div>
                    <Button variant="outline">View Sample Report</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Agent Analytics</CardTitle>
                  <CardDescription>Performance metrics for agents</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-4">
                    <BarChart className="h-16 w-16 mx-auto opacity-50" />
                    <div>
                      <p>Agent performance metrics would be displayed here</p>
                      <p className="text-sm mt-1">Showing detailed analytics on agent performance</p>
                    </div>
                    <Button variant="outline">View Sample Analytics</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vendors" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Vendor Analysis</CardTitle>
                  <CardDescription>Vendor relationship metrics</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-4">
                    <BarChart className="h-16 w-16 mx-auto opacity-50" />
                    <div>
                      <p>Vendor metrics would be displayed here</p>
                      <p className="text-sm mt-1">Showing detailed analytics on vendor relationships</p>
                    </div>
                    <Button variant="outline">View Sample Analysis</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminReports;
