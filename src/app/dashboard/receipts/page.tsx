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
import type { Receipt } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import React, { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Supplier } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Package, MapPin, Mail } from "lucide-react";

export default function ReceiptsPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    const receiptsCollection = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'receipts');
    }, [firestore, user?.uid]);
    const { data: receipts, isLoading: isReceiptsLoading } = useCollection<Receipt>(receiptsCollection);

    const suppliersCollection = useMemo(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
    const { data: suppliers, isLoading: isSuppliersLoading } = useCollection<Supplier>(suppliersCollection);

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
    
    const handleAddReceipt = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!receiptsCollection) return;
      const formData = new FormData(event.currentTarget);
      const supplierId = formData.get('supplierId') as string;
      
      if (!supplierId) {
        toast({
            variant: "destructive",
            title: "Supplier not selected",
            description: "Please select a supplier for the receipt.",
        });
        return;
      }
      
      addDocumentNonBlocking(receiptsCollection, {
        supplierId: supplierId,
        receiptDate: serverTimestamp(),
        status: 'Draft',
      }).then(() => {
        toast({
            title: "Receipt Created",
            description: "The new receipt has been saved in draft status.",
        });
        setIsSheetOpen(false);
      });
    };

    const handleValidateReceipt = (receiptId: string) => {
      if (!firestore || !user?.uid) return;
      const receiptDoc = doc(firestore, 'users', user.uid, 'receipts', receiptId);
      updateDocumentNonBlocking(receiptDoc, { status: 'Done' });
      toast({
        title: "Receipt Validated",
        description: "The receipt has been marked as done.",
      });
    };

    const handleCancelReceipt = (receiptId: string) => {
      if (!firestore || !user?.uid) return;
      const receiptDoc = doc(firestore, 'users', user.uid, 'receipts', receiptId);
      updateDocumentNonBlocking(receiptDoc, { status: 'Canceled' });
      toast({
        variant: "destructive",
        title: "Receipt Canceled",
        description: "The receipt has been canceled.",
      });
    };

    const handleViewDetails = (receiptId: string) => {
      const receipt = receipts?.find(r => r.id === receiptId);
      if (receipt) {
        setSelectedReceipt(receipt);
        setIsDetailDialogOpen(true);
      }
    };

    if (isUserLoading || isSuppliersLoading || isReceiptsLoading) {
      return <div>Loading...</div>;
    }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Receipts">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="flex items-center gap-2" onClick={() => setIsSheetOpen(true)}>
                  <PlusCircle className="h-4 w-4" />
                  <span>New Receipt</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Create a new receipt</SheetTitle>
                    <SheetDescription>Select a supplier to start a new stock receipt.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleAddReceipt} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Supplier</Label>
                        <Select name="supplierId">
                            <SelectTrigger>
                                <SelectValue placeholder="Select a supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" type="button" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Receipt</Button>
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
              <Package className="h-5 w-5" />
              Receipt Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this stock receipt
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Reference Number</Label>
                  <p className="text-lg font-semibold">RCPT-{selectedReceipt.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={getStatusVariant(selectedReceipt.status)} className="text-sm">
                      {selectedReceipt.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Supplier Information
                </h3>
                {suppliers?.find(s => s.id === selectedReceipt.supplierId) && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Name</Label>
                      <p className="font-medium">{suppliers.find(s => s.id === selectedReceipt.supplierId)?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </Label>
                      <p className="text-sm">{suppliers.find(s => s.id === selectedReceipt.supplierId)?.contactEmail}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Receipt Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Receipt Date</Label>
                    <p className="font-medium">{selectedReceipt.receiptDate?.toDate().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p className="text-xs text-muted-foreground">{selectedReceipt.receiptDate?.toDate().toLocaleTimeString()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Document ID</Label>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{selectedReceipt.id}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
                {selectedReceipt.status !== 'Done' && selectedReceipt.status !== 'Canceled' && (
                  <Button onClick={() => {
                    handleValidateReceipt(selectedReceipt.id);
                    setIsDetailDialogOpen(false);
                  }}>
                    Validate Receipt
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Incoming Stock Receipts</CardTitle>
          <CardDescription>Log and manage all incoming stock from vendors.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!receipts && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
              {receipts && receipts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No receipts found.</TableCell></TableRow>}
              {receipts && receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">RCPT-{receipt.id.substring(0, 6).toUpperCase()}</TableCell>
                  <TableCell>{suppliers?.find(s => s.id === receipt.supplierId)?.name || 'N/A'}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(receipt.status)}>{receipt.status}</Badge></TableCell>
                  <TableCell>{receipt.receiptDate?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(receipt.id)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleValidateReceipt(receipt.id)}>Validate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleCancelReceipt(receipt.id)}>Cancel</DropdownMenuItem>
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
