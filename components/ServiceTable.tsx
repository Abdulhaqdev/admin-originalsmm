import {  Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Api, Category, Service } from "@/types";
import { Checkbox } from "./ui/checkbox";

interface ServiceTableProps {
  services: Service[];
  categories: Category[];
  apis: Api[];
  selectedServices: number[];
  sortField: keyof Service;
  sortDirection: "asc" | "desc";
  onSort: (field: keyof Service) => void;
  onSelectService: (id: number) => void;
  onSelectAll: () => void;
  onEdit: (service: Service) => void;
  onDelete: (id: number) => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onBulkDelete: () => void;
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
  return parts.join(" ");
};

export const ServiceTable: React.FC<ServiceTableProps> = ({
  services,
  categories,
  apis,
  selectedServices,
  sortField,
  sortDirection,
  onSort,
  onSelectService,
  onSelectAll,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onBulkDelete,
}) => {
  const getCategoryName = (categoryId: number) => {
    return categories.find((cat) => cat.id === categoryId)?.name_uz || "Unknown";
  };

  const getApiName = (apiId: number) => {
    return apis.find((api) => api.id === apiId)?.name || "Unknown";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedServices.length === services.length && services.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => onSort("name_en")}>
              <div className="flex items-center gap-1">
                Name (Uzbek)
                {sortField === "name_en" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="cursor-pointer" onClick={() => onSort("price")}>
              <div className="flex items-center gap-1">
                Price
                {sortField === "price" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => onSort("percent")}>
              <div className="flex items-center gap-1">
                Percentage
                {sortField === "percent" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead>Min-Max</TableHead>
            <TableHead className="cursor-pointer" onClick={() => onSort("duration")}>
              <div className="flex items-center gap-1">
                Duration
                {sortField === "duration" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead>API</TableHead>
            <TableHead className="cursor-pointer" onClick={() => onSort("is_active")}>
              <div className="flex items-center gap-1">
                Active
                {sortField === "is_active" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell>
                <Checkbox
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => onSelectService(service.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{service.name_uz}</TableCell>
              <TableCell>{getCategoryName(service.category)}</TableCell>
              <TableCell>{service.price}</TableCell>
              <TableCell>{service.percent}%</TableCell>
              <TableCell>{`${service.min}-${service.max}`}</TableCell>
              <TableCell>{formatDuration(service.duration)}</TableCell>
              <TableCell>{getApiName(service.api)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${service.is_active ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span>{service.is_active ? "Yes" : "No"}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(service)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(service.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {services.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No services found. Try adjusting your filters or add a new service.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {selectedServices.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-muted-foreground">{selectedServices.length} selected</span>
          <Button variant="outline" size="sm" onClick={onActivate}>
            Activate
          </Button>
          <Button variant="outline" size="sm" onClick={onDeactivate}>
            Deactivate
          </Button>
          <Button variant="destructive" size="sm" onClick={onBulkDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
};