'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Customer } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";

export default function CustomersPage() {
  const firestore = useFirestore();
  const customersCollection = firestore ? collection(firestore, 'customers') : null;
  const { data: customers, isLoading } = useCollection<Customer>(customersCollection);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleAddCustomer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customersCollection) return;
    const formData = new FormData(event.currentTarget);
    const newCustomer = {
      name: formData.get('name') as string,
      contactEmail: formData.get('email') as string,
      shippingAddress: formData.get('address') as string,
    };
    addDocumentNonBlocking(customersCollection, newCustomer);
    setIsSheetOpen(false);
  };
  
  const handleUpdateCustomer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !editingCustomer) return;
    const formData = new FormData(event.currentTarget);
    const updatedCustomer = {
      name: formData.get('name') as string,
      contactEmail: formData.get('email') as string,
      shippingAddress: formData.get('address') as string,
    };
    const customerDoc = doc(firestore, 'customers', editingCustomer.id);
    updateDocumentNonBlocking(customerDoc, updatedCustomer);
    setIsSheetOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'customers', id);
    deleteDocumentNonBlocking(docRef);
  }
  
  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setEditingCustomer(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers">
        <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
          <SheetTrigger asChild>
            <Button size="sm" className="flex items-center gap-2" onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              <span>Add Customer</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingCustomer ? 'Edit Customer' : 'Add a new customer'}</SheetTitle>
              <SheetDescription>
                {editingCustomer ? 'Update the details of your customer.' : 'Fill in the details below to create a new customer.'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input name="name" id="name" defaultValue={editingCustomer?.name} placeholder="John Doe" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Contact Email</Label>
                <Input name="email" id="email" type="email" defaultValue={editingCustomer?.contactEmail} placeholder="john.doe@example.com" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">Shipping Address</Label>
                <Input name="address" id="address" defaultValue={editingCustomer?.shippingAddress} placeholder="123 Main St" className="col-span-3" required />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" type="button" onClick={handleSheetClose}>Cancel</Button>
                <Button type="submit">{editingCustomer ? 'Save Changes' : 'Create Customer'}</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>Manage your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Shipping Address</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>}
              {customers && customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.contactEmail}</TableCell>
                  <TableCell>{customer.shippingAddress}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditClick(customer)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="text-destructive">Delete</DropdownMenuItem>
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
