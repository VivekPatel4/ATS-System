import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi } from "@/api/adminApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Contract {
  propertyID: number;
  ownName: string;
  ownEmail: string;
  city: string;
  serviceType: string;
  assignedAt: string;
  vendor: { name: string };
  agent: { name: string };
  status: string;
}

export const ContractsColumns: ColumnDef<Contract>[] = [
  {
    accessorKey: "propertyID",
    header: "Property ID",
  },
  {
    accessorKey: "ownName",
    header: "Owner",
  },
  {
    accessorKey: "ownEmail",
    header: "Email",
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "serviceType",
    header: "Service Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.serviceType}
      </Badge>
    ),
  },
  {
    accessorKey: "assignedAt",
    header: "Assigned",
    cell: ({ row }) => format(new Date(row.original.assignedAt), "MMM d, yyyy"),
  },
  {
    accessorKey: "vendor",
    header: "Vendor",
    cell: ({ row }) => row.original.vendor.name,
  },
  {
    accessorKey: "agent",
    header: "Agent",
    cell: ({ row }) => row.original.agent.name,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const handleStatusChange = async (newStatus: string) => {
        try {
          await adminApi.updatePropertyStatus(row.original.propertyID, newStatus);
          toast.success("Status updated successfully");
          row.original.status = newStatus;
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to update status");
        }
      };

      const getStatusColor = (status: string) => {
        switch (status) {
          case "Cancelled":
            return "text-red-500";
          case "Invoiced":
            return "text-yellow-500";
          case "Paid":
            return "text-green-500";
          default:
            return "text-gray-500";
        }
      };

      return (
        <Select
          defaultValue={row.original.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className={cn("w-[120px]", getStatusColor(row.original.status))}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Invoiced">Invoiced</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
];
