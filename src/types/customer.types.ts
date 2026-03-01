
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  gender?: 'L' | 'P';
  dob?: string;
  points: number;
}