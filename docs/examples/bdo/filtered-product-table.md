# Filtered Product Table

> Filter products by category and price range using the integrated `table.filter` API.

```tsx
import { useState, useMemo } from "react";
import { useBDOTable } from "@ram_28/kf-ai-sdk/table";
import type { UseBDOTableReturnType } from "@ram_28/kf-ai-sdk/table/types";
import { ConditionOperator, RHSType } from "@ram_28/kf-ai-sdk/table";
import { BuyerProduct } from "@/bdo/buyer/Product";

export default function FilteredProductTable() {
  const product = useMemo(() => new BuyerProduct(), []);
  const table: UseBDOTableReturnType<BuyerProduct> = useBDOTable({ bdo: product });

  // ── Category filter (single EQ condition) ─────────────────────
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categoryConditionId, setCategoryConditionId] = useState<string | null>(null);

  const handleCategoryFilter = (value: string) => {
    if (categoryConditionId) {
      table.filter.removeCondition(categoryConditionId);
      setCategoryConditionId(null);
    }
    setCategoryFilter(value);
    if (value && value !== "all") {
      const id = table.filter.addCondition({
        LHSField: "Category",
        Operator: ConditionOperator.EQ,
        RHSType: RHSType.Constant,
        RHSValue: value,
      });
      setCategoryConditionId(id);
    }
  };

  // ── Price range filter (GTE + LTE conditions) ─────────────────
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPriceConditionId, setMinPriceConditionId] = useState<string | null>(null);
  const [maxPriceConditionId, setMaxPriceConditionId] = useState<string | null>(null);

  const applyPriceFilter = () => {
    if (minPriceConditionId) { table.filter.removeCondition(minPriceConditionId); setMinPriceConditionId(null); }
    if (maxPriceConditionId) { table.filter.removeCondition(maxPriceConditionId); setMaxPriceConditionId(null); }

    if (minPrice !== "") {
      const id = table.filter.addCondition({
        LHSField: "Price", Operator: ConditionOperator.GTE, RHSType: RHSType.Constant, RHSValue: Number(minPrice),
      });
      setMinPriceConditionId(id);
    }
    if (maxPrice !== "") {
      const id = table.filter.addCondition({
        LHSField: "Price", Operator: ConditionOperator.LTE, RHSType: RHSType.Constant, RHSValue: Number(maxPrice),
      });
      setMaxPriceConditionId(id);
    }
  };

  if (table.isLoading) return <p>Loading...</p>;

  return (
    <div>
      {/* Category dropdown */}
      <select value={categoryFilter} onChange={(e) => handleCategoryFilter(e.target.value)}>
        <option value="all">All categories</option>
        {product.Category.options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Price range */}
      <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
      <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      <button onClick={applyPriceFilter}>Apply</button>

      {/* Table */}
      <table>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row._id}>
              <td>{row.Title.get()}</td>
              <td>${row.Price.get()?.toFixed(2)}</td>
              <td>{row.Category.get()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Key Patterns

- **`addCondition()` returns an ID** -- store it in state to remove the condition later with `removeCondition(id)`
- **Category filter** -- single `ConditionOperator.EQ` condition; remove-then-add on every change
- **Price range** -- two separate conditions (`GTE` and `LTE`), each tracked by its own ID
- **Filter changes auto-reset pagination** -- when conditions change, the table resets to page 1
