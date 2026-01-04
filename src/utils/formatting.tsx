
export function getFormattedNumber(val:number){
  return `${val.toLocaleString("en-US")}`;
}

export function getFormattedCurrency(val:number){
  return `Rp. ${val.toLocaleString("en-US")}`;
}

export function getFormattedDate(dateInput: any): string {
  if (!dateInput) {
    return 'Invalid date';
  }

  let date: Date;

  // Check if it's a Firestore Timestamp object
  if (typeof dateInput === 'object' && dateInput !== null && typeof dateInput.seconds === 'number') {
    date = new Date(dateInput.seconds * 1000);
  } 
  // Check if it's a string (like an ISO string)
  else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  }
  // Check if it's already a Date object
  else if (dateInput instanceof Date) {
    date = dateInput;
  }
  else {
    return 'Invalid date';
  }

  // Check if the created date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString("en-US", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}