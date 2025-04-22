
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Column } from "@/types";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface DataTableProps {
  columns: Column[];
  data: any[];
  actions?: (record: any) => React.ReactNode;
  pageSize?: number;
  searchKey?: string;
  isLoading?: boolean;
}

export function DataTable({
  columns,
  data,
  actions,
  pageSize = 10,
  searchKey,
  isLoading
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter data based on search term
  const filteredData = data.filter(record => 
    Object.entries(record).some(([key, value]) => {
      // Only search through string values
      return value && typeof value === 'string' && 
        value.toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    const comparison = aValue > bValue ? 1 : -1;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Get the accessor key for a column (either key or accessorKey)
  const getColumnKey = (column: Column): string => {
    return column.key || column.accessorKey || column.id || "";
  };

  // Get the value from a record based on column configuration
  const getCellValue = (record: any, column: Column) => {
    const key = getColumnKey(column);
    return record[key];
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }
    
    if (currentPage >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading data...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead 
                    key={getColumnKey(column) || columns.indexOf(column).toString()} 
                    onClick={() => column.sortable && handleSort(getColumnKey(column))} 
                    className={column.sortable ? "cursor-pointer hover:text-primary" : ""}
                  >
                    <div className="flex items-center">
                      {column.header}
                      {column.sortable && renderSortIcon(getColumnKey(column))}
                    </div>
                  </TableHead>
                ))}
                {actions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-6 text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((record, index) => (
                  <TableRow key={record.id || index} className="group hover:bg-muted/50">
                    {columns.map((column, colIndex) => (
                      <TableCell key={`${record.id || index}-${getColumnKey(column) || colIndex}`}>
                        {column.cell 
                          ? column.cell({ row: { original: record } }) 
                          : column.render 
                            ? column.render(getCellValue(record, column), record) 
                            : isStatusColumn(column) 
                              ? <StatusBadge status={getCellValue(record, column)} /> 
                              : getCellValue(record, column)}
                      </TableCell>
                    ))}
                    {actions && <TableCell className="text-right">{actions(record)}</TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} items
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getPageNumbers().map((page, i) => 
                typeof page === 'number' ? (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={i}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

// Helper function to determine if a column is a status column
function isStatusColumn(column: Column): boolean {
  return column.key === "status" || column.accessorKey === "status";
}
