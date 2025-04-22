import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Agent } from '@/types';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { AgentColumns } from './AgentColumns';
import { AgentActions } from './AgentActions';
import { AddAgentDialog } from './AddAgentDialog';
import { adminApi } from '@/api/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Agents = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Fetch agents using React Query
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await adminApi.getAgents();
      return response.data;
    },
    enabled: !!user && !authLoading
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      await adminApi.deleteAgent(agentId);
    },
    onSuccess: () => {
      // Invalidate and refetch agents query
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent has been removed');
    },
    onError: (error: any) => {
      console.error('Failed to delete agent:', error);
      if (error?.response?.status !== 401) {
        toast.error('Failed to delete agent');
      }
    }
  });

  // Add agent mutation
  const addAgentMutation = useMutation({
    mutationFn: async (agentData: Omit<Agent, 'id' | 'contractsCount' | 'joinDate'> & { password: string }) => {
      await adminApi.addAgent(agentData);
    },
    onSuccess: () => {
      // Invalidate and refetch agents query
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent has been added successfully');
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('Failed to add agent:', error);
      if (error?.response?.status !== 401) {
        toast.error('Failed to add agent');
      }
    }
  });

  const handleDelete = async (agent: Agent) => {
    deleteAgentMutation.mutate(agent.id);
  };

  const handleAddAgent = async (agentData: Omit<Agent, 'id' | 'contractsCount' | 'joinDate'> & { password: string }) => {
    addAgentMutation.mutate(agentData);
  };

  const isLoading = isLoadingAgents || authLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </div>

        <DataTable 
          columns={AgentColumns} 
          data={agents} 
          isLoading={isLoading}
          actions={(agent) => <AgentActions agent={agent} onDelete={handleDelete} />}
        />

        <AddAgentDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddAgent={handleAddAgent}
        />
      </div>
    </AppLayout>
  );
};

export default Agents;