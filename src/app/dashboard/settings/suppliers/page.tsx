'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Supplier } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";

export default function SuppliersPage() {
  const firestore = useFirestore();
  const suppliersCollection = firestore ? collection(firestore, 'suppliers') : null;
  const { data: suppliers, isLoading } = useCollection<Supplier>(suppliersCollection);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const handleAddSupplier = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!suppliersCollection) return;
    const formData = new FormData(event.currentTarget);
    const newSupplier = {
      name: formData.get('name') as string,
      contactEmail: formData.get('email') as string,
    };
    addDocumentNonBlocking(suppliersCollection, newSupplier);
    setIsSheetOpen(false);
  };
  
  const handleUpdateSupplier = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !editingSupplier) return;
    const formData = new FormData(event.currentTarget);
    const updatedSupplier = {
      name: formData.get('name') as string,
      contactEmail: formData.get('email') as string,
    };
    const supplierDoc = doc(firestore, 'suppliers', editingSupplier.id);
    updateDocumentNonBlocking(supplierDoc, updatedSupplier);
    setIsSheetOpen(false);
    setEditingSupplier(null);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'suppliers', id);
    deleteDocumentNonBlocking(docRef);
  }
  
  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Suppliers">
        <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
          <SheetTrigger asChild>
            <Button size="sm" className="flex items-center gap-2" onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              <span>Add Supplier</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingSupplier ? 'Edit Supplier' : 'Add a new supplier'}</SheetTitle>
              <SheetDescription>
                {editingSupplier ? 'Update the details for your supplier.' : 'Fill in the details below to create a new supplier.'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={editingSupplier ? handleUpdateSupplier : handleAddSupplier} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input name="name" id="name" defaultValue={editingSupplier?.name} placeholder="Global Fresh Produce" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Contact Email</Label>
                <Input name="email" id="email" type="email" defaultValue={editingSupplier?.contactEmail} placeholder="contact@globalfresh.com" className="col-span-3" required />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" type="button" onClick={handleSheetClose}>Cancel</Button>
                <Button type="submit">{editingSupplier ? 'Save Changes' : 'Create Supplier'}</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
          <CardDescription>Manage your product suppliers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>}
              {suppliers && suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactEmail}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditClick(supplier)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(supplier.id)} className="text-destructive">Delete</DropdownMenuItem>
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
