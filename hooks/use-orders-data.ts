import { useEffect, useState } from "react";
import { getOrders, getServices } from "@/lib/apiservice";
import { getErrorMessage } from "@/lib/error-utils";

export interface OrdersPageService {
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

export interface OrdersPageOrder {
  id: number;
  service: OrdersPageService;
  price: number;
  url: string;
  status: string;
  user: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export function useOrdersData(itemsPerPage: number, currentPage: number) {
  const [orders, setOrders] = useState<OrdersPageOrder[]>([]);
  const [services, setServices] = useState<OrdersPageService[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const [ordersData, servicesList] = await Promise.all([
          getOrders(itemsPerPage, offset),
          getServices(),
        ]);
        if (cancelled) return;

        setOrders(ordersData.results as unknown as OrdersPageOrder[]);
        setTotalCount(ordersData.count || 0);
        setServices(
          Array.isArray(servicesList) ? (servicesList as unknown as OrdersPageService[]) : [],
        );
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Ma'lumotlarni yuklashda xato yuz berdi"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [currentPage, itemsPerPage]);

  return { orders, setOrders, services, setServices, totalCount, loading, error, setError };
}
