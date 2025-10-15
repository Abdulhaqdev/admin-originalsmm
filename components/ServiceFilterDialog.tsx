import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Api, Category } from "@/types";

interface ServiceFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterCategory: number | "all";
  filterActive: boolean | "all";
  filterPriceMin: number | "";
  filterPriceMax: number | "";
  filterApiId: number | "all";
  categories: Category[];
  apis: Api[];
  onFilterChange: (filters: {
    category: number | "all";
    active: boolean | "all";
    priceMin: number | "";
    priceMax: number | "";
    apiId: number | "all";
  }) => void;
  onResetFilters: () => void;
}

export const ServiceFilterDialog: React.FC<ServiceFilterDialogProps> = ({
  open,
  onOpenChange,
  filterCategory,
  filterActive,
  filterPriceMin,
  filterPriceMax,
  filterApiId,
  categories,
  apis,
  onFilterChange,
  onResetFilters,
}) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Filter Services"
      description="Apply filters to narrow down the services list."
      footer={
        <>
          <Button variant="outline" onClick={onResetFilters}>
            Reset Filters
          </Button>
          <Button onClick={() => onOpenChange(false)}>Apply Filters</Button>
        </>
      }
    >
      <div className="grid gap-4 p-8">
        <div className="grid gap-2">
          <Label htmlFor="filter-category">Category</Label>
          <Select
            value={filterCategory.toString()}
            onValueChange={(value) =>
              onFilterChange({ category: value === "all" ? "all" : Number.parseInt(value), active: filterActive, priceMin: filterPriceMin, priceMax: filterPriceMax, apiId: filterApiId })
            }
          >
            <SelectTrigger id="filter-category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="filter-active">Active</Label>
          <Select
            value={filterActive.toString()}
            onValueChange={(value) =>
              onFilterChange({ category: filterCategory, active: value === "all" ? "all" : value === "true", priceMin: filterPriceMin, priceMax: filterPriceMax, apiId: filterApiId })
            }
          >
            <SelectTrigger id="filter-active">
              <SelectValue placeholder="Select active status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Price Range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filterPriceMin}
              onChange={(e) =>
                onFilterChange({ category: filterCategory, active: filterActive, priceMin: e.target.value ? Number.parseFloat(e.target.value) : "", priceMax: filterPriceMax, apiId: filterApiId })
              }
            />
            <span>to</span>
            <Input
              type="number"
              placeholder="Max"
              value={filterPriceMax}
              onChange={(e) =>
                onFilterChange({ category: filterCategory, active: filterActive, priceMin: filterPriceMin, priceMax: e.target.value ? Number.parseFloat(e.target.value) : "", apiId: filterApiId })
              }
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="filter-api">API</Label>
          <Select
            value={filterApiId.toString()}
            onValueChange={(value) =>
              onFilterChange({ category: filterCategory, active: filterActive, priceMin: filterPriceMin, priceMax: filterPriceMax, apiId: value === "all" ? "all" : Number.parseInt(value) })
            }
          >
            <SelectTrigger id="filter-api">
              <SelectValue placeholder="Select an API" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All APIs</SelectItem>
              {apis.map((api) => (
                <SelectItem key={api.id} value={api.id.toString()}>
                  {api.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Modal>
  );
};