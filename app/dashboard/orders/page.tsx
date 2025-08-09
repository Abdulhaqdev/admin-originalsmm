"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders, getServices } from "@/lib/apiservice";
import { ChevronDown, ChevronUp, Eye, Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface Order {
  id: number;
  service: Service; // Service endi obyekt
  price: number;
  url: string;
  status: string;
  user: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  min: number;
  max: number;
  price: number;
  site_id: number;
  api: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [sortField, setSortField] = useState<keyof Order>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "Pending" | "Completed" | "Cancelled"
  >("all");
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * itemsPerPage;

        const [ordersData, servicesData] = await Promise.all([
          getOrders(itemsPerPage, offset),
          getServices(itemsPerPage, 0),
        ]);
    
        setOrders(ordersData.results);
        setTotalCount(ordersData.count || 0);
        console.log("Services Data:", servicesData.results);
        const fetchedServices = servicesData.results || servicesData;
        setServices(Array.isArray(fetchedServices) ? fetchedServices : []);
      } catch (err) {
        setError(
          (err as { message?: string }).message ||
            "Ma'lumotlarni yuklashda xato yuz berdi"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const mapStatus = (
    apiStatus: string
  ): "Pending" | "Completed" | "Canceled" => {
    switch (apiStatus.toLowerCase()) {
      case "true":
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "Canceled":
      case "false":
        return "Canceled";
      default:
        return "Pending";
    }
  };

  // `service` obyektidan nomni olish
  const getServiceName = (service: Service): string => {
    return service?.name || "Unknown Service";
  };

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const displayStatus = mapStatus(order.status);
    if (filterStatus !== "all" && displayStatus !== filterStatus) {
      return false;
    }
    if (
      searchQuery &&
      !order.url.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !order.id.toString().includes(searchQuery) &&
      !getServiceName(order.service)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      !order.quantity.toString().includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortField === "price" || sortField === "quantity") {
      return sortDirection === "asc"
        ? a[sortField] - b[sortField]
        : b[sortField] - a[sortField];
    }
    if (sortField === "service") {
      const aName = getServiceName(a.service);
      const bName = getServiceName(b.service);
      return sortDirection === "asc"
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    }
    if (sortField === "created_at" || sortField === "updated_at") {
      return sortDirection === "asc"
        ? new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
        : new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
    }
    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const maxVisiblePages = 5; // Ko'rsatiladigan maksimal sahifalar soni

  // Joriy sahifa asosida ko'rsatiladigan sahifalar oralig'ini hisoblash
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Agar endPage totalPages'dan kichik bo'lsa, startPage'ni qayta sozlash
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
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Orders</CardTitle>
          <CardDescription>View and manage all customer orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders by URL, ID, Service, or Quantity..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setFilterDialogOpen(true)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {filterStatus !== "all" && (
                  <span className="ml-1 rounded-full bg-primary w-2 h-2"></span>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-1">
                      Order ID
                      {sortField === "id" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("service")}
                  >
                    <div className="flex items-center gap-1">
                      Service
                      {sortField === "service" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center gap-1">
                      Price
                      {sortField === "price" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center gap-1">
                      Quantity
                      {sortField === "quantity" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("url")}
                  >
                    <div className="flex items-center gap-1">
                      URL
                      {sortField === "url" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === "status" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-1">
                      Created At
                      {sortField === "created_at" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedOrder(order);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{getServiceName(order.service)}</TableCell>
                    <TableCell>{order.price}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {order.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            mapStatus(order.status) === "Completed"
                              ? "bg-green-500"
                              : mapStatus(order.status) === "Canceled"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span>{order.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No orders found. Try adjusting your filters.
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

        {/* Agar adjustedStartPage 1 dan katta bo'lsa, birinchi sahifani va ellipsis qo'shamiz */}
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

        {/* Faqat adjustedStartPage'dan endPage'gacha bo'lgan sahifalarni ko'rsatamiz */}
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

        {/* Agar endPage totalPages'dan kichik bo'lsa, oxirgi sahifani va ellipsis qo'shamiz */}
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
        title="Filter Orders"
        description="Apply filters to narrow down the orders list."
        footer={
          <>
            <Button variant="outline" onClick={() => setFilterStatus("all")}>
              Reset Filters
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>
              Apply Filters
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              value={filterStatus}
              onValueChange={(value) =>
                setFilterStatus(
                  value as "all" | "Pending" | "Completed" | "Cancelled"
                )
              }
            >
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Order Detail Dialog */}
      <Modal
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        title="Order Details"
        description="View detailed information about this order."
        footer={<Button onClick={() => setDetailDialogOpen(false)}>Close</Button>}
      >
        {selectedOrder && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Order ID
                </h3>
                <p className="text-sm">{selectedOrder.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Service
                </h3>
                <p className="text-sm">{getServiceName(selectedOrder.service)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Price
                </h3>
                <p className="text-sm">{selectedOrder.price}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Quantity
                </h3>
                <p className="text-sm">{selectedOrder.quantity}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Status
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      mapStatus(selectedOrder.status) === "Completed"
                        ? "bg-green-500"
                        : mapStatus(selectedOrder.status) === "Canceled"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span>{(selectedOrder.status)}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  User ID
                </h3>
                <p className="text-sm">{selectedOrder.user}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Created At
                </h3>
                <p className="text-sm">
                  {selectedOrder.created_at}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Updated At
                </h3>
                <p className="text-sm">
                  {selectedOrder.updated_at}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">URL</h3>
              <p className="text-sm break-all">{selectedOrder.url}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}