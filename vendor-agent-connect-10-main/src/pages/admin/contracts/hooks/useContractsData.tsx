
import { useState, useEffect } from 'react';
import { Contract, Agent, Vendor } from '@/types';
import { toast } from 'sonner';

export const useContractsData = () => {
  const [orders, setOrders] = useState<Contract[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // This is where you would fetch data from your database
    // For now, we're just initializing with empty arrays
    setIsLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      setOrders([]);
      setAgents([]);
      setVendors([]);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDeleteContract = (contract: Contract) => {
    // This would be an API call in a real application
    setOrders(orders.filter(c => c.id !== contract.id));
    toast.success(`Order "${contract.title}" has been deleted`);
  };

  return {
    contracts: orders,
    agents,
    vendors,
    isLoading,
    handleDeleteContract
  };
};
