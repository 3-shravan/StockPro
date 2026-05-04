import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Reports</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">Loading...</p>
            <p className="text-xs text-muted-foreground">Across all warehouses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">Loading...</p>
            <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active POs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">Loading...</p>
            <p className="text-xs text-muted-foreground">Pending fulfillment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-md">
          Report charts and detailed data tables will be rendered here.
        </CardContent>
      </Card>
    </div>
  );
}
