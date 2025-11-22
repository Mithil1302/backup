'use client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, addDocumentNonBlocking, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import type { DeliveryOrder, Customer } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import React, {useState, useMemo} from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Truck, MapPin, Mail, Package } from "lucide-react";


export default function DeliveriesPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    const deliveriesCollection = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'deliveryOrders');
    }, [firestore, user?.uid]);
    const { data: deliveries, isLoading: isDeliveriesLoading } = useCollection<DeliveryOrder>(deliveriesCollection);

    const customersCollection = useMemo(() => firestore ? collection(firestore, 'customers') : null, [firestore]);
    const { data: customers, isLoading: isCustomersLoading } = useCollection<Customer>(customersCollection);

    const getStatusVariant = (status: string) => {
        switch (status) {
          case "Done": return "default";
          case "Ready": return "secondary";
          case "Packing": return "secondary";
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

    const handleValidateDelivery = (deliveryId: string) => {
      if (!firestore || !user?.uid) return;
      const deliveryDoc = doc(firestore, 'users', user.uid, 'deliveryOrders', deliveryId);
      updateDocumentNonBlocking(deliveryDoc, { status: 'Done' });
      toast({
        title: "Delivery Validated",
        description: "The delivery has been marked as done.",
      });
    };

    const handlePickItems = (deliveryId: string) => {
      if (!firestore || !user?.uid) return;
      const deliveryDoc = doc(firestore, 'users', user.uid, 'deliveryOrders', deliveryId);
      updateDocumentNonBlocking(deliveryDoc, { status: 'Packing' });
      toast({
        title: "Items Picked",
        description: "The items have been picked and are ready for packing.",
      });
    };

    const handlePackItems = (deliveryId: string) => {
      if (!firestore || !user?.uid) return;
      const deliveryDoc = doc(firestore, 'users', user.uid, 'deliveryOrders', deliveryId);
      updateDocumentNonBlocking(deliveryDoc, { status: 'Ready' });
      toast({
        title: "Items Packed",
        description: "The delivery has been packed and is ready for shipment.",
      });
    };

    const handleCancelDelivery = (deliveryId: string) => {
      if (!firestore || !user?.uid) return;
      const deliveryDoc = doc(firestore, 'users', user.uid, 'deliveryOrders', deliveryId);
      updateDocumentNonBlocking(deliveryDoc, { status: 'Canceled' });
      toast({
        variant: "destructive",
        title: "Delivery Canceled",
        description: "The delivery has been canceled.",
      });
    };

    const handleViewDetails = (deliveryId: string) => {
      const delivery = deliveries?.find(d => d.id === deliveryId);
      if (delivery) {
        setSelectedDelivery(delivery);
        setIsDetailDialogOpen(true);
      }
    };

    if (isUserLoading || isCustomersLoading || isDeliveriesLoading) {
      return <div>Loading...</div>;
    }
    
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this delivery order
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Reference Number</Label>
                  <p className="text-lg font-semibold">DO-{selectedDelivery.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={getStatusVariant(selectedDelivery.status)} className="text-sm">
                      {selectedDelivery.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Customer Information
                </h3>
                {customers?.find(c => c.id === selectedDelivery.customerId) && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Name</Label>
                      <p className="font-medium">{customers.find(c => c.id === selectedDelivery.customerId)?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </Label>
                      <p className="text-sm">{customers.find(c => c.id === selectedDelivery.customerId)?.contactEmail}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-muted-foreground text-xs">Shipping Address</Label>
                      <p className="text-sm">{customers.find(c => c.id === selectedDelivery.customerId)?.shippingAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Delivery Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Delivery Date</Label>
                    <p className="font-medium">{selectedDelivery.deliveryDate?.toDate().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p className="text-xs text-muted-foreground">{selectedDelivery.deliveryDate?.toDate().toLocaleTimeString()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Document ID</Label>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{selectedDelivery.id}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
                {selectedDelivery.status === 'Draft' && (
                  <Button variant="secondary" onClick={() => {
                    handlePickItems(selectedDelivery.id);
                    setIsDetailDialogOpen(false);
                  }}>
                    <Package className="h-4 w-4 mr-2" />
                    Pick Items
                  </Button>
                )}
                {selectedDelivery.status === 'Packing' && (
                  <Button variant="secondary" onClick={() => {
                    handlePackItems(selectedDelivery.id);
                    setIsDetailDialogOpen(false);
                  }}>
                    <Package className="h-4 w-4 mr-2" />
                    Pack Items
                  </Button>
                )}
                {(selectedDelivery.status === 'Ready' || selectedDelivery.status === 'Waiting') && (
                  <Button onClick={() => {
                    handleValidateDelivery(selectedDelivery.id);
                    setIsDetailDialogOpen(false);
                  }}>
                    <Truck className="h-4 w-4 mr-2" />
                    Validate Delivery
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
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
              {!deliveries && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
              {deliveries && deliveries.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No delivery orders found.</TableCell></TableRow>}
              {deliveries && deliveries.map((delivery) => (
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
                        <DropdownMenuItem onClick={() => handleViewDetails(delivery.id)}>View Details</DropdownMenuItem>
                        {delivery.status === 'Draft' && (
                          <DropdownMenuItem onClick={() => handlePickItems(delivery.id)}>Pick Items</DropdownMenuItem>
                        )}
                        {delivery.status === 'Packing' && (
                          <DropdownMenuItem onClick={() => handlePackItems(delivery.id)}>Pack Items</DropdownMenuItem>
                        )}
                        {(delivery.status === 'Ready' || delivery.status === 'Waiting') && (
                          <DropdownMenuItem onClick={() => handleValidateDelivery(delivery.id)}>Validate</DropdownMenuItem>
                        )}
                        {delivery.status !== 'Done' && delivery.status !== 'Canceled' && (
                          <DropdownMenuItem className="text-destructive" onClick={() => handleCancelDelivery(delivery.id)}>Cancel</DropdownMenuItem>
                        )}
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
