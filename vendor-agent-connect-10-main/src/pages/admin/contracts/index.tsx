import { useState, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/DataTable";
import { ContractsColumns } from "./ContractsColumns";
import { ContractActions } from "./ContractActions";
import { useNavigate } from "react-router-dom";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { adminApi } from "@/api/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Eye, Pencil, Trash2, Search, Plus } from 'lucide-react';

const Contracts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    city: "",
    state: "",
    serviceType: "",
    minValue: 0,
    maxValue: 100000,
    dateRange: "all"
  });
  const queryClient = useQueryClient();

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getAssignedProperties();
      if (response.data) {
        setContracts(response.data);
      } else {
        setContracts([]);
      }
    } catch (error: any) {
      console.error('Failed to load contracts:', error);
      toast.error(error.message || 'Failed to load contracts');
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadContracts();
    }
  }, [user]);

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
      contract.ownName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      contract.ownEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = !filterOptions.city || contract.city === filterOptions.city;
    const matchesState = !filterOptions.state || contract.state === filterOptions.state;
    const matchesServiceType = !filterOptions.serviceType || contract.serviceType === filterOptions.serviceType;

    let matchesDate = true;
    const contractDate = new Date(contract.assignedAt);
    const now = new Date();
    if (filterOptions.dateRange === "lastWeek") {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = contractDate >= lastWeek;
    } else if (filterOptions.dateRange === "lastMonth") {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = contractDate >= lastMonth;
    } else if (filterOptions.dateRange === "last3Months") {
      const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      matchesDate = contractDate >= last3Months;
    }

    return matchesSearch && matchesCity && matchesState && matchesServiceType && matchesDate;
  });

  const countActiveFilters = () => {
    let count = 0;
    if (filterOptions.city) count++;
    if (filterOptions.state) count++;
    if (filterOptions.serviceType) count++;
    if (filterOptions.minValue > 0 || filterOptions.maxValue < 100000) count++;
    if (filterOptions.dateRange !== "all") count++;
    return count;
  };

  const activeFilterCount = countActiveFilters();

  const handleResetFilters = () => {
    setFilterOptions({
      city: "",
      state: "",
      serviceType: "",
      minValue: 0,
      maxValue: 100000,
      dateRange: "all"
    });
    toast.success("Filters have been reset");
  };

  const handleDelete = async (contract: any) => {
    try {
      // Add delete API call here when available
      toast.success('Contract deleted successfully');
      await loadContracts();
    } catch (error) {
      console.error('Failed to delete contract:', error);
      toast.error('Failed to delete contract');
    }
  };

  // Update property status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      adminApi.updatePropertyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedProperties'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const handleStatusChange = (propertyId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: propertyId, status: newStatus });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
            <p className="text-muted-foreground">Manage and track all property assignments</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{contracts.length}</CardTitle>
              <CardDescription>Total Assignments</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">
                {new Set(contracts.map(c => c.serviceType)).size}
              </CardTitle>
              <CardDescription>Service Types</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">
                {new Set(contracts.map(c => c.city)).size}
              </CardTitle>
              <CardDescription>Active Cities</CardDescription>
            </CardHeader>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Assignments</CardTitle>
            <CardDescription>View and manage all property assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <Sheet>
                {/* <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>}
                  </Button>
                </SheetTrigger> */}
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filter Assignments</SheetTitle>
                    <SheetDescription>
                      Apply filters to narrow down the assignments list
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Select 
                        value={filterOptions.city} 
                        onValueChange={value => setFilterOptions({
                          ...filterOptions,
                          city: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All cities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          {Array.from(new Set(contracts.map(c => c.city))).map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select 
                        value={filterOptions.state} 
                        onValueChange={value => setFilterOptions({
                          ...filterOptions,
                          state: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All states" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          {Array.from(new Set(contracts.map(c => c.state))).map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Service Type</Label>
                      <Select 
                        value={filterOptions.serviceType} 
                        onValueChange={value => setFilterOptions({
                          ...filterOptions,
                          serviceType: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All service types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          {Array.from(new Set(contracts.map(c => c.serviceType))).map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Date Range</Label>
                      <Select 
                        value={filterOptions.dateRange} 
                        onValueChange={value => setFilterOptions({
                          ...filterOptions,
                          dateRange: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All time</SelectItem>
                          <SelectItem value="lastWeek">Last week</SelectItem>
                          <SelectItem value="lastMonth">Last month</SelectItem>
                          <SelectItem value="last3Months">Last 3 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-4" onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            <DataTable 
              columns={ContractsColumns} 
              data={filteredContracts} 
              isLoading={isLoading} 
              actions={(contract) => (
                <ContractActions 
                  contract={contract} 
                  onDelete={handleDelete}
                />
              )} 
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Contracts;
