
export interface Role{
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  phone: string;
  companyId: string;
  role: string;
  status: 'Aktif' | 'Tidak Aktif';
  accessOutlets: string[];
  password?: string;
  permissions?: String[];
}
