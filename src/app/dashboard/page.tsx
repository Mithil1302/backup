'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Receipt, DeliveryOrder, InternalTransfer, Product, Warehouse } from "@/lib/types";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Package, AlertTriangle, ArrowRightLeft, TrendingDown, Filter } from "lucide-react";

export default function Dashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const receiptsCollection = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'receipts');
  }, [firestore, user?.uid]);
  const { data: receipts, isLoading: isReceiptsLoading } = useCollection<Receipt>(receiptsCollection);

  const deliveriesCollection = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'deliveryOrders');
  }, [firestore, user?.uid]);
  const { data: deliveries, isLoading: isDeliveriesLoading } = useCollection<DeliveryOrder>(deliveriesCollection);

  const transfersCollection = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'internalTransfers');
  }, [firestore, user?.uid]);
  const { data: transfers, isLoading: isTransfersLoading } = useCollection<InternalTransfer>(transfersCollection);

  const productsCollection = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsCollection);

  const warehousesCollection = useMemo(() => firestore ? collection(firestore, 'warehouses') : null, [firestore]);
  const { data: warehouses } = useCollection<Warehouse>(warehousesCollection);

  // KPI: Total Products in Stock
  const totalProductsInStock = useMemo(() => {
    if (!products) return 0;
    return products.reduce((sum, p) => sum + p.stock, 0);
  }, [products]);

  // KPI: Low Stock Items (stock <= reorderLevel)
  const lowStockItems = useMemo(() => {
    if (!products) return [];
    // Remove duplicates by using a Map with SKU as key
    const uniqueProducts = new Map<string, Product>();
    products.forEach(p => {
      if (!uniqueProducts.has(p.sku)) {
        uniqueProducts.set(p.sku, p);
      }
    });
    return Array.from(uniqueProducts.values()).filter(p => {
      const reorderLevel = p.reorderLevel || 10; // default to 10 if not set
      return p.stock > 0 && p.stock <= reorderLevel;
    });
  }, [products]);

  // KPI: Out of Stock Items
  const outOfStockItems = useMemo(() => {
    if (!products) return [];
    // Remove duplicates by using a Map with SKU as key
    const uniqueProducts = new Map<string, Product>();
    products.forEach(p => {
      if (!uniqueProducts.has(p.sku)) {
        uniqueProducts.set(p.sku, p);
      }
    });
    return Array.from(uniqueProducts.values()).filter(p => p.stock === 0 || p.stock < 0);
  }, [products]);

  // KPI: Internal Transfers Scheduled
  const scheduledTransfers = useMemo(() => {
    if (!transfers) return 0;
    return transfers.filter(t => t.status === 'Waiting' || t.status === 'Ready').length;
  }, [transfers]);

  const toReceiveCount = useMemo(() => {
    if (!receipts) return 0;
    return receipts.filter(r => r.status === 'Waiting' || r.status === 'Ready').length;
  }, [receipts]);
  
  const lateReceipts = useMemo(() => {
      if (!receipts) return 0;
      return receipts.filter(r => r.status === 'Waiting').length;
  }, [receipts]);

  const toDeliverCount = useMemo(() => {
      if (!deliveries) return 0;
      return deliveries.filter(d => d.status === 'Waiting' || d.status === 'Ready').length;
  }, [deliveries]);
  
  const lateDeliveries = useMemo(() => {
      if (!deliveries) return 0;
      return deliveries.filter(d => d.status === 'Waiting').length;
  }, [deliveries]);

  // Apply filters
  const filteredReceipts = useMemo(() => {
    if (!receipts) return [];
    let filtered = receipts;
    if (filterStatus !== "all") filtered = filtered.filter(r => r.status === filterStatus);
    if (filterType === "receipts" || filterType === "all") return filtered;
    return [];
  }, [receipts, filterStatus, filterType]);

  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return [];
    let filtered = deliveries;
    if (filterStatus !== "all") filtered = filtered.filter(d => d.status === filterStatus);
    if (filterType === "deliveries" || filterType === "all") return filtered;
    return [];
  }, [deliveries, filterStatus, filterType]);

  const filteredTransfers = useMemo(() => {
    if (!transfers) return [];
    let filtered = transfers;
    if (filterStatus !== "all") filtered = filtered.filter(t => t.status === filterStatus);
    if (filterType === "transfers" || filterType === "all") return filtered;
    return [];
  }, [transfers, filterStatus, filterType]);

  const showFilters = filterStatus !== "all" || filterType !== "all";

  if (isUserLoading || isReceiptsLoading || isDeliveriesLoading || isTransfersLoading || isProductsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
        
        {/* Low Stock Alerts */}
        {products && (lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <Alert variant="destructive" className="border-2 border-destructive shadow-lg min-h-fit" key="stock-alerts">
            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
            <AlertTitle className="text-xl font-bold">⚠️ Stock Alerts - Immediate Action Required</AlertTitle>
            <AlertDescription className="text-base">
              {outOfStockItems.length > 0 && (
                <div key="out-of-stock" className="mb-3 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <p className="font-bold text-lg mb-2">🔴 {outOfStockItems.length} items out of stock:</p>
                  <ul className="font-semibold space-y-1 ml-4 list-disc">
                    {outOfStockItems.slice(0, 5).map(p => (
                      <li key={p.id}>
                        {p.name} (SKU: {p.sku}) - Stock: {p.stock}
                      </li>
                    ))}
                    {outOfStockItems.length > 5 && (
                      <li className="list-none ml-[-1rem]">...and {outOfStockItems.length - 5} more items</li>
                    )}
                  </ul>
                </div>
              )}
              {lowStockItems.length > 0 && (
                <div key="low-stock" className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-600/20">
                  <p className="font-bold text-lg mb-2 text-yellow-700 dark:text-yellow-500">⚠️ {lowStockItems.length} items low on stock:</p>
                  <ul className="font-semibold text-yellow-800 dark:text-yellow-400 space-y-1 ml-4 list-disc">
                    {lowStockItems.slice(0, 5).map(p => (
                      <li key={p.id}>
                        {p.name} (SKU: {p.sku}) - Stock: {p.stock} / Reorder at: {p.reorderLevel || 10}
                      </li>
                    ))}
                    {lowStockItems.length > 5 && (
                      <li className="list-none ml-[-1rem]">...and {lowStockItems.length - 5} more items</li>
                    )}
                  </ul>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <Link href="/dashboard/products">
                  <Button variant="outline" className="font-bold">
                    📦 View All Products →
                  </Button>
                </Link>
                <Link href="/dashboard/reordering">
                  <Button className="font-bold">
                    🔄 View Reorder Suggestions →
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Dashboard Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filters</CardTitle>
              </div>
              {showFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterType("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Document Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="receipts">Receipts</SelectItem>
                    <SelectItem value="deliveries">Deliveries</SelectItem>
                    <SelectItem value="transfers">Transfers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
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
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products in Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProductsInStock}</div>
              <p className="text-xs text-muted-foreground">
                {products?.length || 0} unique products
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low / Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {lowStockItems.length + outOfStockItems.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {lowStockItems.length} low, {outOfStockItems.length} out
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{toReceiveCount}</div>
              <p className="text-xs text-muted-foreground">{lateReceipts} late</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Transfers</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledTransfers}</div>
              <p className="text-xs text-muted-foreground">
                {transfers?.length || 0} total transfers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Operations Cards - Filtered */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {(filterType === "all" || filterType === "receipts") && (
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle>Receipts</CardTitle>
                      <Link href="/dashboard/receipts">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                            All Receipts <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="text-3xl font-bold">
                        {showFilters ? filteredReceipts.length : toReceiveCount} 
                        {showFilters ? " Filtered" : " To Receive"}
                      </div>
                      {!showFilters && <p className="text-xs text-muted-foreground">{lateReceipts} late</p>}
                      {showFilters && filterStatus !== "all" && (
                        <Badge variant="outline">{filterStatus}</Badge>
                      )}
                  </CardContent>
              </Card>
            )}
            
            {(filterType === "all" || filterType === "deliveries") && (
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle>Delivery Orders</CardTitle>
                      <Link href="/dashboard/deliveries">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                            All Deliveries <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      {showFilters ? filteredDeliveries.length : toDeliverCount}
                      {showFilters ? " Filtered" : " To Deliver"}
                    </div>
                    {!showFilters && <p className="text-xs text-muted-foreground">{lateDeliveries} late</p>}
                    {showFilters && filterStatus !== "all" && (
                      <Badge variant="outline">{filterStatus}</Badge>
                    )}
                  </CardContent>
              </Card>
            )}

            {(filterType === "all" || filterType === "transfers") && filterType !== "receipts" && filterType !== "deliveries" && (
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle>Internal Transfers</CardTitle>
                      <Link href="/dashboard/transfers">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                            All Transfers <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      {showFilters ? filteredTransfers.length : scheduledTransfers}
                      {showFilters ? " Filtered" : " Scheduled"}
                    </div>
                    {showFilters && filterStatus !== "all" && (
                      <Badge variant="outline">{filterStatus}</Badge>
                    )}
                  </CardContent>
              </Card>
            )}
      </div>
    </div>
  );
}
