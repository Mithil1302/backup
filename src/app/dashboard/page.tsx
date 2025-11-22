'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Receipt, DeliveryOrder } from "@/lib/types";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Dashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

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

  const toReceiveCount = useMemo(() => {
    if (!receipts) return 0;
    return receipts.filter(r => r.status === 'Waiting' || r.status === 'Ready').length;
  }, [receipts]);
  
  const lateReceipts = useMemo(() => {
      if (!receipts) return 0;
      // This is a placeholder for late logic.
      return receipts.filter(r => r.status === 'Waiting').length;
  }, [receipts]);

  const toDeliverCount = useMemo(() => {
      if (!deliveries) return 0;
      return deliveries.filter(d => d.status === 'Waiting' || d.status === 'Ready').length;
  }, [deliveries]);
  
  const lateDeliveries = useMemo(() => {
      if (!deliveries) return 0;
      // This is a placeholder for late logic.
      return deliveries.filter(d => d.status === 'Waiting').length;
  }, [deliveries]);

  if (isUserLoading || isReceiptsLoading || isDeliveriesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
                    <div className="text-3xl font-bold">{toReceiveCount} To Receive</div>
                    <p className="text-xs text-muted-foreground">{lateReceipts} late</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Delivery Orders</CardTitle>
                    <Link href="/dashboard/deliveries">
                       <Button variant="outline" size="sm" className="flex items-center gap-1">
                          All Delivery Orders <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="text-3xl font-bold">{toDeliverCount} To Deliver</div>
                   <p className="text-xs text-muted-foreground">{lateDeliveries} late</p>
                </CardContent>
            </Card>
      </div>
    </div>
  );
}
