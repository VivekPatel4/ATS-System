import { Agent, Contract, User, Vendor } from '@/types';

export const sampleUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
  },
  {
    id: '3',
    name: 'Vendor Jones',
    email: 'vendor@example.com',
    role: 'vendor',
    avatar: 'https://ui-avatars.com/api/?name=Vendor+Jones&background=059669&color=fff',
  },
  {
    id: '4',
    name: 'Acme Supplies',
    email: 'contact@acmesupplies.com',
    role: 'vendor',
    avatar: 'https://ui-avatars.com/api/?name=Acme+Supplies&background=059669&color=fff',
  },
  {
    id: '5',
    name: 'Tech Solutions Inc',
    email: 'info@techsolutions.com',
    role: 'vendor',
    avatar: 'https://ui-avatars.com/api/?name=Tech+Solutions&background=059669&color=fff',
  },
];

export const sampleAgents: Agent[] = [
  {
    id: '1',
    name: 'Agent Smith',
    email: 'agent.smith@example.com',
    phone: '(555) 123-4567',
    status: 'active',
    contractsCount: 12,
    region: 'North',
    joinDate: '2022-05-15',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '(555) 987-6543',
    status: 'active',
    contractsCount: 8,
    region: 'South',
    joinDate: '2022-07-22',
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    phone: '(555) 456-7890',
    status: 'inactive',
    contractsCount: 5,
    region: 'East',
    joinDate: '2023-01-10',
  },
  {
    id: '4',
    name: 'Jessica Lopez',
    email: 'j.lopez@example.com',
    phone: '(555) 234-5678',
    status: 'active',
    contractsCount: 15,
    region: 'West',
    joinDate: '2021-11-03',
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'd.wilson@example.com',
    phone: '(555) 876-5432',
    status: 'active',
    contractsCount: 10,
    region: 'Central',
    joinDate: '2022-09-14',
  },
];

export const sampleVendors: Vendor[] = [
  {
    id: '1',
    name: 'Acme Supplies',
    email: 'contact@acmesupplies.com',
    phone: '(555) 111-2222',
    status: 'active',
    type: 'Supplies',
    location: 'Chicago, IL',
    joinDate: '2022-03-10',
  },
  {
    id: '2',
    name: 'Tech Solutions Inc',
    email: 'info@techsolutions.com',
    phone: '(555) 333-4444',
    status: 'active',
    type: 'Technology',
    location: 'San Francisco, CA',
    joinDate: '2022-06-05',
  },
  {
    id: '3',
    name: 'Global Logistics',
    email: 'support@globallogistics.com',
    phone: '(555) 555-6666',
    status: 'inactive',
    type: 'Logistics',
    location: 'Atlanta, GA',
    joinDate: '2021-12-15',
  },
  {
    id: '4',
    name: 'Quality Services LLC',
    email: 'hello@qualityservices.com',
    phone: '(555) 777-8888',
    status: 'active',
    type: 'Services',
    location: 'Denver, CO',
    joinDate: '2023-02-20',
  },
  {
    id: '5',
    name: 'Innovative Products',
    email: 'sales@innovativeproducts.com',
    phone: '(555) 999-0000',
    status: 'active',
    type: 'Products',
    location: 'Austin, TX',
    joinDate: '2022-08-01',
  },
];

export const sampleContracts: Contract[] = [
  {
    id: '1',
    title: 'Annual Supply Agreement',
    agentId: '1',
    agentName: 'Agent Smith',
    vendorId: '1',
    vendorName: 'Acme Supplies',
    status: 'signed',
    createdAt: '2023-01-15',
    expiresAt: '2024-01-15',
    value: 75000,
    document: 'https://example.com/contract-1',
    notes: 'Renewed from previous agreement with 5% increase',
  },
  {
    id: '2',
    title: 'Software Licensing Agreement',
    agentId: '1',
    agentName: 'Agent Smith',
    vendorId: '2',
    vendorName: 'Tech Solutions Inc',
    status: 'sent',
    createdAt: '2023-03-10',
    expiresAt: '2024-03-10',
    value: 120000,
    document: 'https://example.com/contract-2',
  },
  {
    id: '3',
    title: 'Logistics Services Contract',
    agentId: '2',
    agentName: 'Sarah Johnson',
    vendorId: '3',
    vendorName: 'Global Logistics',
    status: 'draft',
    createdAt: '2023-04-22',
    expiresAt: '2023-10-22',
    value: 45000,
    document: 'https://example.com/contract-3',
    notes: 'Pending legal review',
  },
  {
    id: '4',
    title: 'Maintenance Services Agreement',
    agentId: '4',
    agentName: 'Jessica Lopez',
    vendorId: '4',
    vendorName: 'Quality Services LLC',
    status: 'signed',
    createdAt: '2023-02-05',
    expiresAt: '2024-02-05',
    value: 55000,
    document: 'https://example.com/contract-4',
  },
  {
    id: '5',
    title: 'Product Distribution Agreement',
    agentId: '5',
    agentName: 'David Wilson',
    vendorId: '5',
    vendorName: 'Innovative Products',
    status: 'expired',
    createdAt: '2022-07-15',
    expiresAt: '2023-01-15',
    value: 95000,
    document: 'https://example.com/contract-5',
    notes: 'Renewal discussion in progress',
  },
  {
    id: '6',
    title: 'Special Project Contract',
    agentId: '1',
    agentName: 'Agent Smith',
    vendorId: '4',
    vendorName: 'Quality Services LLC',
    status: 'signed',
    createdAt: '2023-05-20',
    expiresAt: '2023-11-20',
    value: 30000,
    document: 'https://example.com/contract-6',
  },
  {
    id: '7',
    title: 'Consulting Services Agreement',
    agentId: '2',
    agentName: 'Sarah Johnson',
    vendorId: '2',
    vendorName: 'Tech Solutions Inc',
    status: 'cancelled',
    createdAt: '2023-03-01',
    expiresAt: '2024-03-01',
    value: 65000,
    document: 'https://example.com/contract-7',
    notes: 'Cancelled due to budget constraints',
  },
];

export const getAgentContracts = (agentId: string): Contract[] => {
  return sampleContracts.filter(contract => contract.agentId === agentId);
};

export const getAgentById = (agentId: string): Agent | undefined => {
  return sampleAgents.find(agent => agent.id === agentId);
};

export const getVendorById = (vendorId: string): Vendor | undefined => {
  return sampleVendors.find(vendor => vendor.id === vendorId);
};

export const loginUser = (email: string, password: string): User | null => {
  return sampleUsers.find(user => user.email === email) || null;
};
