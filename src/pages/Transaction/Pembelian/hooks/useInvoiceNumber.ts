// src/pages/Transaction/Pembelian/hooks/useInvoiceNumber.ts

import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, type DocumentData } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { useAuth } from "../../../../context/AuthContext";
import type { NumberingConfig } from "../../../../types/index";
import { DEFAULT_NUMBERING_CONFIG } from "../../../../types/index";

export const useInvoiceNumber = (activeDraftId: string | null) => {
  const { user, userDb } = useAuth();

  // ===== TUNAI (regular purchase) invoice number =====
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState("");
  const [numberingConfig, setNumberingConfig] = useState<NumberingConfig | null>(null);
  const [purchaseTransactions, setPurchaseTransactions] = useState<any[]>([]);

  // ===== KREDIT (PO purchase) invoice number =====
  const [currentPOInvoiceNo, setCurrentPOInvoiceNo] = useState("");
  const [poPurchaseTransactions, setPOPurchaseTransactions] = useState<any[]>([]);

  // ===== Fetch numbering config from company =====
  useEffect(() => {
    if (!user?.companyId) return;

    const companyDocRef = doc(db, "companies", user.companyId);

    const unsubscribe = onSnapshot(
      companyDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const companyData = docSnap.data() as DocumentData;
          setNumberingConfig(companyData.numbering || DEFAULT_NUMBERING_CONFIG);
        }
      },
      (err) => {
        console.error("Error fetching company numbering config:", err);
        setNumberingConfig(DEFAULT_NUMBERING_CONFIG);
      }
    );

    return () => unsubscribe();
  }, [user?.companyId]);

  // ===== Listen to 'purchases' transactions =====
  useEffect(() => {
    if (!userDb) return;

    const unsubscribe = onSnapshot(
      collection(userDb, "purchases"),
      (snapshot) => {
        const transactions = snapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: data.id || doc.id, ...data };
        });
        setPurchaseTransactions(transactions);
      },
      (error) => {
        console.error("Error listening to purchase transactions:", error);
      }
    );

    return () => unsubscribe();
  }, [userDb]);

  // ===== Listen to 'po-purchases' transactions =====
  useEffect(() => {
    if (!userDb) return;

    const unsubscribe = onSnapshot(
      collection(userDb, "po-purchases"),
      (snapshot) => {
        const transactions = snapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: data.id || doc.id, ...data };
        });
        setPOPurchaseTransactions(transactions);
        // console.log(transactions)
      },
      (error) => {
        console.error("Error listening to po-purchase transactions:", error);
      }
    );

    return () => unsubscribe();
  }, [userDb]);

  // ===== Helper: build date part string =====
  const buildDatePart = (config: NumberingConfig): string => {
    const date = new Date();
    const yearFull = date.getFullYear().toString();
    const year = config.yearFormat === "YY" ? yearFull.slice(-2) : yearFull;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return config.includeDay ? `${year}${month}${day}` : `${year}${month}`;
  };

  // ===== Helper: build next ID from a list of transactions =====
  const buildNextId = (
    transactions: any[],
    prefix: string,
    separator: string,
    datePart: string
  ): string => {
    const prefixPattern = `${prefix}${datePart}${separator}`;

    const matching = transactions.filter((t) =>
      (t.id || "").startsWith(prefixPattern)
    );

    const counters: number[] = matching
      .map((t) => {
        const counterPart = (t.id || "").replace(prefixPattern, "");
        const n = parseInt(counterPart, 10);
        return isNaN(n) ? 0 : n;
      })
      .filter((n) => n > 0);

    const maxCounter = counters.length > 0 ? Math.max(...counters) : 0;
    const newCounter = maxCounter + 1;

    let formattedCounter: string;
    if (matching.length > 0) {
      const firstCounterPart = (matching[0].id || "").replace(prefixPattern, "");
      if (firstCounterPart.match(/^0+/) && firstCounterPart.length > 1) {
        formattedCounter = String(newCounter).padStart(firstCounterPart.length, "0");
      } else {
        formattedCounter = String(newCounter);
      }
    } else {
      formattedCounter = String(newCounter);
    }

    return `${prefixPattern}${formattedCounter}`;
  };

  // ===== Generate TUNAI purchase ID (uses purchasePrefix, looks at 'purchases' only) =====
  // additionalTaken: ID yang baru saja dipakai tapi belum masuk purchaseTransactions (Firestore belum update)
  const generatePurchaseId = (additionalTaken?: string): string => {
    const config = numberingConfig || DEFAULT_NUMBERING_CONFIG;
    const datePart = buildDatePart(config);
    const prefix = config.purchasePrefix;
    const transactions = additionalTaken
      ? [...purchaseTransactions, { id: additionalTaken }]
      : purchaseTransactions;
    return buildNextId(transactions, prefix, config.separator, datePart);
  };

  // ===== Generate KREDIT (PO) purchase ID (uses poPurchasePrefix, looks at 'po-purchases' only) =====
  // additionalTaken: ID yang baru saja dipakai tapi belum masuk poPurchaseTransactions (Firestore belum update)
  const generatePOPurchaseId = (additionalTaken?: string): string => {
    const config = numberingConfig || DEFAULT_NUMBERING_CONFIG;
    const datePart = buildDatePart(config);
    const prefix = config.poPurchasePrefix || DEFAULT_NUMBERING_CONFIG.poPurchasePrefix;
    const transactions = additionalTaken
      ? [...poPurchaseTransactions, { id: additionalTaken }]
      : poPurchaseTransactions;
    return buildNextId(transactions, prefix, config.separator, datePart);
  };

  // ===== Auto-generate TUNAI invoice number =====
  useEffect(() => {
    if (activeDraftId === null && numberingConfig) {
      if (!currentInvoiceNo || currentInvoiceNo === "") {
        try {
          setCurrentInvoiceNo(generatePurchaseId());
        } catch (error) {
          console.error("Error generating TUNAI invoice number:", error);
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          setCurrentInvoiceNo(`PU${year}${month}-1`);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberingConfig, activeDraftId, purchaseTransactions]);

  // ===== Auto-generate KREDIT (PO) invoice number =====
  useEffect(() => {
    if (activeDraftId === null && numberingConfig) {
      if (!currentPOInvoiceNo || currentPOInvoiceNo === "") {
        try {
          setCurrentPOInvoiceNo(generatePOPurchaseId());
        } catch (error) {
          console.error("Error generating KREDIT invoice number:", error);
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          setCurrentPOInvoiceNo(`PPO${year}${month}-1`);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberingConfig, activeDraftId, poPurchaseTransactions]);

  return {
    currentInvoiceNo,
    setCurrentInvoiceNo,
    currentPOInvoiceNo,
    setCurrentPOInvoiceNo,
    numberingConfig,
    generatePurchaseId,
    generatePOPurchaseId,
  };
};
