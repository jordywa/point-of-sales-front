// src/pages/Transaction/Pembelian/hooks/useDraftPurchase.ts

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../../../../context/AuthContext';
import type { DraftPurchase } from '../../../../types/pembelian.types';

const PURCHASES_COLLECTION = 'purchases';
const PO_PURCHASES_COLLECTION = 'po-purchases';

export const useDraftPurchase = () => {
  const { userDb } = useAuth();

  const [purchaseDrafts, setPurchaseDrafts] = useState<DraftPurchase[]>([]);
  const [poPurchaseDrafts, setPOPurchaseDrafts] = useState<DraftPurchase[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  // Listen to 'purchases' collection for TUNAI drafts
  useEffect(() => {
    if (!userDb) return;

    setIsLoadingDrafts(true);

    const q = query(
      collection(userDb, PURCHASES_COLLECTION),
      where('status', '==', 'Draft'),
      where('isDeleted', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _sourceCollection: 'purchases' as const,
        })) as DraftPurchase[];

        setPurchaseDrafts(items);
        setIsLoadingDrafts(false);
      },
      (error) => {
        console.error('Error fetching draft purchases:', error);
        setIsLoadingDrafts(false);
      }
    );

    return () => unsubscribe();
  }, [userDb]);

  // Listen to 'po-purchases' collection for KREDIT drafts
  useEffect(() => {
    if (!userDb) return;

    const q = query(
      collection(userDb, PO_PURCHASES_COLLECTION),
      where('status', '==', 'Draft'),
      where('isDeleted', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _sourceCollection: 'po-purchases' as const,
        })) as DraftPurchase[];

        setPOPurchaseDrafts(items);
      },
      (error) => {
        console.error('Error fetching draft PO purchases:', error);
      }
    );

    return () => unsubscribe();
  }, [userDb]);

  return {
    purchaseDrafts,
    poPurchaseDrafts,
    isLoadingDrafts,
  };
};
