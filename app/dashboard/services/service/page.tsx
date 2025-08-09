"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { DurationInput } from "@/components/ui/duration-input";
import { FormMessage } from "@/components/ui/form";
import { getCategories, getServices, createService, updateService, deleteService, getApis } from "@/lib/apiservice";

interface Category {
  id: number;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  icon?: string;
}

interface Api {
  id: number;
  name: string;
  url: string;
  percentage: string;
  exchange: {
    id: number;
    name: string;
    price: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
  key: string;
}

interface Service {
  id: number;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  duration: number;
  min: number;
  max: number;
  price: number;
  site_id: number;
  category: number;
  api: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormErrors {
  name_uz?: string;
  name_ru?: string;
  name_en?: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  price?: string;
  duration?: string;
  min?: string;
  max?: string;
  site_id?: string;
  api?: string;
  category?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function ServicePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [apis, setApis] = useState<Api[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [sortField, setSortField] = useState<keyof Service>("name_en");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 4;

  const [newService, setNewService] = useState<Omit<Service, "id" | "created_at" | "updated_at">>({
    name_uz: "",
    name_ru: "",
    name_en: "",
    description_uz: "",
    description_ru: "",
    description_en: "",
    duration: 86400,
    min: 0,
    max: 0,
    price: 0,
    site_id: 0,
    category: 0,
    api: 0,
    is_active: true,
  });

  const [editService, setEditService] = useState<Service | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editFormErrors, setEditFormErrors] = useState<FormErrors>({});

  // Filters
  const [filterCategory, setFilterCategory] = useState<number | "all">("all");
  const [filterActive, setFilterActive] = useState<boolean | "all">("all");
  const [filterPriceMin, setFilterPriceMin] = useState<number | "">("");
  const [filterPriceMax, setFilterPriceMax] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterApiId, setFilterApiId] = useState<number | "all">("all");

  // API’dan ma'lumotlarni olish
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * itemsPerPage;
        const [categoriesData, servicesData, apisData] = await Promise.all([
          getCategories(100, 0), // Fetch all categories (adjust limit as needed)
          getServices(itemsPerPage, offset),
          getApis(),
        ]);
        const normalizedCategories = categoriesData.results.map((cat) => ({
          ...cat,
          description_uz: cat.description_uz ?? "",
          description_ru: cat.description_ru ?? "",
          description_en: cat.description_en ?? "",
          icon: cat.icon ?? "",
        }));
        const normalizedServices = servicesData.results.map((svc) => ({
          ...svc,
          description_uz: svc.description_uz ?? "",
          description_ru: svc.description_ru ?? "",
          description_en: svc.description_en ?? "",
        }));
        setCategories(normalizedCategories);
        setServices(normalizedServices);
        setTotalCount(servicesData.count);
        setApis(apisData.results);
        if (normalizedCategories.length > 0) {
          setNewService((prev) => ({ ...prev, category: normalizedCategories[0].id }));
        }
        if (apisData.results.length > 0) {
          setNewService((prev) => ({ ...prev, api: apisData.results[0].id }));
        }
      } catch (err) {
        setError((err as { message?: string }).message || "Ma'lumotlarni yuklashda xato yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  // Validate min/max for new service
  useEffect(() => {
    if (newService.min > newService.max && newService.max !== 0) {
      setFormErrors((prev) => ({
        ...prev,
        min: "Min must be less than max",
        max: "Max must be greater than min",
      }));
    } else if (formErrors.min || formErrors.max) {
      setFormErrors((prev) => {
        const { min, max, ...rest } = prev;
        return rest;
      });
    }
  }, [newService.min, newService.max]);

  // Validate min/max for edit service
  useEffect(() => {
    if (!editService) return;
    if (editService.min > editService.max && editService.max !== 0) {
      setEditFormErrors((prev) => ({
        ...prev,
        min: "Min must be less than max",
        max: "Max must be greater than min",
      }));
    } else if (editFormErrors.min || editFormErrors.max) {
      setEditFormErrors((prev) => {
        const { min, max, ...rest } = prev;
        return rest;
      });
    }
  }, [editService]);

  const handleSort = (field: keyof Service) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Apply all filters
  const filteredServices = services.filter((service) => {
    if (filterCategory !== "all" && service.category !== filterCategory) {
      return false;
    }
    if (filterActive !== "all" && service.is_active !== filterActive) {
      return false;
    }
    if (filterPriceMin !== "" && service.price < filterPriceMin) {
      return false;
    }
    if (filterPriceMax !== "" && service.price > filterPriceMax) {
      return false;
    }
    if (filterApiId !== "all" && service.api !== filterApiId) {
      return false;
    }
    if (searchQuery && !service.name_en.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortField === "is_active") {
      return sortDirection === "asc" ? Number(a.is_active) - Number(b.is_active) : Number(b.is_active) - Number(a.is_active);
    }
    if (sortField === "price") {
      return sortDirection === "asc" ? a.price - b.price : b.price - a.price;
    }
    if (sortField === "duration") {
      return sortDirection === "asc" ? a.duration - b.duration : b.duration - a.duration;
    }
    const aField = a[sortField] ?? "";
    const bField = b[sortField] ?? "";
    if (aField < bField) return sortDirection === "asc" ? -1 : 1;
    if (aField > bField) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSelectAll = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(filteredServices.map((service) => service.id));
    }
  };

  const handleSelectService = (id: number) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((serviceId) => serviceId !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const validateForm = useCallback(() => {
    const errors: FormErrors = {};
    if (!newService.name_uz) errors.name_uz = "Name (Uzbek) is required";
    if (!newService.name_ru) errors.name_ru = "Name (Russian) is required";
    if (!newService.name_en) errors.name_en = "Name (English) is required";
    if (!newService.description_uz) errors.description_uz = "Description (Uzbek) is required";
    if (!newService.description_ru) errors.description_ru = "Description (Russian) is required";
    if (!newService.description_en) errors.description_en = "Description (English) is required";
    if (newService.price === undefined || newService.price === null || isNaN(newService.price))
      errors.price = "Price is required";
    if (newService.duration === 0) errors.duration = "Duration is required";
    if (!newService.min) errors.min = "Min quantity is required";
    if (!newService.max) errors.max = "Max quantity is required";
    if (!newService.site_id) errors.site_id = "Site ID is required";
    if (!newService.api) errors.api = "API is required";
    if (!newService.category) errors.category = "Category is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newService]);

  const validateEditForm = useCallback(() => {
    if (!editService) return false;
    const errors: FormErrors = {};
    if (!editService.name_uz) errors.name_uz = "Name (Uzbek) is required";
    if (!editService.name_ru) errors.name_ru = "Name (Russian) is required";
    if (!editService.name_en) errors.name_en = "Name (English) is required";
    if (!editService.description_uz) errors.description_uz = "Description (Uzbek) is required";
    if (!editService.description_ru) errors.description_ru = "Description (Russian) is required";
    if (!editService.description_en) errors.description_en = "Description (English) is required";
    if (editService.price === undefined || editService.price === null || isNaN(editService.price))
      errors.price = "Price is required";
    if (editService.duration === 0) errors.duration = "Duration is required";
    if (!editService.min) errors.min = "Min quantity is required";
    if (!editService.max) errors.max = "Max quantity is required";
    if (!editService.site_id) errors.site_id = "Site ID is required";
    if (!editService.api) errors.api = "API is required";
    if (!editService.category) errors.category = "Category is required";
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editService]);

  const handleAddService = useCallback(async () => {
    if (!validateForm()) return;
    try {
      const payload = { ...newService };
      const createdService = await createService(payload);
      setServices((prev) => [...prev, {
        ...createdService,
        description_uz: createdService.description_uz ?? "",
        description_ru: createdService.description_ru ?? "",
        description_en: createdService.description_en ?? "",
      }]);
      setNewService({
        name_uz: "",
        name_ru: "",
        name_en: "",
        description_uz: "",
        description_ru: "",
        description_en: "",
        duration: 86400,
        min: 0,
        max: 0,
        price: 0,
        site_id: 0,
        category: categories[0]?.id || 0,
        api: apis[0]?.id || 0,
        is_active: true,
      });
      setFormErrors({});
      setAddDialogOpen(false);
      setCurrentPage(1);
    } catch (err) {
      setError((err as { message?: string }).message || "Xizmat qo‘shishda xato yuz berdi");
    }
  }, [newService, categories, apis, validateForm]);

  const handleUpdateService = useCallback(async () => {
    if (!editService || !validateEditForm()) return;
    try {
      const payload = { ...editService };
      const updatedService = await updateService(editService.id, payload);
      setServices((prev) =>
        prev.map((service) => (service.id === updatedService.id ? {
          ...updatedService,
          description_uz: updatedService.description_uz ?? "",
          description_ru: updatedService.description_ru ?? "",
          description_en: updatedService.description_en ?? "",
        } : service)),
      );
      setEditService(null);
      setEditFormErrors({});
      setEditDialogOpen(false);
    } catch (err) {
      setError((err as { message?: string }).message || "Xizmat yangilashda xato yuz berdi");
    }
  }, [editService, validateEditForm]);

  const handleDeleteService = async () => {
    if (serviceToDelete === null) return;
    try {
      await deleteService(serviceToDelete);
      setServices((prev) => prev.filter((service) => service.id !== serviceToDelete));
      setServiceToDelete(null);
      setDeleteDialogOpen(false);
      if (services.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (err) {
      setError((err as { message?: string }).message || "Xizmat o‘chirishda xato yuz berdi");
    }
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((cat) => cat.id === categoryId)?.name_en || "Unknown";
  };

  const getApiName = (apiId: number) => {
    return apis.find((api) => api.id === apiId)?.name || "Unknown";
  };

  const resetFilters = () => {
    setFilterCategory("all");
    setFilterActive("all");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setSearchQuery("");
    setFilterApiId("all");
  };

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

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const maxVisiblePages = 5;

  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  const adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 p-4 md:p-10">
          <div className="mx-auto max-w-7xl flex items-center justify-center min-h-[90vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Services</CardTitle>
          <CardDescription>Create, edit, and manage services for your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setFilterDialogOpen(true)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {(filterCategory !== "all" ||
                  filterActive !== "all" ||
                  filterPriceMin !== "" ||
                  filterPriceMax !== "" ||
                  filterApiId !== "all") && <span className="ml-1 rounded-full bg-primary w-2 h-2"></span>}
              </Button>
            </div>

            {selectedServices.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedServices.length} selected</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setServices((prev) =>
                      prev.map((service) =>
                        selectedServices.includes(service.id)
                          ? { ...service, is_active: true, updated_at: new Date().toISOString() }
                          : service,
                      ),
                    );
                    setSelectedServices([]);
                  }}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setServices((prev) =>
                      prev.map((service) =>
                        selectedServices.includes(service.id)
                          ? { ...service, is_active: false, updated_at: new Date().toString() }
                          : service,
                      ),
                    );
                    setSelectedServices([]);
                  }}
                >
                  Deactivate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setServices((prev) => prev.filter((service) => !selectedServices.includes(service.id)));
                    setSelectedServices([]);
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedServices.length === filteredServices.length && filteredServices.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name_en")}>
                    <div className="flex items-center gap-1">
                      Name (EN)
                      {sortField === "name_en" &&
                        (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("price")}>
                    <div className="flex items-center gap-1">
                      Price
                      {sortField === "price" &&
                        (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead>Min-Max</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("duration")}>
                    <div className="flex items-center gap-1">
                      Duration
                      {sortField === "duration" &&
                        (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead>API</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("is_active")}>
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
                {sortedServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => handleSelectService(service.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{service.name_en}</TableCell>
                    <TableCell>{getCategoryName(service.category)}</TableCell>
                    <TableCell>${service.price}</TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditService(service);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setServiceToDelete(service.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No services found. Try adjusting your filters or add a new service.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {adjustedStartPage > 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(1);
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {adjustedStartPage > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                  </>
                )}

                {Array.from({ length: endPage - adjustedStartPage + 1 }, (_, index) => adjustedStartPage + index).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Filter Dialog */}
      <Modal
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        title="Filter Services"
        description="Apply filters to narrow down the services list."
        footer={
          <>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>Apply Filters</Button>
          </>
        }
      >
        <div className="grid gap-4 p-8">
          <div className="grid gap-2">
            <Label htmlFor="filter-category">Category</Label>
            <Select
              value={filterCategory.toString()}
              onValueChange={(value) => setFilterCategory(value === "all" ? "all" : Number.parseInt(value))}
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
              onValueChange={(value) => setFilterActive(value === "all" ? "all" : value === "true")}
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
//  periphery: {filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value ? Number.parseFloat(e.target.value) : "")}
              />
              <span>to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value ? Number.parseFloat(e.target.value) : "")}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="filter-api">API</Label>
            <Select
              value={filterApiId.toString()}
              onValueChange={(value) => setFilterApiId(value === "all" ? "all" : Number.parseInt(value))}
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

      {/* Add Service Dialog */}
      <Modal
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="Add Service"
        description="Create a new service for your customers."
        footer={
          <>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService}>Add Service</Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="category">
              Category<span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={newService.category.toString()}
              onValueChange={(value) => setNewService({ ...newService, category: Number.parseInt(value) })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.category && <FormMessage>{formErrors.category}</FormMessage>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name_uz">
              Name (Uzbek)<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name_uz"
              type="text"
              value={newService.name_uz}
              onChange={(e) => setNewService({ ...newService, name_uz: e.target.value })}
              required
            />
            {formErrors.name_uz && <FormMessage>{formErrors.name_uz}</FormMessage>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name_ru">
              Name (Russian)<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name_ru"
              type="text"
              value={newService.name_ru}
              onChange={(e) => setNewService({ ...newService, name_ru: e.target.value })}
              required
            />
            {formErrors.name_ru && <FormMessage>{formErrors.name_ru}</FormMessage>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name_en">
              Name (English)<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name_en"
              type="text"
              value={newService.name_en}
              onChange={(e) => setNewService({ ...newService, name_en: e.target.value })}
              required
            />
            {formErrors.name_en && <FormMessage>{formErrors.name_en}</FormMessage>}
          </div>

          <DurationInput
            value={newService.duration}
            onChange={(duration) => setNewService({ ...newService, duration })}
            label="Duration"
            error={formErrors.duration}
            required
          />

          <div className="grid gap-2">
            <Label htmlFor="description_uz">
              Description (Uzbek)<span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="description_uz"
              value={newService.description_uz}
              onChange={(e) => setNewService({ ...newService, description_uz: e.target.value })}
              required
            />
            {formErrors.description_uz && <FormMessage>{formErrors.description_uz}</FormMessage>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description_ru">
              Description (Russian)<span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="description_ru"
              value={newService.description_ru}
              onChange={(e) => setNewService({ ...newService, description_ru: e.target.value })}
              required
            />
            {formErrors.description_ru && <FormMessage>{formErrors.description_ru}</FormMessage>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description_en">
              Description (English)<span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="description_en"
              value={newService.description_en}
              onChange={(e) => setNewService({ ...newService, description_en: e.target.value })}
              required
            />
            {formErrors.description_en && <FormMessage>{formErrors.description_en}</FormMessage>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="min">
                Min Quantity<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="min"
                type="number"
                value={newService.min}
                onChange={(e) => setNewService({ ...newService, min: Number.parseInt(e.target.value) || 0 })}
                required
              />
              {formErrors.min && <FormMessage>{formErrors.min}</FormMessage>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max">
                Max Quantity<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="max"
                type="number"
                value={newService.max}
                onChange={(e) => setNewService({ ...newService, max: Number.parseInt(e.target.value) || 0 })}
                required
              />
              {formErrors.max && <FormMessage>{formErrors.max}</FormMessage>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">
                Price ($)<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: Number.parseFloat(e.target.value) || 0 })}
                required
              />
              {formErrors.price && <FormMessage>{formErrors.price}</FormMessage>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="site-id">
                Site ID<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="site-id"
                type="number"
                value={newService.site_id}
                onChange={(e) => setNewService({ ...newService, site_id: Number.parseInt(e.target.value) || 0 })}
                required
              />
              {formErrors.site_id && <FormMessage>{formErrors.site_id}</FormMessage>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="api">
              API<span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={newService.api.toString()}
              onValueChange={(value) => setNewService({ ...newService, api: Number.parseInt(value) })}
            >
              <SelectTrigger id="api">
                <SelectValue placeholder="Select an API" />
              </SelectTrigger>
              <SelectContent>
                {apis.map((api) => (
                  <SelectItem key={api.id} value={api.id.toString()}>
                    {api.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.api && <FormMessage>{formErrors.api}</FormMessage>}
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={newService.is_active}
              onCheckedChange={(checked) => setNewService({ ...newService, is_active: checked })}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Service Dialog */}
      <Modal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Service"
        description="Update the service details."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateService}>Update Service</Button>
          </>
        }
      >
        {editService && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category">
                Category<span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={editService.category.toString()}
                onValueChange={(value) => setEditService({ ...editService, category: Number.parseInt(value) })}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editFormErrors.category && <FormMessage>{editFormErrors.category}</FormMessage>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name_uz">
                Name (Uzbek)<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="edit-name_uz"
                value={editService.name_uz}
                onChange={(e) => setEditService({ ...editService, name_uz: e.target.value })}
                required
              />
              {editFormErrors.name_uz && <FormMessage>{editFormErrors.name_uz}</FormMessage>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name_ru">
                Name (Russian)<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="edit-name_ru"
                value={editService.name_ru}
                onChange={(e) => setEditService({ ...editService, name_ru: e.target.value })}
                required
              />
              {editFormErrors.name_ru && <FormMessage>{editFormErrors.name_ru}</FormMessage>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name_en">
                Name (English)<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="edit-name_en"
                value={editService.name_en}
                onChange={(e) => setEditService({ ...editService, name_en: e.target.value })}
                required
              />
              {editFormErrors.name_en && <FormMessage>{editFormErrors.name_en}</FormMessage>}
            </div>

            <DurationInput
              value={editService.duration}
              onChange={(duration) => setEditService({ ...editService, duration })}
              label="Duration"
              error={editFormErrors.duration}
              required
            />

            <div className="grid gap-2">
              <Label htmlFor="edit-description_uz">
                Description (Uzbek)<span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="edit-description_uz"
                value={editService.description_uz}
                onChange={(e) => setEditService({ ...editService, description_uz: e.target.value })}
                required
              />
              {editFormErrors.description_uz && <FormMessage>{editFormErrors.description_uz}</FormMessage>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description_ru">
                Description (Russian)<span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="edit-description_ru"
                value={editService.description_ru}
                onChange={(e) => setEditService({ ...editService, description_ru: e.target.value })}
                required
              />
              {editFormErrors.description_ru && <FormMessage>{editFormErrors.description_ru}</FormMessage>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description_en">
                Description (English)<span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="edit-description_en"
                value={editService.description_en}
                onChange={(e) => setEditService({ ...editService, description_en: e.target.value })}
                required
              />
              {editFormErrors.description_en && <FormMessage>{editFormErrors.description_en}</FormMessage>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-min">
                  Min Quantity<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="edit-min"
                  type="number"
                  value={editService.min}
                  onChange={(e) => setEditService({ ...editService, min: Number.parseInt(e.target.value) || 0 })}
                  required
                />
                {editFormErrors.min && <FormMessage>{editFormErrors.min}</FormMessage>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-max">
                  Max Quantity<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="edit-max"
                  type="number"
                  value={editService.max}
                  onChange={(e) => setEditService({ ...editService, max: Number.parseInt(e.target.value) || 0 })}
                  required
                />
                {editFormErrors.max && <FormMessage>{editFormErrors.max}</FormMessage>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">
                  Price ($)<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editService.price}
                  onChange={(e) => setEditService({ ...editService, price: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
                {editFormErrors.price && <FormMessage>{editFormErrors.price}</FormMessage>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-site-id">
                  Site ID<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="edit-site-id"
                  type="number"
                  value={editService.site_id}
                  onChange={(e) => setEditService({ ...editService, site_id: Number.parseInt(e.target.value) || 0 })}
                  required
                />
                {editFormErrors.site_id && <FormMessage>{editFormErrors.site_id}</FormMessage>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-api">
                API<span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={editService.api.toString()}
                onValueChange={(value) => setEditService({ ...editService, api: Number.parseInt(value) })}
              >
                <SelectTrigger id="edit-api">
                  <SelectValue placeholder="Select an API" />
                </SelectTrigger>
                <SelectContent>
                  {apis.map((api) => (
                    <SelectItem key={api.id} value={api.id.toString()}>
                      {api.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editFormErrors.api && <FormMessage>{editFormErrors.api}</FormMessage>}
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="edit-is_active">Active</Label>
              <Switch
                id="edit-is_active"
                checked={editService.is_active}
                onCheckedChange={(checked) => setEditService({ ...editService, is_active: checked })}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Service"
        description="Are you sure you want to delete this service? This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteService}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}