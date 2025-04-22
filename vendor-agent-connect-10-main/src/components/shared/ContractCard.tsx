
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Contract } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Eye, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ContractCardProps {
  contract: Contract;
  onSendEmail?: (contract: Contract) => void;
  onStatusUpdate?: (contract: Contract) => void;
  isLoading?: boolean;
  actions?: React.ReactNode;
}

export function ContractCard({ contract, onSendEmail, onStatusUpdate, isLoading, actions }: ContractCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group">
      <div className="h-2 bg-gradient-to-r from-primary to-blue-400"></div>
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-base font-medium line-clamp-1">{contract.title}</CardTitle>
        <StatusBadge status={contract.status} />
      </CardHeader>
      
      {/* Keep the existing card content section */}
      <CardContent className="p-4 pt-2 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vendor:</span>
            <span className="font-medium">{contract.vendorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Agent:</span>
            <span className="font-medium">{contract.agentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-medium">{formatCurrency(contract.value)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDate(contract.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expires:</span>
            <span>{formatDate(contract.expiresAt)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {actions ? (
          actions
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/contracts/${contract.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" /> View
            </Button>
            
            {/* Only show update status button for vendors */}
            {user?.role === 'vendor' && onStatusUpdate && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => onStatusUpdate(contract)}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> {isLoading ? 'Updating...' : 'Update Status'}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
