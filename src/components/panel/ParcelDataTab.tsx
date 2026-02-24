"use client";

import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatAcres, formatDate, formatPricePerSF } from "@/lib/formatters";
import { EntityLookupCard } from "./EntityLookupCard";

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-zinc-800/50">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs text-zinc-200 text-right">{value}</span>
    </div>
  );
}

export default function ParcelDataTab() {
  const p = useAppStore((s) => s.selectedParcel);
  if (!p) return null;

  return (
    <div className="space-y-4 mt-3">
      {/* Ownership */}
      <section>
        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Ownership
        </h3>
        <DataRow label="Owner" value={p.owner_name ?? "N/A"} />
        <DataRow label="Mailing Address" value={p.owner_mailing_address ?? "N/A"} />
      </section>

      {/* Entity Lookup */}
      {p.owner_name?.includes("LLC") || p.owner_name?.includes("Inc") || p.owner_name?.includes("LP") || p.owner_name?.includes("Trust") ? (
        <EntityLookupCard ownerName={p.owner_name} />
      ) : null}

      {/* Parcel Specs */}
      <section>
        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Parcel
        </h3>
        <DataRow label="Acreage" value={formatAcres(p.acres)} />
        <DataRow label="Land Use" value={p.land_use_code ?? "N/A"} />
        <DataRow label="Zoning" value={p.zoning ?? "N/A"} />
        <DataRow label="Year Built" value={p.year_built?.toString() ?? "N/A"} />
        <DataRow
          label="Building SF"
          value={p.building_sqft ? `${p.building_sqft.toLocaleString()} sf` : "N/A"}
        />
      </section>

      {/* Assessed Value */}
      <section>
        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Assessed Value
        </h3>
        <DataRow label="Total" value={formatCurrency(p.assessed_total)} />
        <DataRow label="Land" value={formatCurrency(p.assessed_land)} />
        <DataRow label="Improvement" value={formatCurrency(p.assessed_improvement)} />
      </section>

      {/* Last Sale */}
      <section>
        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Last Sale
        </h3>
        <DataRow label="Date" value={formatDate(p.last_sale_date)} />
        <DataRow label="Price" value={formatCurrency(p.last_sale_price)} />
        <DataRow label="$/SF" value={formatPricePerSF(p.last_sale_price, p.building_sqft)} />
      </section>
    </div>
  );
}
