// src/pages/Transaction/Kasir/hooks/useDraftSales.ts

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../../../../context/AuthContext';
import type { SalesTransaction } from '../../../../types';

// Extended type untuk draft yang juga menyimpan info asal koleksinya
export interface DraftTransaction extends SalesTransaction {
  _sourceCollection: 'sales' | 'po-sales';
}

const SALES_COLLECTION = 'sales';
const PO_SALES_COLLECTION = 'po-sales';

export const useDraftSales = () => {
  const { userDb } = useAuth();
  const [draftTransactions, setDraftTransactions] = useState<DraftTransaction[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  // State internal untuk menggabungkan dua koleksi
  const [salesDrafts, setSalesDrafts] = useState<DraftTransaction[]>([]);
  const [poSalesDrafts, setPOSalesDrafts] = useState<DraftTransaction[]>([]);

  // Gabungkan kedua list setiap kali salah satunya berubah
  useEffect(() => {
    setDraftTransactions([...salesDrafts, ...poSalesDrafts]);
  }, [salesDrafts, poSalesDrafts]);

  // Listen ke koleksi `sales` (draft biasa)
  useEffect(() => {
    if (!userDb) return;

    setIsLoadingDrafts(true);

    const q = query(
      collection(userDb, SALES_COLLECTION),
      where('status', '==', 'Draft'),
      where('isDeleted', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _sourceCollection: 'sales' as const,
        })) as DraftTransaction[];

        setSalesDrafts(items);
        setIsLoadingDrafts(false);
      },
      (error) => {
        console.error('Error fetching draft sales: ', error);
        setIsLoadingDrafts(false);
      }
    );

    return () => unsubscribe();
  }, [userDb]);

  // Listen ke koleksi `po-sales` (draft kredit/PO)
  useEffect(() => {
    if (!userDb) return;

    const q = query(
      collection(userDb, PO_SALES_COLLECTION),
      where('status', '==', 'Draft'),
      where('isDeleted', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _sourceCollection: 'po-sales' as const,
        })) as DraftTransaction[];

        setPOSalesDrafts(items);
      },
      (error) => {
        console.error('Error fetching draft PO sales: ', error);
      }
    );

    return () => unsubscribe();
  }, [userDb]);

  return {
    draftTransactions,
    isLoadingDrafts,
  };
};
