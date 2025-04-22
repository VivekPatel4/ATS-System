
import { Button } from '@/components/ui/button';
import { Contract } from '@/types';
import { Eye, FileText, XCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContractActionsProps {
  contract: Contract;
  onStatusUpdate: (contract: Contract) => void;
}

export const ContractActions = ({ contract, onStatusUpdate }: ContractActionsProps) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate(`/vendor/contracts/${contract.id}`);
  };
  
  const handleApprove = () => {
    const updatedContract = { ...contract, status: 'signed' as const };
    onStatusUpdate(updatedContract);
  };
  
  const handleReject = () => {
    const updatedContract = { ...contract, status: 'cancelled' as const };
    onStatusUpdate(updatedContract);
  };
  
  return (
    <div className="flex space-x-2 justify-end">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleViewDetails}
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      {contract.status === 'sent' && (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-green-500 hover:text-green-600 hover:bg-green-50" 
            onClick={handleApprove}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-500 hover:text-red-600 hover:bg-red-50" 
            onClick={handleReject}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </>
      )}
      
      {contract.status === 'signed' && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => window.open(`/contracts/${contract.document}`, '_blank')}
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
