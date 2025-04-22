import { Column } from "@/types";
import { format } from "date-fns";

export const ServiceColumns: Column[] = [
  {
    accessorKey: "type",
    header: "Service Type",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description: string = row.original.description;
      // Truncate long descriptions
      return description.length > 80 ? `${description.slice(0, 80)}...` : description;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return format(new Date(row.original.createdAt), 'MMM d, yyyy');
    },
  }
];
