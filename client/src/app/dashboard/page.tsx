"use client";

import { useEffect, useState } from "react";
import { productsApi, Product } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Package, DollarSign, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const chartConfig: ChartConfig = {
  predicted: { label: "Forecast ($)", color: "hsl(var(--chart-1))" },
  revenue: { label: "Revenue ($)", color: "hsl(var(--chart-2))" },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    productsApi
      .getAll()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalForecast = products.reduce(
    (sum, p) => sum + p.forecasts.reduce((s, f) => s + f.predicted, 0),
    0
  );

  const productCount = products.length;

  const forecastChartData = products.slice(0, 6).map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
    predicted: Math.round(p.forecasts.reduce((s, f) => s + f.predicted, 0)),
  }));

  // Build timeline from first product's forecasts
  const timelineData =
    products[0]?.forecasts.slice(0, 14).map((f) => ({
      date: new Date(f.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      predicted: Math.round(f.predicted),
    })) ?? [];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {user?.email}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{productCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">30-Day Forecast</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${totalForecast.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              Active
            </Badge>
          </CardContent>
        </Card>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading data...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && products.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">No data yet</p>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to see your sales analytics and forecasts.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Forecast by product */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Forecast by Product</CardTitle>
              <CardDescription>Predicted 30-day revenue per product</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <BarChart data={forecastChartData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="predicted" fill="var(--color-predicted)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Forecast timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Forecast Timeline</CardTitle>
              <CardDescription>Next 14 days — {products[0]?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <AreaChart data={timelineData} margin={{ left: -10 }}>
                  <defs>
                    <linearGradient id="fillPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-predicted)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-predicted)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="var(--color-predicted)"
                    fill="url(#fillPredicted)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Products table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Products</CardTitle>
              <CardDescription>All tracked products with forecast totals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">Product</th>
                      <th className="text-left py-2 pr-4 font-medium">Category</th>
                      <th className="text-right py-2 font-medium">30-Day Forecast</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{p.name}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary">{p.category ?? "—"}</Badge>
                        </td>
                        <td className="py-2 text-right">
                          ${p.forecasts.reduce((s, f) => s + f.predicted, 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
