"use client";

import type { Parcel } from "@/lib/types";
import { formatCurrency, formatAcres, formatDate, formatPricePerSqFt } from "@/lib/formatters";

export default function ParcelDataTab({ parcel }: { parcel: Parcel }) {
  return (
    <div className="flex flex-col gap-0 p-4">
      <Section title="Ownership">
        <DataRow label="Owner" value={parcel.owner_name} />
        <DataRow label="Mailing Address" value={parcel.owner_mailing_address} />
      </Section>

      <Section title="Parcel">
        <DataRow label="APN" value={parcel.apn} />
        <DataRow label="Acreage" value={formatAcres(parcel.acres)} />
        <DataRow label="Land Use" value={parcel.land_use_code} />
        <DataRow label="Zoning" value={parcel.zoning} highlight />
      </Section>

      <Section title="Assessed Value">
        <DataRow label="Total Assessed" value={formatCurrency(parcel.assessed_total)} />
        {parcel.acres && parcel.assessed_total && (
          <DataRow
            label="Per Acre"
            value={formatCurrency(parcel.assessed_total / parcel.acres)}
          />
        )}
      </Section>

      <Section title="Last Sale">
        <DataRow label="Date" value={formatDate(parcel.last_sale_date)} />
        <DataRow label="Price" value={formatCurrency(parcel.last_sale_price)} />
        <DataRow
          label="Price/SF"
          value={formatPricePerSqFt(parcel.last_sale_price, parcel.acres)}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <h3 className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-pd-muted">
        {title}
      </h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function DataRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-mono text-[10px] text-mid">{label}</span>
      <span
        className={`text-right text-[12px] ${
          highlight
            ? "rounded bg-teal-dim px-1.5 py-0.5 font-mono text-[10px] font-medium text-teal"
            : "text-bright"
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}
