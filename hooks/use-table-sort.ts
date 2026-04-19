import { useCallback, useState } from "react";

export function useTableSort<T extends string | number | symbol>(
  defaultField: T,
  defaultDirection: "asc" | "desc" = "asc",
) {
  const [sortField, setSortField] = useState<T>(defaultField);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(defaultDirection);

  const handleSort = useCallback((field: T) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDirection("asc");
      return field;
    });
  }, []);

  return { sortField, sortDirection, handleSort, setSortField, setSortDirection };
}
