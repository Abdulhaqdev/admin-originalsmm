"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Filter, Search } from "lucide-react";
import { ServiceTable } from "@/components/ServiceTable";
import { ServiceAddDialog } from "@/components/ServiceAddDialog";
import { ServiceEditDialog } from "@/components/ServiceEditDialog";
import { ServiceFilterDialog } from "@/components/ServiceFilterDialog";
import { ServiceDeleteDialog } from "@/components/ServiceDeleteDialog";
import { createService, updateService, deleteService } from "@/lib/apiservice";
import { getErrorMessage } from "@/lib/error-utils";
import { useServicesAdmin } from "@/hooks/use-services-admin";
import type { Service } from "@/types";

export default function ServicePage() {
  const {
    categories,
    apis,
    sortedServices,
    loading,
    error,
    setError,
    fetchServices,
    filterCategory,
    setFilterCategory,
    filterActive,
    setFilterActive,
    filterPriceMin,
    setFilterPriceMin,
    filterPriceMax,
    setFilterPriceMax,
    searchQuery,
    setSearchQuery,
    filterApiId,
    setFilterApiId,
    sortField,
    sortDirection,
    handleSort,
  } = useServicesAdmin();

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const [editService, setEditService] = useState<Service | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const handleSelectAll = () => {
    if (selectedServices.length === sortedServices.length && sortedServices.length > 0) {
      setSelectedServices([]);
    } else {
      setSelectedServices(sortedServices.map((service) => service.id));
    }
  };

  const handleSelectService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((serviceId) => serviceId !== id) : [...prev, id],
    );
  };

  const buildPayload = (service: Omit<Service, "id" | "created_at" | "updated_at"> | Service) => ({
    name: service.name_en || service.name_uz || service.name_ru || "",
    name_uz: service.name_uz,
    name_ru: service.name_ru,
    name_en: service.name_en,
    description: service.description_en || service.description_uz || service.description_ru || "",
    description_uz: service.description_uz,
    description_ru: service.description_ru,
    description_en: service.description_en,
    duration: service.duration,
    min: service.min,
    max: service.max,
    price: service.price,
    site_id: service.site_id,
    category: service.category,
    api: service.api,
    is_active: service.is_active,
    percent: typeof service.percent === "string" ? parseFloat(service.percent) || 0 : service.percent || 0,
    auto_update: service.auto_update,
  });

  const handleAddService = async (service: Omit<Service, "id" | "created_at" | "updated_at">) => {
    await createService(buildPayload(service) as Parameters<typeof createService>[0]);
    await fetchServices();
  };

  const handleUpdateService = async (service: Service) => {
    await updateService(service.id, buildPayload(service) as Parameters<typeof updateService>[1]);
    await fetchServices();
  };

  const handleDeleteService = async () => {
    if (serviceToDelete === null) return;
    try {
      await deleteService(serviceToDelete);
      await fetchServices();
      setServiceToDelete(null);
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, "Xizmatni o'chirishda xato yuz berdi"));
    }
  };

  const handleActivate = async () => {
    try {
      for (const id of selectedServices) {
        await updateService(id, { is_active: true });
      }
      await fetchServices();
      setSelectedServices([]);
    } catch (err) {
      setError(getErrorMessage(err, "Xizmatlarni faollashtirishda xato yuz berdi"));
    }
  };

  const handleDeactivate = async () => {
    try {
      for (const id of selectedServices) {
        await updateService(id, { is_active: false });
      }
      await fetchServices();
      setSelectedServices([]);
    } catch (err) {
      setError(getErrorMessage(err, "Xizmatlarni o'chirishda xato yuz berdi"));
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedServices) {
        await deleteService(id);
      }
      await fetchServices();
      setSelectedServices([]);
    } catch (err) {
      setError(getErrorMessage(err, "Xizmatlarni o'chirishda xato yuz berdi"));
    }
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading && sortedServices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && sortedServices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => void fetchServices()}>Qayta urinish</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your services and their details.</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setFilterDialogOpen(true)}>
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

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

      <ServiceDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteService}
      />
    </div>
  );
}
