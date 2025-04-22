
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { sampleAgents, sampleContracts } from "@/data/sampleData";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export default function VendorAgents() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get agents who have contracts with this vendor
  const vendorContracts = sampleContracts.filter(
    contract => 
      contract.vendorName.toLowerCase() === user?.name.toLowerCase() || 
      contract.vendorId === user?.id
  );
  
  const agentIds = [...new Set(vendorContracts.map(contract => contract.agentId))];
  const connectedAgents = sampleAgents.filter(agent => agentIds.includes(agent.id));
  
  const filteredAgents = searchQuery
    ? connectedAgents.filter(
        agent =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : connectedAgents;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Connected Agents</h1>
        <p className="text-muted-foreground">Agents you work with</p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search agents by name, email or region..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredAgents.length > 0 ? (
          filteredAgents.map((agent) => (
            <Card key={agent.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${agent.name}&background=2563EB&color=fff`} />
                    <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription className="text-sm">{agent.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={agent.status === 'active' ? "default" : "secondary"} className="mt-1">
                      {agent.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Region</p>
                    <p className="font-medium">{agent.region}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{agent.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contracts</p>
                    <p className="font-medium">{agent.contractsCount}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/40 px-6 py-3">
                <Button variant="outline" className="w-full" onClick={() => window.open(`mailto:${agent.email}`)}>
                  Contact Agent
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Connected Agents</CardTitle>
              <CardDescription>
                You are not currently working with any agents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Once agents create contracts with you, they will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
