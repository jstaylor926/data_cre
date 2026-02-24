export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatAcres(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return `${value.toFixed(2)} ac`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPricePerSF(
  price: number | null | undefined,
  sqft: number | null | undefined
): string {
  if (price == null || sqft == null || sqft === 0) return "N/A";
  return `${formatCurrency(price / sqft)}/sf`;
}

export function formatPricePerAcre(
  price: number | null | undefined,
  acres: number | null | undefined
): string {
  if (price == null || acres == null || acres === 0) return "N/A";
  return `${formatCurrency(price / acres)}/ac`;
}

export function formatDistance(miles: number | null | undefined): string {
  if (miles == null) return "N/A";
  if (miles < 0.1) return `${(miles * 5280).toFixed(0)} ft`;
  return `${miles.toFixed(1)} mi`;
}

export function formatMW(mw: number | null | undefined): string {
  if (mw == null) return "N/A";
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  return `${mw.toFixed(0)} MW`;
}

export function formatScore(score: number): string {
  return score.toFixed(0);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return `${value.toFixed(1)}%`;
}
