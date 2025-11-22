'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Archive, ArrowRightLeft, Boxes, Package, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, limit, orderBy, query } from "firebase/firestore";
import type { Product, Receipt, DeliveryOrder, InternalTransfer } from "@/lib/types";
import { useMemo } from "react";

export default function Dashboard() {
  const firestore = useFirestore();
  const { user } = useUser();

  // Data Hooks
  const { data: products } = useCollection<Product>(firestore ? collection(firestore, 'products') : null);

  const receiptsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'receipts'), orderBy('receiptDate', 'desc'), limit(5));
  }, [firestore, user?.uid]);
  const { data: receipts } = useCollection<Receipt>(receiptsQuery);

  const deliveriesQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'deliveryOrders'), orderBy('deliveryDate', 'desc'), limit(5));
  }, [firestore, user?.uid]);
  const { data: deliveries } = useCollection<DeliveryOrder>(deliveriesQuery);

  const transfersQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'internalTransfers'), orderBy('transferDate', 'desc'), limit(5));
  }, [firestore, user?.uid]);
  const { data: transfers } = useCollection<InternalTransfer>(transfersQuery);


  // KPI Calculations
  const totalStock = useMemo(() => products?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0, [products]);
  const lowStockCount = useMemo(() => products?.filter(p => p.stock < 50 && p.stock > 0).length || 0, [products]);
  const outOfStockCount = useMemo(() => products?.filter(p => p.stock === 0).length || 0, [products]);
  const pendingReceipts = useMemo(() => receipts?.filter(r => r.status === 'Waiting' || r.status === 'Ready').length || 0, [receipts]);
  const pendingDeliveries = useMemo(() => deliveries?.filter(d => d.status === 'Waiting' || d.status === 'Ready').length || 0, [deliveries]);
  
  const kpis = [
    { label: "Total Products in Stock", value: totalStock.toLocaleString(), icon: Boxes },
    { label: "Low / Out of Stock", value: `${lowStockCount} / ${outOfStockCount}`, icon: Archive },
    { label: "Pending Receipts", value: pendingReceipts, icon: Truck },
    { label: "Pending Deliveries", value: pendingDeliveries, icon: Package },
    { label: "Internal Transfers", value: transfers?.length || 0, icon: ArrowRightLeft },
  ];

  // Recent Activity Combination
  const recentActivities = useMemo(() => {
    const allActivities = [
      ...(receipts || []).map(r => ({ ...r, type: 'Receipt', date: r.receiptDate, ref: `RCPT-${r.id.substring(0, 6).toUpperCase()}` })),
      ...(deliveries || []).map(d => ({ ...d, type: 'Delivery', date: d.deliveryDate, ref: `DO-${d.id.substring(0, 6).toUpperCase()}` })),
      ...(transfers || []).map(t => ({ ...t, type: 'Transfer', date: t.transferDate, ref: `TRNS-${t.id.substring(0, 6).toUpperCase()}` })),
    ];
    // The toMillis() function might not exist on a Timestamp if it's not a real Timestamp object yet.
    // Firebase Timestamps are only guaranteed after data is fetched.
    return allActivities.sort((a, b) => (b.date?.toMillis() || 0) - (a.date?.toMillis() || 0)).slice(0, 7);
  }, [receipts, deliveries, transfers]);
  

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Done": return "default";
      case "Ready": return "secondary";
      case "Waiting": return "outline";
      case "Draft": return "outline";
      case "Canceled": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {kpis.map((kpi) => (
                <Card key={kpi.label}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Recent Inventory Movements</CardTitle>
                <CardDescription>A log of the most recent stock operations.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentActivities.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No recent activities.</TableCell></TableRow>}
                        {recentActivities.map((activity) => (
                            <TableRow key={activity.id}>
                                <TableCell className="font-medium">{activity.type}</TableCell>
                                <TableCell>{activity.ref}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(activity.status)}>{activity.status}</Badge>
                                </TableCell>
                                <TableCell>{activity.date?.toDate().toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
