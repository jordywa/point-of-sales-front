
export function getFormattedNumber(val:number){
  return `${val.toLocaleString("en-US")}`;
}

export function getFormattedCurrency(val:number){
  return `Rp. ${val.toLocaleString("en-US")}`;
}

export function getFormattedDate(timestamp: any): string {
  if (!timestamp || !timestamp.seconds) {
    return 'Invalid date';
  }
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString("en-US", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}