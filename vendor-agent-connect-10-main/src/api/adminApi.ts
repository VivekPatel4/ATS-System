import axios from 'axios';
import { Agent } from '@/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const API_BASE_URL = 'https://localhost:7226';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if token is missing or invalid
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle 400 errors
    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Invalid request data';
      throw new Error(message);
    }
    
    return Promise.reject(error);
  }
);

// Transform API response to match our Agent type
const transformAgentResponse = (apiAgent: any): Agent => {
  if (!apiAgent) {
    throw new Error('Invalid agent data received from server');
  }
  
  return {
    id: apiAgent.agentID?.toString() || apiAgent.agentId?.toString() || '',
    name: apiAgent.name || '',
    email: apiAgent.email || '',
    phone: apiAgent.phone || '',
    status: apiAgent.status || 'active',
    contractsCount: apiAgent.contractsCount || 0,
    region: apiAgent.region || '',
    joinDate: apiAgent.createdAt || new Date().toISOString(),
    address: apiAgent.address || ''
  };
};

// Transform API response to match our types
const transformVendorResponse = (apiVendor: any) => ({
  id: apiVendor.vendorID?.toString() || '',
  name: apiVendor.name || '',
  email: apiVendor.email || '',
  services: apiVendor.services?.map((s: any) => ({
    id: s.serviceID,
    type: s.serviceType,
    description: s.description
  })) || [],
  createdAt: apiVendor.createdAt || new Date().toISOString()
});

export const adminApi = {
  // Get all agents
  getAgents: async (): Promise<{ data: Agent[] }> => {
    const response = await api.get('/api/admin/soft-agents');
    return {
      data: Array.isArray(response.data.data) 
        ? response.data.data.map(transformAgentResponse)
        : []
    };
  },

  // Add a new agent
  addAgent: async (agentData: Omit<Agent, 'id' | 'contractsCount' | 'joinDate'> & { password: string }): Promise<Agent> => {
    try {
      const response = await api.post('/api/admin/add-agent', {
        name: agentData.name,
        email: agentData.email,
        password: agentData.password,
        phone: agentData.phone || '',
        region: agentData.region || '',
        address: agentData.address || ''
      });

      // Check for success message from the API
      if (response.status === 200 && response.data.message === "Agent added & invitation sent.") {
        // Since the API doesn't return agentId in the response, we need to fetch the agent by email
        const agentsResponse = await adminApi.getAgents();
        const newAgent = agentsResponse.data.find(agent => agent.email === agentData.email);
        if (newAgent) {
          return newAgent;
        }
      }

      throw new Error(response.data?.message || 'Failed to add agent: Invalid response from server');
    } catch (error: any) {
      console.error('Add agent error:', error);
      // If the error has a response with a message, use that
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // If it's a network error or other type of error
      throw new Error(error.message || 'Failed to add agent');
    }
  },

  // Delete an agent
  deleteAgent: async (agentId: string): Promise<void> => {
    try {
      const response = await api.delete(`/api/admin/soft-delete-agent/${agentId}`);
      // Check if the response indicates success (either through message or status)
      if (response.status === 200 || response.data?.message?.includes('success')) {
        return response.data;
      }
      throw new Error(response.data?.message || 'Failed to delete agent');
    } catch (error: any) {
      console.error('Delete agent error:', error);
      // If the error has a response with a message, use that
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // If it's a network error or other type of error
      throw new Error(error.message || 'Failed to delete agent');
    }
  },

  // Get agent details
  getAgentDetails: async (agentId: string): Promise<Agent> => {
    try {
      const response = await api.get(`/api/admin/agent/${agentId}`);
      if (!response.data.data) {
        throw new Error('Agent not found');
      }
      return transformAgentResponse(response.data.data);
    } catch (error) {
      console.error('Get agent details error:', error);
      throw error;
    }
  },

  // Update agent
  updateAgent: async (agentId: string, agentData: Partial<Agent>): Promise<Agent> => {
    try {
      const response = await api.put(`/api/admin/edit-agent/${agentId}`, {
        name: agentData.name || '',
        email: agentData.email || ''
      });
      
      if (response.data.message === "Agent updated successfully.") {
        // Get the updated agent details after successful update
        return await adminApi.getAgentDetails(agentId);
      }
      
      throw new Error('Failed to update agent: Invalid response from server');
    } catch (error) {
      console.error('Update agent error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Get all vendors
  getVendors: async () => {
    try {
      const response = await api.get('/api/admin/soft-vendors');
      const vendors = Array.isArray(response.data) ? response.data : 
                     Array.isArray(response.data.data) ? response.data.data : [];
      return {
        data: vendors.map(transformVendorResponse)
      };
    } catch (error) {
      console.error('Get vendors error:', error);
      throw error;
    }
  },

  // Add a new vendor
  addVendor: async (vendorData: { name: string; email: string; password: string; serviceIds: number[] }) => {
    const response = await api.post('/api/admin/add-vendor', {
      name: vendorData.name,
      email: vendorData.email,
      passwordHash: vendorData.password,
      serviceIds: vendorData.serviceIds
    });
    return response.data;
  },

  // Get vendor details
  getVendorDetails: async (vendorId: string) => {
    const response = await api.get(`/api/admin/vendor/${vendorId}`);
    return transformVendorResponse(response.data.data);
  },

  // Update vendor
  updateVendor: async (vendorId: string, vendorData: { name: string; email: string; serviceIds: number[] }) => {
    try {
      const response = await api.put(`/api/admin/edit-vendor/${vendorId}`, {
        name: vendorData.name,
        email: vendorData.email,
        serviceIds: vendorData.serviceIds
      });
      return response.data;
    } catch (error) {
      console.error('Update vendor error:', error);
      throw error;
    }
  },

  // Delete vendor
  deleteVendor: async (vendorId: string) => {
    try {
      const response = await api.delete(`/api/admin/soft-delete-vendor/${vendorId}`);
      // Check if the response indicates success (either through message or status)
      if (response.status === 200 || response.data?.message?.includes('success')) {
        return response.data;
      }
      throw new Error(response.data?.message || 'Failed to delete vendor');
    } catch (error: any) {
      console.error('Delete vendor error:', error);
      // If the error has a response with a message, use that
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // If it's a network error or other type of error
      throw new Error(error.message || 'Failed to delete vendor');
    }
  },

  // Get all services
  getServices: async () => {
    try {
      const response = await api.get('/api/admin/services');
      return response.data.map((service: any) => ({
        id: service.serviceID,
        type: service.serviceType,
        description: service.description,
        createdAt: service.createdAt
      }));
    } catch (error) {
      console.error('Get services error:', error);
      throw error;
    }
  },

  // Add a new service
  addService: async (serviceData: { serviceType: string; description: string }) => {
    try {
      const response = await api.post('/api/admin/add-service', {
        serviceType: serviceData.serviceType,
        description: serviceData.description
      });
      
      if (response.data.message === "Service added successfully.") {
        return {
          id: response.data.serviceId,
          type: response.data.serviceType,
          description: serviceData.description
        };
      }
      
      throw new Error('Failed to add service: Invalid response from server');
    } catch (error) {
      console.error('Add service error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Delete service
  deleteService: async (serviceId: string) => {
    try {
      const response = await api.delete(`/api/admin/delete-service/${serviceId}`);
      if (response.data.message !== "Service deleted successfully.") {
        throw new Error('Failed to delete service');
      }
      return response.data;
    } catch (error) {
      console.error('Delete service error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async getAssignedProperties() {
    try {
      const response = await api.get('/api/admin/all-assigned-properties');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch assigned properties');
      }
      throw new Error('Failed to fetch assigned properties');
    }
  },

  async getDashboardStats() {
    try {
      const response = await api.get('/api/admin/dashboard-stats');
      return { data: response.data.data };
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch dashboard stats');
      }
      throw new Error('Failed to fetch dashboard stats');
    }
  },

  // Add this function to adminApi.ts
  async registerAdmin(adminData: { 
    adminID: number;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: string;
  }): Promise<any> {
    try {
      const response = await api.post('/api/admin/register', adminData);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to register admin');
      }
      throw new Error('Failed to register admin');
    }
  },

  // Fetch all admins
  async getAllAdmins(): Promise<any[]> {
    try {
      const response = await api.get('/api/admin/admins');
      return response.data.data; // Adjust based on your API response structure
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admins');
    }
  },

  // Fetch a single admin by ID
  async getAdminById(adminId: number): Promise<any> {
    try {
      const response = await api.get(`/api/admin/admin/${adminId}`);
      return response.data.data; // Adjust based on your API response structure
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin');
    }
  },

  // Delete an admin by ID
  async deleteAdmin(adminId: number): Promise<void> {
    try {
      await api.delete(`/api/admin/admin/${adminId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete admin');
    }
  },

  updatePropertyStatus: async (propertyId: number, status: string) => {
    const response = await api.put(`/api/admin/update-property-status/${propertyId}`, { status });
    return response;
  },

};

const queryClient = new QueryClient();

export { queryClient }; 