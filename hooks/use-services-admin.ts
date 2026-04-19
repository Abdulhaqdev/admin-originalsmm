import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getApis,
  getCategories,
  getServices,
} from "@/lib/apiservice";
import { getErrorMessage } from "@/lib/error-utils";
import type { Api, Category, Service } from "@/types";

const META_LIMIT = 100;

export function useServicesAdmin() {
  const [metaReady, setMetaReady] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [apis, setApis] = useState<Api[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<number | "all">("all");
  const [filterActive, setFilterActive] = useState<boolean | "all">("all");
  const [filterPriceMin, setFilterPriceMin] = useState<number | "">("");
  const [filterPriceMax, setFilterPriceMax] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState<keyof Service>("name_en");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [filterApiId, setFilterApiId] = useState<number | "all">("all");

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: Record<string, unknown> = {};
      if (filterCategory !== "all") filters.category = filterCategory;
      if (filterApiId !== "all") filters.api = filterApiId;
      if (filterActive !== "all") filters.is_active = filterActive;
      if (filterPriceMin !== "") filters.price_min = filterPriceMin;
      if (filterPriceMax !== "") filters.price_max = filterPriceMax;
      if (searchQuery) filters.search = searchQuery;

      const servicesData = await getServices(filters);

      const normalizedServices = servicesData.map((svc) => ({
        ...svc,
        description_uz: svc.description_uz ?? "",
        description_ru: svc.description_ru ?? "",
        description_en: svc.description_en ?? "",
        percentage: svc.percent !== undefined ? String(svc.percent) : "50",
      })) as Service[];

      setServices(normalizedServices);
    } catch (err) {
      setError(getErrorMessage(err, "Ma'lumotlarni yuklashda xato yuz berdi"));
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterApiId, filterActive, filterPriceMin, filterPriceMax, searchQuery]);

  useEffect(() => {
    let cancelled = false;

    const loadMeta = async () => {
      try {
        setLoading(true);
        setError(null);
        const [categoriesData, apisData] = await Promise.all([
          getCategories(META_LIMIT, 0),
          getApis(META_LIMIT, 0),
        ]);
        if (cancelled) return;

        const normalizedCategories = categoriesData.results.map((cat) => ({
          ...cat,
          description_uz: cat.description_uz ?? "",
          description_ru: cat.description_ru ?? "",
          description_en: cat.description_en ?? "",
          icon: cat.icon ?? "",
        }));

        setCategories(normalizedCategories);
        setApis(apisData.results);
        setMetaReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Ma'lumotlarni yuklashda xato yuz berdi"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!metaReady) return;
    void fetchServices();
  }, [metaReady, fetchServices]);

  const handleSort = useCallback((field: keyof Service) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return prevField;
      }
      setSortDirection("asc");
      return field;
    });
  }, []);

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      if (sortField === "is_active") {
        return sortDirection === "asc"
          ? Number(a.is_active) - Number(b.is_active)
          : Number(b.is_active) - Number(a.is_active);
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
  }, [services, sortField, sortDirection]);

  return {
    categories,
    apis,
    services,
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
  };
}
