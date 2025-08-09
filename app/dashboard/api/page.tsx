"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  getApis,
  createApi,
  updateApi,
  deleteApi,
  getExchanges,
  createExchange,
  updateExchange,
  deleteExchange,
} from "@/lib/apiservice";

interface Exchange {
  id: number;
  name: string;
  price: string; // Yangi qo‘shildi
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ErrorLog {
  timestamp: string;
  message: string;
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
  exchange_id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  key: string;
  last_used?: string | null;
  error_logs?: ErrorLog[];
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function ApiPage() {
  const [activeTab, setActiveTab] = useState("apis");
  const [apis, setApis] = useState<Api[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states for APIs
  const [currentApiPage, setCurrentApiPage] = useState<number>(1);
  const [totalApiCount, setTotalApiCount] = useState<number>(0);
  const itemsPerPage = 10;
  

  // Pagination states for Exchanges
  const [currentExchangePage, setCurrentExchangePage] = useState<number>(1);
  const [totalExchangeCount, setTotalExchangeCount] = useState<number>(0);

  // State for API sorting and filtering
  const [apiSortField, setApiSortField] = useState<keyof Api>("created_at");
  const [apiSortDirection, setApiSortDirection] = useState<"asc" | "desc">("desc");
  const [apiSearchQuery, setApiSearchQuery] = useState("");
  const [apiFilterExchange, setApiFilterExchange] = useState<number | "all">("all");
  const [apiFilterActive, setApiFilterActive] = useState<boolean | "all">("all");
  const [apiFilterDialogOpen, setApiFilterDialogOpen] = useState(false);
  const [selectedApis, setSelectedApis] = useState<number[]>([]);
  const [expandedApiLogs, setExpandedApiLogs] = useState<number[]>([]);

  // State for Exchange sorting and filtering
  const [exchangeSortField, setExchangeSortField] = useState<keyof Exchange>("created_at");
  const [exchangeSortDirection, setExchangeSortDirection] = useState<"asc" | "desc">("desc");
  const [exchangeSearchQuery, setExchangeSearchQuery] = useState("");
  const [selectedExchanges, setSelectedExchanges] = useState<number[]>([]);

  // State for modals
  const [apiFormOpen, setApiFormOpen] = useState(false);
  const [exchangeFormOpen, setExchangeFormOpen] = useState(false);
  const [deleteApiDialogOpen, setDeleteApiDialogOpen] = useState(false);
  const [deleteExchangeDialogOpen, setDeleteExchangeDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"delete" | "activate" | "deactivate" | null>(null);

  // State for editing
  const [editingApi, setEditingApi] = useState<Api | null>(null);
  const [editingExchange, setEditingExchange] = useState<Exchange | null>(null);
  const [apiToDelete, setApiToDelete] = useState<number | null>(null);
  const [exchangeToDelete, setExchangeToDelete] = useState<number | null>(null);

  // Form state
  const [newApi, setNewApi] = useState<Omit<Api, "id" | "created_at" | "updated_at" | "last_used" | "error_logs">>({
    name: "",
    url: "",
    percentage: "50",
    exchange_id: 1,
    is_active: true,
    key: "",
    exchange: { id: 0, name: "", price: "", created_at: "", updated_at: "", is_active: true },
  });

  const [newExchange, setNewExchange] = useState<Omit<Exchange, "id" | "created_at" | "updated_at">>({
    name: "",
    price: "", // Yangi qo‘shildi
    is_active: true,
  });

  // Form validation errors
  const [apiFormErrors, setApiFormErrors] = useState<{
    url?: string;
    name?: string;
    percentage?: string;
    key?: string;
  }>({});

  const [exchangeFormErrors, setExchangeFormErrors] = useState<{
    name?: string;
    price?: string; // Yangi qo‘shildi
  }>({});

  // API'dan ma'lumotlarni yuklash
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiOffset = (currentApiPage - 1) * itemsPerPage;
        const exchangeOffset = (currentExchangePage - 1) * itemsPerPage;

        const [apisData, exchangesData] = await Promise.all([
          getApis(itemsPerPage, apiOffset),
          getExchanges(itemsPerPage, exchangeOffset),
        ]);
        setApis(apisData.results);
        setTotalApiCount(apisData.count);
        setExchanges(exchangesData.results);
        setTotalExchangeCount(exchangesData.count);

        if (exchangesData.results.length > 0) {
          setNewApi((prev) => ({ ...prev, exchange_id: exchangesData.results[0].id }));
        }
      } catch (err) {
        setError((err as { message?: string }).message || "Ma'lumotlarni yuklashda xato yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentApiPage, currentExchangePage]);

  // API Sorting and Filtering
  const handleApiSort = (field: keyof Api) => {
    if (apiSortField === field) {
      setApiSortDirection(apiSortDirection === "asc" ? "desc" : "asc");
    } else {
      setApiSortField(field);
      setApiSortDirection("asc");
    }
  };

  const filteredApis = apis.filter((api) => {
    if (apiFilterExchange !== "all" && api.exchange_id !== apiFilterExchange) return false;
    if (apiFilterActive !== "all" && api.is_active !== apiFilterActive) return false;
    if (
      apiSearchQuery &&
      !api.url.toLowerCase().includes(apiSearchQuery.toLowerCase()) &&
      !api.name.toLowerCase().includes(apiSearchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const sortedApis = [...filteredApis].sort((a, b) => {
    const aValue = a[apiSortField];
    const bValue = b[apiSortField];

    if (apiSortField === "percentage") {
      return apiSortDirection === "asc"
        ? parseFloat(aValue as string) - parseFloat(bValue as string)
        : parseFloat(bValue as string) - parseFloat(aValue as string);
    }
    if (apiSortField === "is_active") {
      return apiSortDirection === "asc"
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    }
    if (apiSortField === "exchange_id") {
      const aName = getExchangeName(a.exchange_id);
      const bName = getExchangeName(b.exchange_id);
      return apiSortDirection === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
    }
    if (apiSortField === "last_used" || apiSortField === "created_at" || apiSortField === "updated_at") {
      const aDate = aValue ? new Date(aValue as string).getTime() : 0;
      const bDate = bValue ? new Date(bValue as string).getTime() : 0;
      return apiSortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }
    return apiSortDirection === "asc"
      ? (aValue as string).localeCompare(bValue as string)
      : (bValue as string).localeCompare(aValue as string);
  });

  // Exchange Sorting and Filtering
  const handleExchangeSort = (field: keyof Exchange) => {
    if (exchangeSortField === field) {
      setExchangeSortDirection(exchangeSortDirection === "asc" ? "desc" : "asc");
    } else {
      setExchangeSortField(field);
      setExchangeSortDirection("asc");
    }
  };

  const filteredExchanges = exchanges.filter((exchange) =>
    exchangeSearchQuery ? exchange.name.toLowerCase().includes(exchangeSearchQuery.toLowerCase()) : true,
  );

  const sortedExchanges = [...filteredExchanges].sort((a, b) => {
    const aValue = a[exchangeSortField];
    const bValue = b[exchangeSortField];

    if (exchangeSortField === "is_active") {
      return exchangeSortDirection === "asc"
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    }
    if (exchangeSortField === "price") {
      return exchangeSortDirection === "asc"
        ? parseFloat(aValue as string) - parseFloat(bValue as string)
        : parseFloat(bValue as string) - parseFloat(aValue as string);
    }
    if (exchangeSortField === "created_at" || exchangeSortField === "updated_at") {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return exchangeSortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }
    return exchangeSortDirection === "asc"
      ? (aValue as string).localeCompare(bValue as string)
      : (bValue as string).localeCompare(aValue as string);
  });

  // Selection Handlers
  const handleSelectAllApis = () => {
    setSelectedApis(selectedApis.length === filteredApis.length ? [] : filteredApis.map((api) => api.id));
  };

  const handleSelectApi = (id: number) => {
    setSelectedApis((prev) => (prev.includes(id) ? prev.filter((apiId) => apiId !== id) : [...prev, id]));
  };

  const handleSelectAllExchanges = () => {
    setSelectedExchanges(
      selectedExchanges.length === filteredExchanges.length ? [] : filteredExchanges.map((exchange) => exchange.id),
    );
  };

  const handleSelectExchange = (id: number) => {
    setSelectedExchanges((prev) =>
      prev.includes(id) ? prev.filter((exchangeId) => exchangeId !== id) : [...prev, id],
    );
  };

  // Toggle API logs
  const toggleApiLogs = (id: number) => {
    setExpandedApiLogs((prev) => (prev.includes(id) ? prev.filter((apiId) => apiId !== id) : [...prev, id]));
  };

  // Reset API filters
  const resetApiFilters = () => {
    setApiFilterExchange("all");
    setApiFilterActive("all");
    setApiSearchQuery("");
  };

  // Validate API form
  const validateApiForm = (data: typeof newApi) => {
    const errors: typeof apiFormErrors = {};
    if (!data.name) errors.name = "Name is required";
    if (!data.url) errors.url = "URL is required";
    else if (!/^https?:\/\//.test(data.url)) errors.url = "URL must be valid (start with http:// or https://)";
    if (!data.percentage) errors.percentage = "Percentage is required";
    else if (parseFloat(data.percentage) < 0 || parseFloat(data.percentage) > 100)
      errors.percentage = "Percentage must be between 0 and 100";
    if (!data.key) errors.key = "API key is required";
    setApiFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Exchange form
  const validateExchangeForm = (data: typeof newExchange) => {
    const errors: typeof exchangeFormErrors = {};
    if (!data.name) errors.name = "Name is required";
    if (!data.price) errors.price = "Price is required";
    else if (isNaN(parseFloat(data.price))) errors.price = "Price must be a valid number";
    setExchangeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle API CRUD
  const handleAddApi = async () => {
    if (!validateApiForm(newApi)) return;
    try {
      const createdApi = await createApi(newApi);
      setApis((prev) => [...prev, createdApi]);
      setNewApi({
        name: "",
        url: "",
        percentage: "50",
        exchange_id: exchanges[0]?.id || 1,
        is_active: true,
        key: "",
        exchange: { id: 0, name: "", price: "", created_at: "", updated_at: "", is_active: true },
      });
      setApiFormOpen(false);
      toast({ title: "API Created", description: "The API has been created successfully." });
    } catch (err) {
      setError((err as { message?: string }).message || "API qo‘shishda xato yuz berdi");
    }
  };

  const handleUpdateApi = async () => {
    if (!editingApi || !validateApiForm(editingApi)) return;
    try {
      const updatedApi = await updateApi(editingApi.id, editingApi);
      setApis((prev) => prev.map((api) => (api.id === updatedApi.id ? updatedApi : api)));
      setEditingApi(null);
      setApiFormOpen(false);
      toast({ title: "API Updated", description: "The API has been updated successfully." });
    } catch (err) {
      setError((err as { message?: string }).message || "API yangilashda xato yuz berdi");
    }
  };

  const handleDeleteApi = async () => {
    if (apiToDelete === null) return;
    try {
      await deleteApi(apiToDelete);
      setApis((prev) => prev.filter((api) => api.id !== apiToDelete));
      setApiToDelete(null);
      setDeleteApiDialogOpen(false);
      toast({ title: "API Deleted", description: "The API has been deleted successfully." });
    } catch (err) {
      setError((err as { message?: string }).message || "API o‘chirishda xato yuz berdi");
    }
  };

  // Handle Exchange CRUD
  const handleAddExchange = async () => {
    if (!validateExchangeForm(newExchange)) return;
    try {
      const createdExchange = await createExchange(newExchange);
      setExchanges((prev) => [...prev, createdExchange]);
      setNewExchange({ name: "", price: "", is_active: true });
      setExchangeFormOpen(false);
      toast({ title: "Exchange Created", description: "The exchange has been created successfully." });
    } catch (err) {
      setError((err as { message?: string }).message || "Exchange qo‘shishda xato yuz berdi");
    }
  };

  const handleUpdateExchange = async () => {
    if (!editingExchange || !validateExchangeForm(editingExchange)) return;
    try {
      const updatedExchange = await updateExchange(editingExchange.id, editingExchange);
      setExchanges((prev) => prev.map((ex) => (ex.id === updatedExchange.id ? updatedExchange : ex)));
      setEditingExchange(null);
      setExchangeFormOpen(false);
      toast({ title: "Exchange Updated", description: "The exchange has been updated successfully." });
    } catch (err) {
      setError((err as { message?: string }).message || "Exchange yangilashda xato yuz berdi");
    }
  };

  const handleDeleteExchange = async () => {
    if (exchangeToDelete === null) return;
    try {
      const apisUsingExchange = apis.some((api) => api.exchange_id === exchangeToDelete);
      if (apisUsingExchange) {
        toast({
          variant: "destructive",
          title: "Cannot Delete Exchange",
          description: "This exchange is being used by one or more APIs. Please delete those APIs first.",
        });
        setExchangeToDelete(null);
        setDeleteExchangeDialogOpen(false);
        return;
      }
      await deleteExchange(exchangeToDelete);
      setExchanges((prev) => prev.filter((ex) => ex.id !== exchangeToDelete));
      setExchangeToDelete(null);
      setDeleteExchangeDialogOpen(false);
      toast({ title: "Exchange Deleted", description: "The exchange has been deleted successfully." });
    } catch (err) {
      setError((err as { message?: string }).message || "Exchange o‘chirishda xato yuz berdi");
    }
  };

  // Handle Bulk Actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedApis.length === 0) return;
    try {
      if (bulkAction === "delete") {
        await Promise.all(selectedApis.map((id) => deleteApi(id)));
        setApis((prev) => prev.filter((api) => !selectedApis.includes(api.id)));
        toast({ title: "APIs Deleted", description: `${selectedApis.length} APIs have been deleted successfully.` });
      } else {
        const updatedApis = apis.map((api) =>
          selectedApis.includes(api.id)
            ? { ...api, is_active: bulkAction === "activate", updated_at: new Date().toISOString() }
            : api,
        );
        await Promise.all(
          selectedApis.map((id) =>
            updateApi(id, { is_active: bulkAction === "activate" } as Partial<Api>),
          ),
        );
        setApis(updatedApis);
        toast({
          title: bulkAction === "activate" ? "APIs Activated" : "APIs Deactivated",
          description: `${selectedApis.length} APIs have been ${
            bulkAction === "activate" ? "activated" : "deactivated"
          } successfully.`,
        });
      }
      setSelectedApis([]);
      setBulkAction(null);
      setBulkActionDialogOpen(false);
    } catch (err) {
      setError((err as { message?: string }).message || "Bulk actionda xato yuz berdi");
    }
  };

  const getExchangeName = (id: number) => {
    return exchanges.find((exchange) => exchange.id === id)?.name || "Unknown";
  };

  const totalApiPages = Math.ceil(totalApiCount / itemsPerPage);
  const totalExchangePages = Math.ceil(totalExchangeCount / itemsPerPage);

  const handleApiPageChange = (page: number) => {
    if (page >= 1 && page <= totalApiPages) {
      setCurrentApiPage(page);
    }
  };

  const handleExchangePageChange = (page: number) => {
    if (page >= 1 && page <= totalExchangePages) {
      setCurrentExchangePage(page);
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

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">API Management</h1>
      </div>

      <Tabs defaultValue="apis" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="exchanges">Exchanges</TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Endpoints</h2>
            <Button
              onClick={() => {
                setEditingApi(null);
                setApiFormErrors({});
                setApiFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add API
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manage APIs</CardTitle>
              <CardDescription>Create, edit, and manage API endpoints for your services.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search APIs..."
                      className="pl-8"
                      value={apiSearchQuery}
                      onChange={(e) => setApiSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={() => setApiFilterDialogOpen(true)}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {(apiFilterExchange !== "all" || apiFilterActive !== "all") && (
                      <span className="ml-1 rounded-full bg-primary w-2 h-2"></span>
                    )}
                  </Button>
                </div>

                {selectedApis.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedApis.length} selected</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkAction("activate");
                        setBulkActionDialogOpen(true);
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkAction("deactivate");
                        setBulkActionDialogOpen(true);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Deactivate
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setBulkAction("delete");
                        setBulkActionDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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
                          checked={selectedApis.length === filteredApis.length && filteredApis.length > 0}
                          onCheckedChange={handleSelectAllApis}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleApiSort("name")}>
                        <div className="flex items-center gap-1">
                          Name
                          {apiSortField === "name" &&
                            (apiSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleApiSort("url")}>
                        <div className="flex items-center gap-1">
                          URL
                          {apiSortField === "url" &&
                            (apiSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleApiSort("exchange_id")}>
                        <div className="flex items-center gap-1">
                          Exchange
                          {apiSortField === "exchange_id" &&
                            (apiSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleApiSort("percentage")}>
                        <div className="flex items-center gap-1">
                          Percentage
                          {apiSortField === "percentage" &&
                            (apiSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleApiSort("is_active")}>
                        <div className="flex items-center gap-1">
                          Active
                          {apiSortField === "is_active" &&
                            (apiSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleApiSort("last_used")}>
                        <div className="flex items-center gap-1">
                          Last Used
                          {apiSortField === "last_used" &&
                            (apiSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedApis.map((api) => (
                      <React.Fragment key={api.id}>
                        <TableRow>
                          <TableCell>
                            <Checkbox
                              checked={selectedApis.includes(api.id)}
                              onCheckedChange={() => handleSelectApi(api.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{api.name}</TableCell>
                          <TableCell>{api.url}</TableCell>
                          <TableCell>{getExchangeName(api.exchange_id)}</TableCell>
                          <TableCell>{api.percentage}%</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {api.is_active ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {api.last_used ? (
                              new Date(api.last_used).toLocaleString()
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleApiLogs(api.id)}
                                title="View Logs"
                              >
                                <Clock className="h-4 w-4" />
                                <span className="sr-only">View Logs</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingApi(api);
                                  setApiFormErrors({});
                                  setApiFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setApiToDelete(api.id);
                                  setDeleteApiDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedApiLogs.includes(api.id) && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/30">
                              <div className="p-2">
                                <h4 className="font-medium mb-2">API Usage Logs</h4>
                                {api.error_logs && api.error_logs.length > 0 ? (
                                  <div className="space-y-2">
                                    {api.error_logs.map((log, index) => (
                                      <Alert key={index} variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error at {new Date(log.timestamp).toLocaleString()}</AlertTitle>
                                        <AlertDescription>{log.message}</AlertDescription>
                                      </Alert>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No error logs available.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                    {sortedApis.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No APIs found. Try adjusting your filters or add a new API.
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
                          handleApiPageChange(currentApiPage - 1);
                        }}
                        className={currentApiPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalApiPages }, (_, index) => index + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentApiPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            handleApiPageChange(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {totalApiPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleApiPageChange(currentApiPage + 1);
                        }}
                        className={currentApiPage === totalApiPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exchanges" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Exchanges</h2>
            <Button
              onClick={() => {
                setEditingExchange(null);
                setExchangeFormErrors({});
                setExchangeFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Exchange
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manage Exchanges</CardTitle>
              <CardDescription>Create, edit, and manage exchanges for your APIs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search exchanges..."
                      className="pl-8"
                      value={exchangeSearchQuery}
                      onChange={(e) => setExchangeSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedExchanges.length === filteredExchanges.length && filteredExchanges.length > 0}
                          onCheckedChange={handleSelectAllExchanges}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleExchangeSort("name")}>
                        <div className="flex items-center gap-1">
                          Name
                          {exchangeSortField === "name" &&
                            (exchangeSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleExchangeSort("price")}>
                        <div className="flex items-center gap-1">
                          Price
                          {exchangeSortField === "price" &&
                            (exchangeSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleExchangeSort("is_active")}>
                        <div className="flex items-center gap-1">
                          Active
                          {exchangeSortField === "is_active" &&
                            (exchangeSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleExchangeSort("created_at")}>
                        <div className="flex items-center gap-1">
                          Created At
                          {exchangeSortField === "created_at" &&
                            (exchangeSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleExchangeSort("updated_at")}>
                        <div className="flex items-center gap-1">
                          Updated At
                          {exchangeSortField === "updated_at" &&
                            (exchangeSortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedExchanges.map((exchange) => (
                      <TableRow key={exchange.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedExchanges.includes(exchange.id)}
                            onCheckedChange={() => handleSelectExchange(exchange.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{exchange.name}</TableCell>
                        <TableCell>{exchange.price}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {exchange.is_active ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(exchange.created_at).toLocaleString()}</TableCell>
                        <TableCell>{new Date(exchange.updated_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingExchange(exchange);
                                setExchangeFormErrors({});
                                setExchangeFormOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setExchangeToDelete(exchange.id);
                                setDeleteExchangeDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedExchanges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No exchanges found. Try adjusting your search or add a new exchange.
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
                          handleExchangePageChange(currentExchangePage - 1);
                        }}
                        className={currentExchangePage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalExchangePages }, (_, index) => index + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentExchangePage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            handleExchangePageChange(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {totalExchangePages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleExchangePageChange(currentExchangePage + 1);
                        }}
                        className={currentExchangePage === totalExchangePages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Filter Dialog */}
      <Modal
        open={apiFilterDialogOpen}
        onOpenChange={setApiFilterDialogOpen}
        title="Filter APIs"
        description="Apply filters to narrow down the APIs list."
        footer={
          <>
            <Button variant="outline" onClick={resetApiFilters}>
              Reset Filters
            </Button>
            <Button onClick={() => setApiFilterDialogOpen(false)}>Apply Filters</Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filter-exchange">Exchange</Label>
            <Select
              value={apiFilterExchange.toString()}
              onValueChange={(value) => setApiFilterExchange(value === "all" ? "all" : Number(value))}
            >
              <SelectTrigger id="filter-exchange">
                <SelectValue placeholder="Select an exchange" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exchanges</SelectItem>
                {exchanges.map((exchange) => (
                  <SelectItem key={exchange.id} value={exchange.id.toString()}>
                    {exchange.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filter-active">Active</Label>
            <Select
              value={apiFilterActive.toString()}
              onValueChange={(value) => setApiFilterActive(value === "all" ? "all" : value === "true")}
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
        </div>
      </Modal>

      {/* API Form Modal */}
      <Modal
        open={apiFormOpen}
        onOpenChange={setApiFormOpen}
        title={editingApi ? "Edit API" : "Add API"}
        description={editingApi ? "Update API details." : "Create a new API endpoint."}
        footer={
          <>
            <Button variant="outline" onClick={() => setApiFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingApi ? handleUpdateApi : handleAddApi}>
              {editingApi ? "Update API" : "Add API"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Name<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={editingApi ? editingApi.name : newApi.name}
              onChange={(e) =>
                editingApi
                  ? setEditingApi({ ...editingApi, name: e.target.value })
                  : setNewApi({ ...newApi, name: e.target.value })
              }
              placeholder="Enter API name"
            />
            {apiFormErrors.name && <p className="text-sm text-destructive">{apiFormErrors.name}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">
              URL<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="url"
              value={editingApi ? editingApi.url : newApi.url}
              onChange={(e) =>
                editingApi
                  ? setEditingApi({ ...editingApi, url: e.target.value })
                  : setNewApi({ ...newApi, url: e.target.value })
              }
              placeholder="https://api.example.com/v1"
            />
            {apiFormErrors.url && <p className="text-sm text-destructive">{apiFormErrors.url}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="exchange">
              Exchange<span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={String(editingApi ? editingApi.exchange_id : newApi.exchange_id ?? "")}
              onValueChange={(value) =>
                editingApi
                  ? setEditingApi({ ...editingApi, exchange_id: Number(value) })
                  : setNewApi({ ...newApi, exchange_id: Number(value) })
              }
            >
              <SelectTrigger id="exchange">
                <SelectValue placeholder="Select an exchange" />
              </SelectTrigger>
              <SelectContent>
                {exchanges.map((exchange) => (
                  <SelectItem key={exchange.id} value={exchange.id.toString()}>
                    {exchange.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="percentage">
              Percentage<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="percentage"
              type="number"
              min="0"
              max="100"
              value={editingApi ? editingApi.percentage : newApi.percentage}
              onChange={(e) =>
                editingApi
                  ? setEditingApi({ ...editingApi, percentage: e.target.value })
                  : setNewApi({ ...newApi, percentage: e.target.value })
              }
            />
            {apiFormErrors.percentage && <p className="text-sm text-destructive">{apiFormErrors.percentage}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="key">
              API Key<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="key"
              value={editingApi ? editingApi.key : newApi.key}
              onChange={(e) =>
                editingApi
                  ? setEditingApi({ ...editingApi, key: e.target.value })
                  : setNewApi({ ...newApi, key: e.target.value })
              }
              placeholder="Enter API key"
            />
            {apiFormErrors.key && <p className="text-sm text-destructive">{apiFormErrors.key}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={editingApi ? editingApi.is_active : newApi.is_active}
              onCheckedChange={(checked) =>
                editingApi
                  ? setEditingApi({ ...editingApi, is_active: checked })
                  : setNewApi({ ...newApi, is_active: checked })
              }
            />
          </div>
        </div>
      </Modal>

      {/* Exchange Form Modal */}
      <Modal
        open={exchangeFormOpen}
        onOpenChange={setExchangeFormOpen}
        title={editingExchange ? "Edit Exchange" : "Add Exchange"}
        description={editingExchange ? "Update exchange details." : "Create a new exchange."}
        footer={
          <>
            <Button variant="outline" onClick={() => setExchangeFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingExchange ? handleUpdateExchange : handleAddExchange}>
              {editingExchange ? "Update Exchange" : "Add Exchange"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Name<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={editingExchange ? editingExchange.name : newExchange.name}
              onChange={(e) =>
                editingExchange
                  ? setEditingExchange({ ...editingExchange, name: e.target.value })
                  : setNewExchange({ ...newExchange, name: e.target.value })
              }
              placeholder="Enter exchange name"
            />
            {exchangeFormErrors.name && <p className="text-sm text-destructive">{exchangeFormErrors.name}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">
              Price<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="price"
              type="text"
              value={editingExchange ? editingExchange.price : newExchange.price}
              onChange={(e) =>
                editingExchange
                  ? setEditingExchange({ ...editingExchange, price: e.target.value })
                  : setNewExchange({ ...newExchange, price: e.target.value })
              }
              placeholder="Enter price (e.g., 12900.00)"
            />
            {exchangeFormErrors.price && <p className="text-sm text-destructive">{exchangeFormErrors.price}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="exchange_is_active">Active</Label>
            <Switch
              id="exchange_is_active"
              checked={editingExchange ? editingExchange.is_active : newExchange.is_active}
              onCheckedChange={(checked) =>
                editingExchange
                  ? setEditingExchange({ ...editingExchange, is_active: checked })
                  : setNewExchange({ ...newExchange, is_active: checked })
              }
            />
          </div>
        </div>
      </Modal>

      {/* Delete API Confirmation Dialog */}
      <Modal
      children={null}

        open={deleteApiDialogOpen}
        onOpenChange={setDeleteApiDialogOpen}
        title="Delete API"
        description="Are you sure you want to delete this API? This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteApiDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteApi}>
              Delete
            </Button>
          </>
        }
      />

      {/* Delete Exchange Confirmation Dialog */}
      <Modal
      children={null}
        open={deleteExchangeDialogOpen}
        onOpenChange={setDeleteExchangeDialogOpen}
        title="Delete Exchange"
        description="Are you sure you want to delete this exchange? This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteExchangeDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExchange}>
              Delete
            </Button>
          </>
        }
      />

      {/* Bulk Action Confirmation Dialog */}
      <Modal
      children={null}

        open={bulkActionDialogOpen}
        onOpenChange={setBulkActionDialogOpen}
        title={
          bulkAction === "delete" ? "Delete APIs" : bulkAction === "activate" ? "Activate APIs" : "Deactivate APIs"
        }
        description={
          bulkAction === "delete"
            ? `Are you sure you want to delete ${selectedApis.length} APIs? This action cannot be undone.`
            : bulkAction === "activate"
            ? `Are you sure you want to activate ${selectedApis.length} APIs?`
            : `Are you sure you want to deactivate ${selectedApis.length} APIs?`
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant={bulkAction === "delete" ? "destructive" : "default"} onClick={handleBulkAction}>
              {bulkAction === "delete" ? "Delete" : bulkAction === "activate" ? "Activate" : "Deactivate"}
            </Button>
          </>
        }
      />
    </div>
  );
}