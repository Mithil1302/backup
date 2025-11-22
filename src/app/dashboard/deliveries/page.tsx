'use client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import type { DeliveryOrder, Customer } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import React, {useState, useMemo} from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";


export default function DeliveriesPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const deliveriesCollection = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'deliveryOrders');
    }, [firestore, user?.uid]);
    const { data: deliveries, isLoading } = useCollection<DeliveryOrder>(deliveriesCollection);

    const customersCollection = useMemo(() => firestore ? collection(firestore, 'customers') : null, [firestore]);
    const { data: customers } = useCollection<Customer>(customersCollection);

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

    const handleAddDelivery = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!deliveriesCollection) return;
      const formData = new FormData(event.currentTarget);
      const customerId = formData.get('customerId') as string;

      if (!customerId) {
        toast({
            variant: "destructive",
            title: "Customer not selected",
            description: "Please select a customer for the delivery.",
        });
        return;
      }

      addDocumentNonBlocking(deliveriesCollection, {
        customerId,
        deliveryDate: serverTimestamp(),
        status: 'Draft',
      }).then(() => {
        toast({
            title: "Delivery Order Created",
            description: "The new delivery order has been saved in draft status.",
        });
        setIsSheetOpen(false);
      });
    };
    
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Delivery Orders">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="flex items-center gap-2" onClick={() => setIsSheetOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                <span>New Delivery Order</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Create a new delivery</SheetTitle>
                    <SheetDescription>Select a customer to start a new delivery order.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleAddDelivery} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select name="customerId">
                            <SelectTrigger>
                                <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" type="button" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Delivery</Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Outgoing Shipments</CardTitle>
          <CardDescription>Manage and track all outgoing deliveries to customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
              {!isLoading && deliveries.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No delivery orders found.</TableCell></TableRow>}
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">DO-{delivery.id.substring(0, 6).toUpperCase()}</TableCell>
                   <TableCell>{customers?.find(c => c.id === delivery.customerId)?.name || 'N/A'}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(delivery.status)}>{delivery.status}</Badge></TableCell>
                  <TableCell>{delivery.deliveryDate?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Pick Items</DropdownMenuItem>
                        <DropdownMenuItem>Validate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
