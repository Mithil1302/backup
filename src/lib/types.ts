import type { LucideIcon } from "lucide-react";

export type Kpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  changeType?: "increase" | "decrease";
};

export type RecentActivity = {
  id: string;
  type: "Receipt" | "Delivery" | "Transfer" | "Adjustment";
  reference: string;
  status: "Done" | "Waiting" | "Ready" | "Draft" | "Canceled";
  date: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  uom: string; // Unit of Measure
};

export type Warehouse = {
    id: string;
    name: string;
    location: string;
    capacity: number;
};
