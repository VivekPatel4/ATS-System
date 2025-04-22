import axios from 'axios';
import { API_BASE_URL } from '../config';

interface Agent {
  agentID: number;
  name: string;
  email: string;
}

interface AssignedProperty {
  propertyID: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  ownName: string;
  ownEmail: string;
  assignedAt: string;
  serviceType: string;
  agent: Agent;
}

const vendorApi = {
  getAssignedProperties: async (): Promise<AssignedProperty[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/assigned-properties`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned properties');
    }
  }
};

export default vendorApi; 