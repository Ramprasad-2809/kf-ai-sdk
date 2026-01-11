import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, Boxes, Percent, TrendingUp } from "lucide-react";
import { Product } from "../../../../../app";
import { Roles } from "../../../../../app/types/roles";
import { StatCard } from "./StatCard";
import { CSSBarChart, BarChartData } from "./CSSBarChart";
import { AnalyticsTable, TableColumn } from "./AnalyticsTable";

const product = new Product(Roles.Seller);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export function ProductAnalytics() {
  // Query 1: Total Products Count
  const { data: totalProductsData, isLoading: isTotalLoading } = useQuery({
    queryKey: ["analytics", "total-products"],
    queryFn: () =>
      product.metric({
        GroupBy: [],
        Metric: [{ Field: "_id", Type: "Count" }],
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 2: Low Stock Count
  const { data: lowStockData, isLoading: isLowStockLoading } = useQuery({
    queryKey: ["analytics", "low-stock-count"],
    queryFn: () =>
      product.metric({
        GroupBy: [],
        Metric: [{ Field: "_id", Type: "Count" }],
        Filter: {
          Operator: "And",
          Condition: [
            { LHSField: "LowStock", Operator: "EQ", RHSValue: true, RHSType: "Constant" },
          ],
        },
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 3: Total Stock Units
  const { data: totalStockData, isLoading: isTotalStockLoading } = useQuery({
    queryKey: ["analytics", "total-stock"],
    queryFn: () =>
      product.metric({
        GroupBy: [],
        Metric: [{ Field: "Stock", Type: "Sum" }],
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 4: Average Discount
  const { data: avgDiscountData, isLoading: isAvgDiscountLoading } = useQuery({
    queryKey: ["analytics", "avg-discount"],
    queryFn: () =>
      product.metric({
        GroupBy: [],
        Metric: [{ Field: "Discount", Type: "Avg" }],
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 5: Products by Category
  const { data: byCategoryData, isLoading: isByCategoryLoading } = useQuery({
    queryKey: ["analytics", "by-category"],
    queryFn: () =>
      product.metric({
        GroupBy: ["Category"],
        Metric: [{ Field: "_id", Type: "Count" }],
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 6: Stock by Category
  const { data: stockByCategoryData, isLoading: isStockByCategoryLoading } = useQuery({
    queryKey: ["analytics", "stock-by-category"],
    queryFn: () =>
      product.metric({
        GroupBy: ["Category"],
        Metric: [
          { Field: "Stock", Type: "Sum" },
          { Field: "Stock", Type: "Avg" },
        ],
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 7: Price by Category
  const { data: priceByCategoryData, isLoading: isPriceByCategoryLoading } = useQuery({
    queryKey: ["analytics", "price-by-category"],
    queryFn: () =>
      product.metric({
        GroupBy: ["Category"],
        Metric: [
          { Field: "Price", Type: "Avg" },
          { Field: "Price", Type: "Min" },
          { Field: "Price", Type: "Max" },
        ],
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 8: Products by Warehouse
  const { data: byWarehouseData, isLoading: isByWarehouseLoading } = useQuery({
    queryKey: ["analytics", "by-warehouse"],
    queryFn: () =>
      product.metric({
        GroupBy: ["Warehouse"],
        Metric: [
          { Field: "_id", Type: "Count" },
          { Field: "Stock", Type: "Sum" },
        ],
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 9: Low Stock by Category
  const { data: lowStockByCategoryData, isLoading: isLowStockByCategoryLoading } = useQuery({
    queryKey: ["analytics", "low-stock-by-category"],
    queryFn: () =>
      product.metric({
        GroupBy: ["Category"],
        Metric: [{ Field: "_id", Type: "Count" }],
        Filter: {
          Operator: "And",
          Condition: [
            { LHSField: "LowStock", Operator: "EQ", RHSValue: true, RHSType: "Constant" },
          ],
        },
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 10: Products by Brand
  const { data: byBrandData, isLoading: isByBrandLoading } = useQuery({
    queryKey: ["analytics", "by-brand"],
    queryFn: () =>
      product.metric({
        GroupBy: ["Brand"],
        Metric: [{ Field: "_id", Type: "Count" }],
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Query 11: Discount by Category
  const { data: discountByCategoryData, isLoading: isDiscountByCategoryLoading } = useQuery({
    queryKey: ["analytics", "discount-by-category"],
    queryFn: () =>
      product.metric({
        GroupBy: ["Category"],
        Metric: [{ Field: "Discount", Type: "Avg" }],
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Transform data for charts
  const categoryChartData: BarChartData[] = (byCategoryData?.Data || []).map((item: any) => ({
    label: item.Category || "Unknown",
    value: item["count__id"] || 0,
  }));

  const stockByCategoryChartData: BarChartData[] = (stockByCategoryData?.Data || []).map((item: any) => ({
    label: item.Category || "Unknown",
    value: item["sum_Stock"] || 0,
    secondaryValue: item["avg_Stock"] || 0,
  }));

  const warehouseChartData: BarChartData[] = (byWarehouseData?.Data || []).map((item: any) => ({
    label: item.Warehouse || "Unknown",
    value: item["count__id"] || 0,
    secondaryValue: item["sum_Stock"] || 0,
  }));

  const lowStockCategoryChartData: BarChartData[] = (lowStockByCategoryData?.Data || []).map((item: any) => ({
    label: item.Category || "Unknown",
    value: item["count__id"] || 0,
  }));

  const brandChartData: BarChartData[] = (byBrandData?.Data || [])
    .map((item: any) => ({
      label: item.Brand || "Unknown",
      value: item["count__id"] || 0,
    }))
    .sort((a: BarChartData, b: BarChartData) => b.value - a.value)
    .slice(0, 10);

  const discountCategoryChartData: BarChartData[] = (discountByCategoryData?.Data || []).map((item: any) => ({
    label: item.Category || "Unknown",
    value: item["avg_Discount"] || 0,
  }));

  // Price analysis table data
  interface PriceAnalysisRow {
    Category: string;
    AvgPrice: number;
    MinPrice: number;
    MaxPrice: number;
  }

  const priceTableData: PriceAnalysisRow[] = (priceByCategoryData?.Data || []).map((item: any) => ({
    Category: item.Category || "Unknown",
    AvgPrice: item["avg_Price"] || 0,
    MinPrice: item["min_Price"] || 0,
    MaxPrice: item["max_Price"] || 0,
  }));

  const priceTableColumns: TableColumn<PriceAnalysisRow>[] = [
    { key: "Category", header: "Category", align: "left" },
    { key: "AvgPrice", header: "Avg Price", align: "right", format: formatCurrency },
    { key: "MinPrice", header: "Min Price", align: "right", format: formatCurrency },
    { key: "MaxPrice", header: "Max Price", align: "right", format: formatCurrency },
  ];

  // Extract values for stat cards
  const totalProducts = totalProductsData?.Data?.[0]?.["count__id"] || 0;
  const lowStockCount = lowStockData?.Data?.[0]?.["count__id"] || 0;
  const totalStock = totalStockData?.Data?.[0]?.["sum_Stock"] || 0;
  const avgDiscount = avgDiscountData?.Data?.[0]?.["avg_Discount"] || 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Product Analytics</h2>
          <p className="text-sm text-gray-500">Real-time insights into your inventory</p>
        </div>
      </div>

      {/* Hero Stat Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={totalProducts.toLocaleString()}
            icon={<Package className="h-5 w-5" />}
            isLoading={isTotalLoading}
            accent="blue"
          />
          <StatCard
            title="Low Stock Alerts"
            value={lowStockCount.toLocaleString()}
            icon={<AlertTriangle className="h-5 w-5" />}
            isLoading={isLowStockLoading}
            accent="red"
            valueClassName={lowStockCount > 0 ? "text-red-600" : ""}
          />
          <StatCard
            title="Total Stock Units"
            value={totalStock.toLocaleString()}
            icon={<Boxes className="h-5 w-5" />}
            isLoading={isTotalStockLoading}
            accent="green"
          />
          <StatCard
            title="Avg Discount"
            value={formatPercent(avgDiscount)}
            icon={<Percent className="h-5 w-5" />}
            isLoading={isAvgDiscountLoading}
            accent="orange"
          />
        </div>
      </section>

      {/* Main Charts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Distribution Overview</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent ml-4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CSSBarChart
            title="Products by Category"
            data={categoryChartData}
            isLoading={isByCategoryLoading}
            formatValue={(v) => `${v} products`}
            colorTheme="blue"
          />
          <CSSBarChart
            title="Stock Levels by Category"
            data={stockByCategoryChartData}
            isLoading={isStockByCategoryLoading}
            formatValue={(v) => `${v.toLocaleString()} units`}
            showSecondaryValue
            formatSecondaryValue={(v) => `avg: ${v.toFixed(0)}`}
            colorTheme="green"
          />
        </div>
      </section>

      {/* Warehouse & Alerts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Inventory Insights</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent ml-4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CSSBarChart
            title="Products by Warehouse"
            data={warehouseChartData}
            isLoading={isByWarehouseLoading}
            formatValue={(v) => `${v} products`}
            showSecondaryValue
            formatSecondaryValue={(v) => `${v.toLocaleString()} units`}
            colorTheme="purple"
          />
          <CSSBarChart
            title="Low Stock by Category"
            data={lowStockCategoryChartData}
            isLoading={isLowStockByCategoryLoading}
            formatValue={(v) => `${v} items`}
            colorTheme="red"
            emptyMessage="No low stock items"
          />
          <CSSBarChart
            title="Avg Discount by Category"
            data={discountCategoryChartData}
            isLoading={isDiscountByCategoryLoading}
            formatValue={formatPercent}
            colorTheme="orange"
          />
        </div>
      </section>

      {/* Brands & Pricing Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Brands & Pricing</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent ml-4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CSSBarChart
            title="Top Brands (by Product Count)"
            data={brandChartData}
            isLoading={isByBrandLoading}
            formatValue={(v) => `${v} products`}
            colorTheme="indigo"
          />
          <AnalyticsTable
            title="Price Range by Category"
            columns={priceTableColumns}
            data={priceTableData}
            isLoading={isPriceByCategoryLoading}
          />
        </div>
      </section>
    </div>
  );
}
