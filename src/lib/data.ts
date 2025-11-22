import type { Kpi, RecentActivity, Product, Warehouse } from "@/lib/types";
import { Archive, ArrowRightLeft, Boxes, FileText, Package, Truck, Warehouse as WarehouseIcon } from "lucide-react";

export const kpis: Kpi[] = [
  {
    label: "Total Products in Stock",
    value: "12,405",
    icon: Boxes,
    change: "+1.2%",
    changeType: "increase",
  },
  {
    label: "Low Stock / Out of Stock",
    value: "89",
    icon: Archive,
    change: "-5",
    changeType: "decrease",
  },
  {
    label: "Pending Receipts",
    value: "12",
    icon: Truck,
  },
  {
    label: "Pending Deliveries",
    value: "25",
    icon: Package,
  },
  {
    label: "Internal Transfers Scheduled",
    value: "4",
    icon: ArrowRightLeft,
  },
];

export const recentActivities: RecentActivity[] = [
    { id: '1', type: 'Receipt', reference: 'VNDR-00123', status: 'Done', date: '2024-07-20' },
    { id: '2', type: 'Delivery', reference: 'CUST-00456', status: 'Ready', date: '2024-07-20' },
    { id: '3', type: 'Transfer', reference: 'WH-MAIN-PROD', status: 'Waiting', date: '2024-07-19' },
    { id: '4', type: 'Adjustment', reference: 'ADJ-CYCLE-Q3', status: 'Done', date: '2024-07-18' },
    { id: '5', type: 'Receipt', reference: 'VNDR-00124', status: 'Draft', date: '2024-07-18' },
    { id: '6', type: 'Delivery', reference: 'CUST-00457', status: 'Canceled', date: '2024-07-17' },
    { id: '7', type: 'Receipt', reference: 'VNDR-00125', status: 'Done', date: '2024-07-16' },
];

export const products: Product[] = [
    { id: '1', name: 'Organic Bananas', sku: 'FR-BAN-001', category: 'Fruits', stock: 1500, uom: 'kg' },
    { id: '2', name: 'Fresh Tomatoes', sku: 'VG-TOM-001', category: 'Vegetables', stock: 250, uom: 'kg' },
    { id: '3', name: 'Whole Milk 1L', sku: 'DR-MLK-001', category: 'Dairy', stock: 800, uom: 'units' },
    { id: '4', name: 'Sourdough Bread', sku: 'BK-BRD-001', category: 'Bakery', stock: 75, uom: 'units' },
    { id: '5', name: 'Chicken Breast', sku: 'MT-CHK-001', category: 'Meat', stock: 120, uom: 'kg' },
    { id: '6', name: 'Avocado', sku: 'FR-AVO-001', category: 'Fruits', stock: 0, uom: 'units' },
    { id: '7', name: 'Cheddar Cheese', sku: 'DR-CHS-001', category: 'Dairy', stock: 35, uom: 'kg' },
];

export const warehouses: Warehouse[] = [
    { id: '1', name: 'Main Warehouse', location: '123 Industrial Rd, City A', capacity: 10000 },
    { id: '2', name: 'Cold Storage Unit', location: '456 Cold St, City A', capacity: 5000 },
    { id: '3', name: 'Retail Backroom', location: '789 Market St, City B', capacity: 2000 },
];
