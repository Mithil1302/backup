'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Warehouse } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";

export default function WarehousesPage() {
  const firestore = useFirestore();
  const warehousesCollection = firestore ? collection(firestore, 'warehouses') : null;
  const { data: warehouses, isLoading } = useCollection<Warehouse>(warehousesCollection);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const handleAddWarehouse = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!warehousesCollection) return;
    const formData = new FormData(event.currentTarget);
    const newWarehouse = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      capacity: Number(formData.get('capacity') || 0),
    };
    addDocumentNonBlocking(warehousesCollection, newWarehouse);
    setIsSheetOpen(false);
  };
  
  const handleUpdateWarehouse = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !editingWarehouse) return;
    const formData = new FormData(event.currentTarget);
    const updatedWarehouse = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      capacity: Number(formData.get('capacity') || 0),
    };
    const warehouseDoc = doc(firestore, 'warehouses', editingWarehouse.id);
    updateDocumentNonBlocking(warehouseDoc, updatedWarehouse);
    setIsSheetOpen(false);
    setEditingWarehouse(null);
  };
  
  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'warehouses', id);
    deleteDocumentNonBlocking(docRef);
  }
  
  const handleEditClick = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setEditingWarehouse(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Warehouses">
        <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
          <SheetTrigger asChild>
            <Button size="sm" className="flex items-center gap-2" onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              <span>Add Warehouse</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingWarehouse ? 'Edit Warehouse' : 'Add a new warehouse'}</SheetTitle>
              <SheetDescription>
                {editingWarehouse ? 'Update the details of your warehouse.' : 'Fill in the details below to create a new warehouse.'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={editingWarehouse ? handleUpdateWarehouse : handleAddWarehouse} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input name="name" id="name" defaultValue={editingWarehouse?.name} placeholder="Main Warehouse" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input name="location" id="location" defaultValue={editingWarehouse?.location} placeholder="123 Industrial Rd" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">Capacity</Label>
                <Input name="capacity" id="capacity" type="number" defaultValue={editingWarehouse?.capacity} placeholder="10000" className="col-span-3" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" type="button" onClick={handleSheetClose}>Cancel</Button>
                <Button type="submit">{editingWarehouse ? 'Save Changes' : 'Create Warehouse'}</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Locations</CardTitle>
          <CardDescription>Manage your physical stock locations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>}
              {warehouses && warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell>{warehouse.location}</TableCell>
                  <TableCell>{warehouse.capacity?.toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditClick(warehouse)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View Stock</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(warehouse.id)} className="text-destructive">Delete</DropdownMenuItem>
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
