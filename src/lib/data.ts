import type { Product, Warehouse } from "@/lib/types";

export const products: Product[] = [
    { id: '1', name: 'Organic Bananas', sku: 'FR-BAN-001', categoryId: 'Fruits', stock: 1500, unitOfMeasure: 'kg' },
    { id: '2', name: 'Fresh Tomatoes', sku: 'VG-TOM-001', categoryId: 'Vegetables', stock: 250, unitOfMeasure: 'kg' },
    { id: '3', name: 'Whole Milk 1L', sku: 'DR-MLK-001', categoryId: 'Dairy', stock: 800, unitOfMeasure: 'units' },
    { id: '4', name: 'Sourdough Bread', sku: 'BK-BRD-001', categoryId: 'Bakery', stock: 75, unitOfMeasure: 'units' },
    { id: '5', name: 'Chicken Breast', sku: 'MT-CHK-001', categoryId: 'Meat', stock: 120, unitOfMeasure: 'kg' },
    { id: '6', name: 'Avocado', sku: 'FR-AVO-001', categoryId: 'Fruits', stock: 0, unitOfMeasure: 'units' },
    { id: '7', name: 'Cheddar Cheese', sku: 'DR-CHS-001', categoryId: 'Dairy', stock: 35, unitOfMeasure: 'kg' },
];

export const warehouses: Warehouse[] = [
    { id: '1', name: 'Main Warehouse', location: '123 Industrial Rd, City A', capacity: 10000 },
    { id: '2', name: 'Cold Storage Unit', location: '456 Cold St, City A', capacity: 5000 },
    { id: '3', name: 'Retail Backroom', location: '789 Market St, City B', capacity: 2000 },
];
