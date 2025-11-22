'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, Timestamp } from "firebase/firestore";
import type { Receipt, DeliveryOrder, InternalTransfer, StockAdjustment, Product, Warehouse, Supplier, Customer } from "@/lib/types";
import React, { useMemo, useState } from "react";
import { ArrowRightLeft, Package, Truck, Settings, Calendar } from "lucide-react";

type MovementEntry = {
  id: string;
  type: "Receipt" | "Delivery" | "Transfer" | "Adjustment";
  reference: string;
  date: Date;
  status: string;
  product?: string;
  warehouse?: string;
  quantity?: number;
  relatedEntity?: string;
};

export default function HistoryPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch all collections
  const productsCollection = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products } = useCollection<Product>(productsCollection);

  const warehousesCollection = useMemo(() => firestore ? collection(firestore, 'warehouses') : null, [firestore]);
  const { data: warehouses } = useCollection<Warehouse>(warehousesCollection);

  const suppliersCollection = useMemo(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
  const { data: suppliers } = useCollection<Supplier>(suppliersCollection);

  const customersCollection = useMemo(() => firestore ? collection(firestore, 'customers') : null, [firestore]);
  const { data: customers } = useCollection<Customer>(customersCollection);

  const receiptsCollection = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'receipts');
  }, [firestore, user?.uid]);
  const { data: receipts } = useCollection<Receipt>(receiptsCollection);

  const deliveriesCollection = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'deliveryOrders');
  }, [firestore, user?.uid]);
  const { data: deliveries } = useCollection<DeliveryOrder>(deliveriesCollection);

  const transfersCollection = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'internalTransfers');
  }, [firestore, user?.uid]);
  const { data: transfers } = useCollection<InternalTransfer>(transfersCollection);

  const adjustmentsCollection = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'stockAdjustments');
  }, [firestore, user?.uid]);
  const { data: adjustments } = useCollection<StockAdjustment>(adjustmentsCollection);

  // Helper functions
  const getProductName = (productId: string) => products?.find(p => p.id === productId)?.name || 'Unknown Product';
  const getWarehouseName = (warehouseId: string) => warehouses?.find(w => w.id === warehouseId)?.name || 'Unknown';
  const getSupplierName = (supplierId: string) => suppliers?.find(s => s.id === supplierId)?.name || 'Unknown Supplier';
  const getCustomerName = (customerId: string) => customers?.find(c => c.id === customerId)?.name || 'Unknown Customer';

  // Consolidate all movements
  const allMovements = useMemo((): MovementEntry[] => {
    const movements: MovementEntry[] = [];

    receipts?.forEach(r => {
      movements.push({
        id: r.id,
        type: "Receipt",
        reference: `RCP-${r.id.slice(0, 8)}`,
        date: (r.receiptDate as Timestamp).toDate(),
        status: r.status,
        relatedEntity: getSupplierName(r.supplierId),
      });
    });

    deliveries?.forEach(d => {
      movements.push({
        id: d.id,
        type: "Delivery",
        reference: `DEL-${d.id.slice(0, 8)}`,
        date: (d.deliveryDate as Timestamp).toDate(),
        status: d.status,
        relatedEntity: getCustomerName(d.customerId),
      });
    });

    transfers?.forEach(t => {
      movements.push({
        id: t.id,
        type: "Transfer",
        reference: `TRF-${t.id.slice(0, 8)}`,
        date: (t.transferDate as Timestamp).toDate(),
        status: t.status,
        product: getProductName(t.productId),
        warehouse: `${getWarehouseName(t.fromWarehouseId)} → ${getWarehouseName(t.toWarehouseId)}`,
        quantity: t.quantity,
      });
    });

    adjustments?.forEach(a => {
      movements.push({
        id: a.id,
        type: "Adjustment",
        reference: `ADJ-${a.id.slice(0, 8)}`,
        date: (a.adjustmentDate as Timestamp).toDate(),
        status: "Done",
        product: getProductName(a.productId),
        warehouse: getWarehouseName(a.warehouseId),
        quantity: a.countedQuantity,
      });
    });

    // Sort by date descending
    return movements.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [receipts, deliveries, transfers, adjustments, products, warehouses, suppliers, customers]);

  // Filter movements
  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      const matchesSearch = m.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           m.relatedEntity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           m.product?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || m.type === filterType;
      const matchesStatus = filterStatus === "all" || m.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allMovements, searchTerm, filterType, filterStatus]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Receipt": return <Package className="h-4 w-4" />;
      case "Delivery": return <Truck className="h-4 w-4" />;
      case "Transfer": return <ArrowRightLeft className="h-4 w-4" />;
      case "Adjustment": return <Settings className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Done": return "default";
      case "Ready": return "secondary";
      case "Waiting": return "outline";
      case "Canceled": return "destructive";
      default: return "outline";
    }
  };

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Move History" />
      
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Ledger</CardTitle>
          <CardDescription>Complete history of all inventory movements and adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by reference, product, or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-1/3"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Receipt">Receipts</SelectItem>
                <SelectItem value="Delivery">Deliveries</SelectItem>
                <SelectItem value="Transfer">Transfers</SelectItem>
                <SelectItem value="Adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Waiting">Waiting</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Related Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No movements found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => (
                    <TableRow key={`${movement.type}-${movement.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(movement.type)}
                          <span className="font-medium">{movement.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{movement.reference}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {movement.date.toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(movement.status)}>{movement.status}</Badge>
                      </TableCell>
                      <TableCell>{movement.product || '—'}</TableCell>
                      <TableCell className="text-sm">{movement.warehouse || '—'}</TableCell>
                      <TableCell>{movement.quantity ? `${movement.quantity}` : '—'}</TableCell>
                      <TableCell>{movement.relatedEntity || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredMovements.length} of {allMovements.length} movements
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
