
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

// Generate a random ID (for demo purposes)
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Send email (mock function)
export async function sendContractEmail(email: string, contractId: string, contractTitle: string): Promise<boolean> {
  console.log(`Sending contract ${contractId}: ${contractTitle} to ${email}`);
  // In a real application, this would call an API to send an email
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
}

// Get contract status color
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'signed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'expired':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'inactive':
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
