"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipLoader } from "react-spinners";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  X,
  Download,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  className?: string;
}

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TableFilter {
  key: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

export interface CustomTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  filters?: TableFilter[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (item: T) => void;
  onRefresh?: () => void;
  onExport?: (format: "csv" | "excel" | "pdf") => void;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function CustomTable<T = any>({
  data,
  columns,
  filters = [],
  searchable = true,
  searchPlaceholder = "Search...",
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  loading = false,
  emptyMessage = "No data found",
  emptyIcon,
  onRowClick,
  onRefresh,
  onExport,
  className = "",
  title,
  subtitle,
  actions,
}: CustomTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {}
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);

  // Filter and search logic
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item as any).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([filterKey, filterValues]) => {
      if (filterValues.length > 0) {
        filtered = filtered.filter((item) => {
          const value = (item as any)[filterKey];
          return filterValues.includes(String(value));
        });
      }
    });

    return filtered;
  }, [data, searchTerm, activeFilters]);

  // Sort logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" };
        } else {
          return null; // Reset to no sort
        }
      }
      return { key, direction: "asc" };
    });
  };

  const handleFilterChange = (filterKey: string, values: string[]) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: values,
    }));
    setCurrentPage(1); // Reset to first page
  };

  const clearFilter = (filterKey: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600" />
    );
  };

  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, values) => count + values.length,
    0
  );

  return (
    <div className={`w-full ${className}`}>
      {(title || subtitle || actions) && (
        // <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">{actions}</div>
          )}
        </div>
        // </CardHeader>
      )}

      <div>
        {/* Search and Filters */}
        {(searchable || filters.length > 0) && (
          <div className="flex items-center justify-between mb-6">
            {/* Search Bar */}
            {searchable && (
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {onRefresh && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefresh}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}

                  {onExport && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onExport("csv")}>
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport("excel")}>
                          Export as Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport("pdf")}>
                          Export as PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )}

            {/* Filters */}
            {filters.length > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="flex items-center space-x-2">
                    <Select
                      value={activeFilters[filter.key]?.[0] || ""}
                      onValueChange={(value) => {
                        if (filter.multiple) {
                          const currentValues = activeFilters[filter.key] || [];
                          const newValues = currentValues.includes(value)
                            ? currentValues.filter((v) => v !== value)
                            : [...currentValues, value];
                          handleFilterChange(filter.key, newValues);
                        } else {
                          handleFilterChange(filter.key, value ? [value] : []);
                        }
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <Filter className="h-4 w-4 mr-2 text-gray-500" />
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center">
                              {option.icon && (
                                <span className="mr-2">{option.icon}</span>
                              )}
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {activeFilters[filter.key]?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter(filter.key)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {(activeFilterCount > 0 || searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {Object.entries(activeFilters).map(([filterKey, values]) =>
                  values.map((value) => {
                    const filter = filters.find((f) => f.key === filterKey);
                    const option = filter?.options.find(
                      (o) => o.value === value
                    );
                    return (
                      <Badge
                        key={`${filterKey}-${value}`}
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <span>{option?.label || value}</span>
                        <button
                          onClick={() => {
                            const newValues = values.filter((v) => v !== value);
                            handleFilterChange(filterKey, newValues);
                          }}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <ClipLoader size={32} color="#3B82F6" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col justify-center itens-center text-center py-12">
              {emptyIcon && (
                <div className="mx-auto mb-4 text-gray-400">{emptyIcon}</div>
              )}
              <p className="text-gray-500">{emptyMessage}</p>
              {(activeFilterCount > 0 || searchTerm) && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="w-fit px-10 py-2 mt-4"
                    onClick={clearAllFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b-2 border-gray-200">
                  <TableRow className="hover:bg-transparent">
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={`${column.className || ""} ${
                          column.sortable
                            ? "cursor-pointer hover:bg-blue-50/50 transition-colors duration-200"
                            : ""
                        } font-semibold text-gray-700 py-4 px-6 text-sm uppercase tracking-wider border-r border-gray-100 last:border-r-0`}
                        style={{ width: column.width }}
                        onClick={() =>
                          column.sortable && handleSort(column.key)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{column.header}</span>
                          {column.sortable && (
                            <div className="ml-2 flex items-center">
                              {getSortIcon(column.key)}
                            </div>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, index) => (
                    <TableRow
                      key={index}
                      className={`${
                        onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
                      }`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={column.className || ""}
                        >
                          {column.accessor
                            ? column.accessor(item)
                            : (item as any)[column.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, sortedData.length)} of{" "}
                {sortedData.length} entries
              </span>

              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  const isActive = currentPage === page;
                  return (
                    <Button
                      key={page}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={
                        isActive ? "bg-blue-600 hover:bg-blue-700" : ""
                      }
                    >
                      {page}
                    </Button>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <Button
                      variant={
                        currentPage === totalPages ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      className={
                        currentPage === totalPages
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
