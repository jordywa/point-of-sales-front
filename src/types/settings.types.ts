
export interface Permission{
  id: string,
  label: string,
}

export interface NumberingConfig {
  salesPrefix: string;
  purchasePrefix: string;
  poSalesPrefix: string;
  poPurchasePrefix: string;
  separator: string;
  yearFormat: 'YYYY' | 'YY';
  includeDay: boolean;
}

export const DEFAULT_NUMBERING_CONFIG: NumberingConfig = {
  salesPrefix: 'SO',
  purchasePrefix: 'PU',
  poSalesPrefix: 'SPO',
  poPurchasePrefix: 'PPO',
  separator: '-',
  yearFormat: 'YYYY',
  includeDay: false,
};

export interface Company{
  id: string;
  name: string;
  address?: string;
  contact?: string;
  numbering?: NumberingConfig;
}

export interface CategoryNode {
  id: string;
  name: string;
  isOpen: boolean;
  children: CategoryNode[];
  parentId?: string;
  companyId?: string;
}

export interface Bank {
  id: string;
  name: string;
  type: 'CASH' | 'BANK';
  balance: number;
  accountNumber?: string;
  companyId?: string;
}