import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

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
  categoryId: string;
  unitOfMeasure: string;
  reorderingRules?: string;
  stock: number; // Added for simplicity on the client
};

export type Warehouse = {
    id: string;
    name: string;
    location: string;
    capacity?: number;
};

export type Supplier = {
    id: string;
    name: string;
    contactEmail: string;
}

export type Customer = {
    id: string;
    name: string;
    shippingAddress: string;
    contactEmail: string;
}

export type Receipt = {
    id: string;
    supplierId: string;
    receiptDate: Timestamp;
    status: "Done" | "Waiting" | "Ready" | "Draft" | "Canceled";
}

export type DeliveryOrder = {
    id: string;
    customerId: string;
    deliveryDate: Timestamp;
    status: "Done" | "Waiting" | "Ready" | "Draft" | "Canceled";
}

export type StockAdjustment = {
    id: string;
    warehouseId: string;
    productId: string;
    countedQuantity: number;
    adjustmentDate: Timestamp;
}
