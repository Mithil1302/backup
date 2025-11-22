import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kpis, recentActivities } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function Dashboard() {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Done":
        return "default";
      case "Ready":
        return "secondary";
      case "Waiting":
        return "outline";
      case "Draft":
        return "outline";
      case "Canceled":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {kpis.map((kpi) => (
                <Card key={kpi.label}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        {kpi.change && (
                            <p className={cn("text-xs text-muted-foreground", {
                                "text-green-600": kpi.changeType === "increase",
                                "text-red-600": kpi.changeType === "decrease",
                            })}>
                                {kpi.change} from last month
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Recent Inventory Movements</CardTitle>
                <CardDescription>A log of the most recent stock operations.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <span>Filter</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Document Type</DropdownMenuItem>
                            <DropdownMenuItem>Status</DropdownMenuItem>
                            <DropdownMenuItem>Warehouse</DropdownMenuItem>
                            <DropdownMenuItem>Product Category</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex gap-2">
                        <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Document Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="receipts">Receipts</SelectItem>
                                <SelectItem value="delivery">Delivery</SelectItem>
                                <SelectItem value="internal">Internal</SelectItem>
                                <SelectItem value="adjustments">Adjustments</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="waiting">Waiting</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentActivities.map((activity) => (
                            <TableRow key={activity.id}>
                                <TableCell className="font-medium">{activity.type}</TableCell>
                                <TableCell>{activity.reference}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(activity.status)}>{activity.status}</Badge>
                                </TableCell>
                                <TableCell>{activity.date}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
