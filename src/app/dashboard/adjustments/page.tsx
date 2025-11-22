import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { products } from "@/lib/data";
import { PlusCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function AdjustmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Stock Adjustments">
        <Button size="sm" className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>Start Cycle Count</span>
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Inventory Adjustment</CardTitle>
          <CardDescription>Correct stock levels by performing a physical count.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">1. Select Product & Location</h3>
                    <div className="space-y-2">
                        <Label>Select Warehouse</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a warehouse..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="wh-main">Main Warehouse</SelectItem>
                                <SelectItem value="wh-cold">Cold Storage Unit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Search Product</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by name or SKU..." className="pl-8" />
                        </div>
                    </div>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg">2. Enter Counted Quantity</h3>
                     <div className="space-y-2">
                        <Label htmlFor="counted-qty">Counted Quantity</Label>
                        <Input id="counted-qty" type="number" placeholder="Enter the physical count" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Recorded Quantity: <span className="font-bold text-foreground">1500 kg</span></p>
                        <p className="text-sm text-muted-foreground">Difference: <span className="font-bold text-red-500">-5 kg</span></p>
                    </div>
                    <Button>Apply Adjustment</Button>
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4">Recent Adjustments</h3>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Counted Qty</TableHead>
                            <TableHead>Recorded Qty</TableHead>
                             <TableHead>Difference</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>Fresh Tomatoes</TableCell>
                            <TableCell>Main Warehouse</TableCell>
                            <TableCell>245 kg</TableCell>
                            <TableCell>250 kg</TableCell>
                            <TableCell className="text-red-500">-5 kg</TableCell>
                            <TableCell>2024-07-18</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>Sourdough Bread</TableCell>
                            <TableCell>Retail Backroom</TableCell>
                            <TableCell>76 units</TableCell>
                            <TableCell>75 units</TableCell>
                            <TableCell className="text-green-500">+1 unit</TableCell>
                            <TableCell>2024-07-17</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
