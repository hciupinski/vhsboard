const polishDateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const polishMonthFormatter = new Intl.DateTimeFormat("pl-PL", {
  month: "long",
  timeZone: "UTC",
});

const dateFromIso = (value: string): Date => new Date(`${value}T00:00:00Z`);

const dayFromIso = (value: string): string => String(dateFromIso(value).getUTCDate());

const monthFromIso = (value: string): string => polishMonthFormatter.format(dateFromIso(value));

const yearFromIso = (value: string): number => dateFromIso(value).getUTCFullYear();

const formatFullDate = (value: string): string => polishDateFormatter.format(dateFromIso(value));

export const formatPriceFrom = (price: number, currency: "PLN"): string =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);

export const formatGroupSize = (minimum: number | null, maximum: number | null): string => {
  if (minimum === null && maximum === null) {
    return "Liczebność grupy wkrótce";
  }
  if (minimum === null) {
    return `Do ${maximum} osób`;
  }
  if (maximum === null) {
    return `Od ${minimum} osób`;
  }
  if (minimum === maximum) {
    return `${minimum} osób`;
  }

  return `${minimum}–${maximum} osób`;
};

export const formatTripDates = (startDate: string | null, endDate: string | null): string => {
  if (startDate === null && endDate === null) {
    return "Termin wkrótce";
  }
  if (startDate === null && endDate !== null) {
    return `Do ${formatFullDate(endDate)}`;
  }
  if (startDate !== null && endDate === null) {
    return `Od ${formatFullDate(startDate)}`;
  }
  if (startDate === null || endDate === null) {
    return "Termin wkrótce";
  }
  if (startDate === endDate) {
    return formatFullDate(startDate);
  }
  if (
    yearFromIso(startDate) === yearFromIso(endDate) &&
    monthFromIso(startDate) === monthFromIso(endDate)
  ) {
    return `${dayFromIso(startDate)}–${formatFullDate(endDate)}`;
  }
  if (yearFromIso(startDate) === yearFromIso(endDate)) {
    return `${dayFromIso(startDate)} ${monthFromIso(startDate)} – ${formatFullDate(endDate)}`;
  }

  return `${formatFullDate(startDate)} – ${formatFullDate(endDate)}`;
};
