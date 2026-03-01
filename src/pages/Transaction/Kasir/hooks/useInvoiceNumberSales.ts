// src/pages/Transaction/Kasir/hooks/useInvoiceNumberSales.ts

import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, type DocumentData } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../../../context/AuthContext';
import type { NumberingConfig } from '../../../../types/index';
import { DEFAULT_NUMBERING_CONFIG } from '../../../../types/index';

export const useInvoiceNumberSales = (activeDraftId: string | null) => {
  const { user, userDb } = useAuth();

  // ===== SALES invoice number =====
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState('');
  const [numberingConfig, setNumberingConfig] = useState<NumberingConfig | null>(null);
  const [salesTransactions, setSalesTransactions] = useState<any[]>([]);
  const [recycledInvoiceNumbers, setRecycledInvoiceNumbers] = useState<string[]>([]);

  // ===== PO SALES invoice number =====
  const [currentPOInvoiceNo, setCurrentPOInvoiceNo] = useState('');
  const [poSalesTransactions, setPOSalesTransactions] = useState<any[]>([]);
  const [recycledPOInvoiceNumbers, setRecycledPOInvoiceNumbers] = useState<string[]>([]);

  // Fetch numbering config from company
  useEffect(() => {
    if (!user?.companyId) return;

    const companyDocRef = doc(db, 'companies', user.companyId);

    const unsubscribe = onSnapshot(
      companyDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const companyData = docSnap.data() as DocumentData;
          setNumberingConfig(companyData.numbering || DEFAULT_NUMBERING_CONFIG);
        }
      },
      (err) => {
        console.error('Error fetching company numbering config:', err);
        setNumberingConfig(DEFAULT_NUMBERING_CONFIG);
      }
    );

    return () => unsubscribe();
  }, [user?.companyId]);

  // Listen to sales transactions using onSnapshot
  useEffect(() => {
    if (!userDb) return;

    const salesCollection = collection(userDb, 'sales');

    const unsubscribe = onSnapshot(
      salesCollection,
      (snapshot) => {
        const transactions = snapshot.docs.map((doc) => {
          const data = doc.data();
          const transactionId = data.id || doc.id;
          return { id: transactionId, ...data };
        });
        setSalesTransactions(transactions);
      },
      (error) => {
        console.error('Error listening to sales transactions:', error);
      }
    );

    return () => unsubscribe();
  }, [userDb]);

  // Listen to po-sales transactions using onSnapshot
  useEffect(() => {
    if (!userDb) return;

    const poSalesCollection = collection(userDb, 'po-sales');

    const unsubscribe = onSnapshot(
      poSalesCollection,
      (snapshot) => {
        const transactions = snapshot.docs.map((doc) => {
          const data = doc.data();
          const transactionId = data.id || doc.id;
          return { id: transactionId, ...data };
        });
        setPOSalesTransactions(transactions);
      },
      (error) => {
        console.error('Error listening to po-sales transactions:', error);
      }
    );

    return () => unsubscribe();
  }, [userDb]);

  // ===== Helper: build date part =====
  const buildDatePart = (config: NumberingConfig): string => {
    const date = new Date();
    const yearFull = date.getFullYear().toString();
    const year = config.yearFormat === 'YY' ? yearFull.slice(-2) : yearFull;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return config.includeDay ? `${year}${month}${day}` : `${year}${month}`;
  };

  // ===== Helper: build next ID from transactions list =====
  const buildNextId = (
    transactions: any[],
    prefix: string,
    separator: string,
    datePart: string
  ): string => {
    const prefixPattern = `${prefix}${datePart}${separator}`;

    const matchingTransactions = transactions.filter((t) => {
      const tid = t.id || '';
      return tid.startsWith(prefixPattern);
    });

    const counters: number[] = matchingTransactions
      .map((t) => {
        const tid = t.id || '';
        const counterPart = tid.replace(prefixPattern, '');
        const counter = parseInt(counterPart, 10);
        return isNaN(counter) ? 0 : counter;
      })
      .filter((c) => c > 0);

    const maxCounter = counters.length > 0 ? Math.max(...counters) : 0;
    const newCounter = maxCounter + 1;

    let formattedCounter: string;
    if (matchingTransactions.length > 0) {
      const firstId = matchingTransactions[0].id || '';
      const firstCounterPart = firstId.replace(prefixPattern, '');
      if (firstCounterPart.match(/^0+/) && firstCounterPart.length > 1) {
        formattedCounter = String(newCounter).padStart(firstCounterPart.length, '0');
      } else {
        formattedCounter = String(newCounter);
      }
    } else {
      formattedCounter = String(newCounter);
    }

    return `${prefixPattern}${formattedCounter}`;
  };

  // Generate regular sales ID
  // additionalTaken: ID yang baru saja dipakai tapi belum masuk salesTransactions (Firestore belum update)
  const generateSalesId = (additionalTaken?: string): string => {
    const config = numberingConfig || DEFAULT_NUMBERING_CONFIG;
    const datePart = buildDatePart(config);
    const transactions = additionalTaken
      ? [...salesTransactions, { id: additionalTaken }]
      : salesTransactions;
    return buildNextId(transactions, config.salesPrefix, config.separator, datePart);
  };

  // Generate PO sales ID
  // additionalTaken: ID yang baru saja dipakai tapi belum masuk poSalesTransactions (Firestore belum update)
  const generatePOSalesId = (additionalTaken?: string): string => {
    const config = numberingConfig || DEFAULT_NUMBERING_CONFIG;
    const datePart = buildDatePart(config);
    const poPrefix = config.poSalesPrefix || DEFAULT_NUMBERING_CONFIG.poSalesPrefix;
    const transactions = additionalTaken
      ? [...poSalesTransactions, { id: additionalTaken }]
      : poSalesTransactions;
    return buildNextId(transactions, poPrefix, config.separator, datePart);
  };

  // Auto-generate SALES invoice number
  useEffect(() => {
    if (activeDraftId === null && numberingConfig) {
      if (!currentInvoiceNo || currentInvoiceNo === '') {
        if (recycledInvoiceNumbers.length > 0) {
          setCurrentInvoiceNo(recycledInvoiceNumbers[0]);
        } else {
          try {
            setCurrentInvoiceNo(generateSalesId());
          } catch (error) {
            console.error('Error generating sales invoice number:', error);
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            setCurrentInvoiceNo(`SO${year}${month}-001`);
          }
        }
      }
    }
  }, [numberingConfig, activeDraftId, salesTransactions, recycledInvoiceNumbers]);

  // Auto-generate PO SALES invoice number
  useEffect(() => {
    if (activeDraftId === null && numberingConfig) {
      if (!currentPOInvoiceNo || currentPOInvoiceNo === '') {
        if (recycledPOInvoiceNumbers.length > 0) {
          setCurrentPOInvoiceNo(recycledPOInvoiceNumbers[0]);
        } else {
          try {
            setCurrentPOInvoiceNo(generatePOSalesId());
          } catch (error) {
            console.error('Error generating PO sales invoice number:', error);
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            setCurrentPOInvoiceNo(`PO${year}${month}-001`);
          }
        }
      }
    }
  }, [numberingConfig, activeDraftId, poSalesTransactions, recycledPOInvoiceNumbers]);

  // Helper: Consume regular sales invoice number
  const consumeInvoiceNumber = () => {
    if (recycledInvoiceNumbers.length > 0 && recycledInvoiceNumbers.includes(currentInvoiceNo)) {
      setRecycledInvoiceNumbers((prev) => prev.filter((no) => no !== currentInvoiceNo));
    }
    setCurrentInvoiceNo('');
  };

  // Helper: Consume PO sales invoice number
  const consumePOInvoiceNumber = () => {
    if (recycledPOInvoiceNumbers.length > 0 && recycledPOInvoiceNumbers.includes(currentPOInvoiceNo)) {
      setRecycledPOInvoiceNumbers((prev) => prev.filter((no) => no !== currentPOInvoiceNo));
    }
    setCurrentPOInvoiceNo('');
  };

  return {
    // Sales invoice
    currentInvoiceNo,
    setCurrentInvoiceNo,
    recycledInvoiceNumbers,
    setRecycledInvoiceNumbers,
    consumeInvoiceNumber,
    generateSalesId,
    // PO Sales invoice
    currentPOInvoiceNo,
    setCurrentPOInvoiceNo,
    recycledPOInvoiceNumbers,
    setRecycledPOInvoiceNumbers,
    consumePOInvoiceNumber,
    generatePOSalesId,
    // Shared
    numberingConfig,
  };
};
