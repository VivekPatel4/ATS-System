
import { Agent, Contract, Vendor } from "@/types";
import { sampleAgents, sampleContracts, sampleVendors } from "@/data/sampleData";
import { generateId } from "@/lib/utils";

// Base delay to simulate network latency
const DELAY = 600;

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get all contracts with optional filtering
export async function getContracts(filter?: Partial<Contract>): Promise<Contract[]> {
  await delay(DELAY);
  
  let filteredContracts = [...sampleContracts];
  
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredContracts = filteredContracts.filter(contract => 
          contract[key as keyof Contract] === value
        );
      }
    });
  }
  
  return filteredContracts;
}

// Get a single contract by ID
export async function getContractById(id: string): Promise<Contract | null> {
  await delay(DELAY);
  return sampleContracts.find(contract => contract.id === id) || null;
}

// Create a new contract
export async function createContract(contract: Omit<Contract, 'id'>): Promise<Contract> {
  await delay(DELAY);
  const newContract = {
    ...contract, 
    id: generateId()
  };
  sampleContracts.push(newContract);
  return newContract;
}

// Update an existing contract
export async function updateContract(id: string, updates: Partial<Contract>): Promise<Contract | null> {
  await delay(DELAY);
  const index = sampleContracts.findIndex(contract => contract.id === id);
  
  if (index === -1) return null;
  
  const updatedContract = {
    ...sampleContracts[index],
    ...updates
  };
  
  sampleContracts[index] = updatedContract;
  return updatedContract;
}

// Delete a contract
export async function deleteContract(id: string): Promise<boolean> {
  await delay(DELAY);
  const index = sampleContracts.findIndex(contract => contract.id === id);
  
  if (index === -1) return false;
  
  sampleContracts.splice(index, 1);
  return true;
}

// Get all vendors with optional filtering
export async function getVendors(filter?: Partial<Vendor>): Promise<Vendor[]> {
  await delay(DELAY);
  
  let filteredVendors = [...sampleVendors];
  
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredVendors = filteredVendors.filter(vendor => 
          vendor[key as keyof Vendor] === value
        );
      }
    });
  }
  
  return filteredVendors;
}

// Get a single vendor by ID
export async function getVendorById(id: string): Promise<Vendor | null> {
  await delay(DELAY);
  return sampleVendors.find(vendor => vendor.id === id) || null;
}

// Get all agents with optional filtering
export async function getAgents(filter?: Partial<Agent>): Promise<Agent[]> {
  await delay(DELAY);
  
  let filteredAgents = [...sampleAgents];
  
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredAgents = filteredAgents.filter(agent => 
          agent[key as keyof Agent] === value
        );
      }
    });
  }
  
  return filteredAgents;
}

// Get a single agent by ID
export async function getAgentById(id: string): Promise<Agent | null> {
  await delay(DELAY);
  return sampleAgents.find(agent => agent.id === id) || null;
}

// Update contract status
export async function updateContractStatus(
  id: string, 
  status: Contract['status']
): Promise<Contract | null> {
  await delay(DELAY);
  return updateContract(id, { status });
}
