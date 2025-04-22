
import { Button } from '@/components/ui/button';
import { Agent } from '@/types';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AgentActionsProps {
  agent: Agent;
  onDelete: (agent: Agent) => void;
}

export const AgentActions = ({ agent, onDelete }: AgentActionsProps) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    onDelete(agent);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex space-x-2 justify-end">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(`/admin/agents/${agent.id}`)}
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(`/admin/agents/edit/${agent.id}`)}
          title="Edit Agent"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleOpenDeleteDialog}
          title="Delete Agent"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {agent.name} from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
