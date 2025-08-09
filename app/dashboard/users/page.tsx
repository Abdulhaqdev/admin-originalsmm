"use client";

import { useState, useEffect } from "react";
import { Download, Search, Filter, FileText, FileSpreadsheet, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { getUsers } from "@/lib/apiservice";

interface User {
  id: number;
  api_key: string;
  balance: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  username: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sortField, setSortField] = useState<keyof User>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * itemsPerPage;
        const data = await getUsers(itemsPerPage, offset);
        console.log(data)
        setUsers(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError((err as { message?: string }).message || "Foydalanuvchilarni yuklashda xato yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredUsers = users.filter((user) => {
    if (
      searchQuery &&
      !user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !user.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !user.username.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    // Agar sortField "id" bo‘lsa, uni number sifatida taqqoslash
    if (sortField === "id") {
      return sortDirection === "asc" 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    }

    // Agar sortField "balance" bo‘lsa, uni string sifatida parse qilib, raqamga aylantirish
    if (sortField === "balance") {
      const aNum = parseFloat(aValue as string);
      const bNum = parseFloat(bValue as string);
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    }

    // Qolgan barcha maydonlar (string) uchun localeCompare ishlatamiz
    return sortDirection === "asc" 
      ? (aValue as string).localeCompare(bValue as string) 
      : (bValue as string).localeCompare(aValue as string);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>View all user accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setFilterDialogOpen(true)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                    <div className="flex items-center gap-1">
                      ID
                      {sortField === "id" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("username")}>
                    <div className="flex items-center gap-1">
                      Username
                      {sortField === "username" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("first_name")}>
                    <div className="flex items-center gap-1">
                      First Name
                      {sortField === "first_name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("last_name")}>
                    <div className="flex items-center gap-1">
                      Last Name
                      {sortField === "last_name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                    <div className="flex items-center gap-1">
                      Email
                      {sortField === "email" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("phone_number")}>
                    <div className="flex items-center gap-1">
                      Phone
                      {sortField === "phone_number" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("balance")}>
                    <div className="flex items-center gap-1">
                      Balance
                      {sortField === "balance" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.first_name}</TableCell>
                    <TableCell>{user.last_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone_number}</TableCell>
                    <TableCell>{user.balance}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found. Try adjusting your filters.
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
        title="Filter Users"
        description="Apply filters to narrow down the users list."
        footer={
          <>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Reset Filters
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>Apply Filters</Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="search-query">Search Query</Label>
            <Input
              id="search-query"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* User Detail Dialog */}
      <Modal
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        title="User Details"
        description="View detailed information about this user."
        footer={<Button onClick={() => setDetailDialogOpen(false)}>Close</Button>}
      >
        {selectedUser && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">ID</Label>
                <p className="text-sm">{selectedUser.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                <p className="text-sm">{selectedUser.username}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                <p className="text-sm">{selectedUser.first_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                <p className="text-sm">{selectedUser.last_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-sm">{selectedUser.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                <p className="text-sm">{selectedUser.phone_number}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Balance</Label>
                <p className="text-sm">{selectedUser.balance}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">API Key</Label>
                <p className="text-sm truncate">{selectedUser.api_key}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}