"use client";

import type { Parcel } from "@/lib/types";
import { formatCurrency, formatAcres, formatDate, formatPricePerSqFt } from "@/lib/formatters";

export default function ParcelDataTab({ parcel }: { parcel: Parcel }) {
  return (
    <div className="flex flex-col gap-0 p-4">
      <Section title="Ownership">
        <DataRow label="Owner" value={parcel.owner_name} />
        <DataRow label="Mailing Address" value={parcel.owner_mailing_address} />
        {parcel.previous_owners && parcel.previous_owners.length > 0 && (
          <DataRow
            label="Previous Owner"
            value={parcel.previous_owners[0]}
            subtle
          />
        )}
      </Section>

      <Section title="Parcel">
        <DataRow label="APN" value={parcel.apn} />
        <DataRow label="County" value={parcel.county} />
        <DataRow label="Acreage" value={formatAcres(parcel.acres)} />
        <DataRow label="Land Use" value={parcel.land_use_code} />
        <DataRow label="Zoning" value={parcel.zoning} highlight />
        {parcel.zoning_desc && (
          <DataRow label="Zone Desc" value={parcel.zoning_desc} />
        )}
      </Section>

      <Section title="Assessed Value">
        <DataRow label="Total Assessed" value={formatCurrency(parcel.assessed_total)} />
        {parcel.land_value != null && (
          <DataRow label="Land Value" value={formatCurrency(parcel.land_value)} />
        )}
        {parcel.improvement_value != null && (
          <DataRow label="Improvements" value={formatCurrency(parcel.improvement_value)} />
        )}
        {parcel.acres && parcel.assessed_total && (
          <DataRow
            label="Per Acre"
            value={formatCurrency(parcel.assessed_total / parcel.acres)}
          />
        )}
      </Section>

      {(parcel.last_sale_date || parcel.last_sale_price) && (
        <Section title="Last Sale">
          <DataRow label="Date" value={formatDate(parcel.last_sale_date)} />
          <DataRow label="Price" value={formatCurrency(parcel.last_sale_price)} />
          <DataRow
            label="Price/SF"
            value={formatPricePerSqFt(parcel.last_sale_price, parcel.acres)}
          />
        </Section>
      )}

      {parcel.deed_refs && parcel.deed_refs.length > 0 && (
        <Section title="Deed References">
          {parcel.deed_refs.map((ref, i) => (
            <DataRow key={i} label={`Deed ${i + 1}`} value={ref} />
          ))}
        </Section>
      )}

      {parcel.legal_desc && (
        <Section title="Legal Description">
          <p className="text-[11px] leading-relaxed text-mid">{parcel.legal_desc}</p>
        </Section>
      )}
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
  subtle,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
  subtle?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-mono text-[10px] text-mid">{label}</span>
      <span
        className={`text-right text-[12px] ${
          highlight
            ? "rounded bg-teal-dim px-1.5 py-0.5 font-mono text-[10px] font-medium text-teal"
            : subtle
            ? "text-mid/70"
            : "text-bright"
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}
