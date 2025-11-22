'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Receipt, DeliveryOrder } from "@/lib/types";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

export default function Dashboard() {
  const firestore = useFirestore();
  const { user } = useUser();

  // Data Hooks
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

  const toReceiveCount = useMemo(() => {
    return receipts.filter(r => r.status === 'Waiting' || r.status === 'Ready').length;
  }, [receipts]);
  
  const lateReceipts = useMemo(() => {
      // This is a placeholder for late logic.
      return receipts.filter(r => r.status === 'Waiting').length;
  }, [receipts]);

  const toDeliverCount = useMemo(() => {
      return deliveries.filter(d => d.status === 'Waiting' || d.status === 'Ready').length;
  }, [deliveries]);
  
  const lateDeliveries = useMemo(() => {
      // This is a placeholder for late logic.
      return deliveries.filter(d => d.status === 'Waiting').length;
  }, [deliveries]);

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button variant="outline" className="w-fit">
              {toReceiveCount} to receive
            </Button>
            <div className="flex items-center gap-4 text-sm">
                <span>{lateReceipts} Late</span>
                <span>{receipts.length} operations</span>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button variant="outline" className="w-fit">
                    {toDeliverCount} to Deliver
                </Button>
                 <div className="flex items-center gap-4 text-sm">
                    <span>{lateDeliveries} Late</span>
                    <span>{deliveries.filter(d => d.status === 'Waiting').length} waiting</span>
                    <span>{deliveries.length} operations</span>
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
