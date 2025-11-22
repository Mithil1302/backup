'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Product } from "@/lib/types";
import React from "react";

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: products, isLoading } = useCollection<Product>(productsCollection);

  const handleAddProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newProduct = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as string,
      unitOfMeasure: formData.get('uom') as string,
      stock: Number(formData.get('stock') || 0),
    };
    addDocumentNonBlocking(productsCollection, newProduct);
    // Maybe close sheet after submit, for now we leave it open
    // (event.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Products">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Add Product</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add a new product</SheetTitle>
              <SheetDescription>
                Fill in the details below to create a new product in your inventory.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleAddProduct} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input name="name" id="name" placeholder="Organic Bananas" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sku" className="text-right">SKU/Code</Label>
                <Input name="sku" id="sku" placeholder="FR-BAN-001" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Input name="category" id="category" placeholder="Fruits" className="col-span-3" required/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uom" className="text-right">Unit of Measure</Label>
                <Input name="uom" id="uom" placeholder="kg" className="col-span-3" required/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">Initial Stock</Label>
                <Input name="stock" id="stock" type="number" placeholder="0" className="col-span-3" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <SheetTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetTrigger>
                <Button type="submit">Create Product</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>Manage your products and their stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>}
              {products && products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                  <TableCell>
                    <span className={cn({ "text-red-500 font-bold": product.stock === 0, "text-yellow-500 font-bold": product.stock > 0 && product.stock < 50})}>
                      {product.stock} {product.unitOfMeasure}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
