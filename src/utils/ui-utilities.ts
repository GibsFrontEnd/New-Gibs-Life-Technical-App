export const formatToNaira = (amount: string | number): string => {
  return "₦" + Number(amount).toLocaleString("en-NG");
};

export const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0, // @ts-ignore
  }).format(amount);
};

export function formatDate(dateString: string | null): string {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export const getInitials = (name: string) => {
  if (!name || name === "string string string") return "??";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export function removeSubstring(fullString: string, toRemove: string) {
  const regex = new RegExp(`\\b${toRemove}\\b`, "g");
  return fullString.replace(regex, "").replace(/\s+/g, " ").trim();
}

export const getTwoInitials = (surname: string, otherNames: string) => {
  const firstNameInitial = otherNames.split(" ")[0]?.[0] || "";
  const surnameInitial = surname[0] || "";
  return (firstNameInitial + surnameInitial).toUpperCase();
};
