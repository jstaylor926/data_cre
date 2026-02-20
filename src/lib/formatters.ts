export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatAcres(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(2)} ac`;
}

export function formatSqFt(acres: number | null | undefined): string {
  if (acres == null) return "—";
  return `${Math.round(acres * 43560).toLocaleString()} SF`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPricePerSqFt(
  price: number | null | undefined,
  acres: number | null | undefined
): string {
  if (price == null || acres == null || acres === 0) return "—";
  const sqft = acres * 43560;
  const ppsf = price / sqft;
  return `$${ppsf.toFixed(2)}/SF`;
}

export function formatCoordinate(value: number, decimals = 4): string {
  return value.toFixed(decimals);
}
