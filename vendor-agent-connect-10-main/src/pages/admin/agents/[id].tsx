import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Agent } from '@/types';
import { ArrowLeft, Calendar, Mail, MapPin, Phone } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { adminApi } from '@/api/adminApi';
import { toast } from 'sonner';

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAgent = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const agentData = await adminApi.getAgentDetails(id);
        setAgent(agentData);
      } catch (error) {
        console.error('Failed to load agent:', error);
        toast.error('Failed to load agent details');
        setAgent(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgent();
  }, [id]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!agent) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/agents')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Agent Not Found</h1>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">The agent you're looking for doesn't exist or has been deleted.</p>
              <Button onClick={() => navigate('/admin/agents')}>
                Return to Agents List
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/agents')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Agent Details</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarFallback className="text-2xl">
                  {agent.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{agent.name}</CardTitle>
              <StatusBadge status={agent.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{agent.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{agent.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{agent.region}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(agent.joinDate)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Address</h3>
                <p className="text-sm text-muted-foreground">
                  {agent.address || 'No address provided'}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium">Orders</h3>
                <p className="text-2xl font-bold">{agent.contractsCount}</p>
                <p className="text-sm text-muted-foreground">Total orders managed by this agent</p>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button variant="outline" onClick={() => navigate(`/admin/agents/edit/${agent.id}`)}>
                  Edit Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AgentDetails;
