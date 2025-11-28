"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";
import Link from "next/link";
import { ServiceTable } from "@/components/ServiceTable";
import { ServiceFilterDialog } from "@/components/ServiceFilterDialog";
import { ServiceAddDialog } from "@/components/ServiceAddDialog";
import { ServiceEditDialog } from "@/components/ServiceEditDialog";
import { ServiceDeleteDialog } from "@/components/ServiceDeleteDialog";
import { ServicePagination } from "@/components/ServicePagination";
import { getCategories, getServices, createService, updateService, deleteService, getApis } from "@/lib/apiservice";
import { Api, Category, Service } from "@/types";

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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [editService, setEditService] = useState<Service | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<number | "all">("all");
  const [filterActive, setFilterActive] = useState<boolean | "all">("all");
  const [filterPriceMin, setFilterPriceMin] = useState<number | "">("");
  const [filterPriceMax, setFilterPriceMax] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterApiId, setFilterApiId] = useState<number | "all">("all");
  const itemsPerPage = 4;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * itemsPerPage;
        const [categoriesData, servicesData, apisData] = await Promise.all([
          getCategories(100, 0),
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
          percentage: svc.percent ?? "50",
        }));
        setCategories(normalizedCategories);
        setServices(normalizedServices);
        setTotalCount(servicesData.count);
        setApis(apisData.results);
      } catch (err) {
        setError((err as { message?: string }).message || "Ma'lumotlarni yuklashda xato yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const handleSort = (field: keyof Service) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredServices = services.filter((service) => {
    if (filterCategory !== "all" && service.category !== filterCategory) return false;
    if (filterActive !== "all" && service.is_active !== filterActive) return false;
    if (filterPriceMin !== "" && service.price < filterPriceMin) return false;
    if (filterPriceMax !== "" && service.price > filterPriceMax) return false;
    if (filterApiId !== "all" && service.api !== filterApiId) return false;
    if (searchQuery && !service.name_en.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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

  const handleAddService = async (service: Omit<Service, "id" | "created_at" | "updated_at">) => {
    const createdService = await createService(service);
    setServices((prev) => [
      ...prev,
      {
        ...createdService,
        description_uz: createdService.description_uz ?? "",
        description_ru: createdService.description_ru ?? "",
        description_en: createdService.description_en ?? "",
        percent: createdService.percent,
      },
    ]);
    setCurrentPage(1);
  };

  const handleUpdateService = async (service: Service) => {
    const updatedService = await updateService(service.id, service);
    setServices((prev) =>
      prev.map((s) =>
        s.id === updatedService.id
          ? {
              ...updatedService,
              description_uz: updatedService.description_uz ?? "",
              description_ru: updatedService.description_ru ?? "",
              description_en: updatedService.description_en ?? "",
              percentage: updatedService.percent,
            }
          : s,
      ),
    );
  };

  const handleDeleteService = async () => {
    if (serviceToDelete === null) return;
    await deleteService(serviceToDelete);
    setServices((prev) => prev.filter((service) => service.id !== serviceToDelete));
    setServiceToDelete(null);
    setDeleteDialogOpen(false);
    if (services.length === 1 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleActivate = () => {
    setServices((prev) =>
      prev.map((service) =>
        selectedServices.includes(service.id)
          ? { ...service, is_active: true, updated_at: new Date().toISOString() }
          : service,
      ),
    );
    setSelectedServices([]);
  };

  const handleDeactivate = () => {
    setServices((prev) =>
      prev.map((service) =>
        selectedServices.includes(service.id)
          ? { ...service, is_active: false, updated_at: new Date().toISOString() }
          : service,
      ),
    );
    setSelectedServices([]);
  };

  const handleBulkDelete = () => {
    setServices((prev) => prev.filter((service) => !selectedServices.includes(service.id)));
    setSelectedServices([]);
  };

  const handleFilterChange = ({
    category,
    active,
    priceMin,
    priceMax,
    apiId,
  }: {
    category: number | "all";
    active: boolean | "all";
    priceMin: number | "";
    priceMax: number | "";
    apiId: number | "all";
  }) => {
    setFilterCategory(category);
    setFilterActive(active);
    setFilterPriceMin(priceMin);
    setFilterPriceMax(priceMax);
    setFilterApiId(apiId);
  };

  const resetFilters = () => {
    setFilterCategory("all");
    setFilterActive("all");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setSearchQuery("");
    setFilterApiId("all");
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
        <div className="flex items-center gap-4">
          <Link href="/dashboard/multiservice">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Multi services
            </Button>
          </Link>
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
          </div>

          <ServiceTable
            services={sortedServices}
            categories={categories}
            apis={apis}
            selectedServices={selectedServices}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onSelectService={handleSelectService}
            onSelectAll={handleSelectAll}
            onEdit={(service) => {
              setEditService(service);
              setEditDialogOpen(true);
            }}
            onDelete={(id) => {
              setServiceToDelete(id);
              setDeleteDialogOpen(true);
            }}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onBulkDelete={handleBulkDelete}
          />

          <div className="mt-4">
            <ServicePagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      <ServiceFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        filterCategory={filterCategory}
        filterActive={filterActive}
        filterPriceMin={filterPriceMin}
        filterPriceMax={filterPriceMax}
        filterApiId={filterApiId}
        categories={categories}
        apis={apis}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
      />

      <ServiceAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categories={categories}
        apis={apis}
        onAddService={handleAddService}
      />

      <ServiceEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        service={editService}
        categories={categories}
        apis={apis}
        onUpdateService={handleUpdateService}
      />

      <ServiceDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteService}
      />
    </div>
  );
}