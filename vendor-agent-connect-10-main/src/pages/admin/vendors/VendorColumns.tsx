import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const VendorColumns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "services",
    header: "Services",
    cell: ({ row }) => {
      const services = row.original.services || [];
      return (
        <div className="flex flex-wrap gap-1">
          {services.map((service: any) => (
            <Badge key={service.id} variant="secondary">
              {service.type}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Join Date",
    cell: ({ row }) => {
      return format(new Date(row.original.createdAt), 'MMM d, yyyy');
    },
  }
];
