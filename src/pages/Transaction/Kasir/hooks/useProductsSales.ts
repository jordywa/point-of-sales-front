// src/pages/Transaction/Kasir/hooks/useProductsSales.ts

import { useState, useEffect } from 'react';
import {
  collection,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { useAuth } from '../../../../context/AuthContext';
import type { Product } from '../../../../types';

const PRODUCT_COLLECTION = 'products';
const ITEMS_PER_PAGE = 50;

export const useProductsSales = (searchQuery: string) => {
  const { userDb } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCursors, setPageCursors] = useState<{
    [key: number]: QueryDocumentSnapshot<DocumentData> | null;
  }>({
    1: null,
  });

  // Fetch products
  useEffect(() => {
    if (!userDb) return;

    setIsLoading(true);

    const queryConstraints: any[] = [orderBy('name')];

    // Filter only ACTIVE products
    queryConstraints.push(where('status', '==', 'ACTIVE'));

    // Search filter (prefix search)
    if (searchQuery.trim() !== '') {
      queryConstraints.push(where('name', '>=', searchQuery));
      queryConstraints.push(where('name', '<=', searchQuery + '\uf8ff'));
    }

    // Pagination
    queryConstraints.push(limit(ITEMS_PER_PAGE));
    if (currentPage > 1 && pageCursors[currentPage - 1]) {
      queryConstraints.push(startAfter(pageCursors[currentPage - 1]));
    }

    const q = query(
      collection(userDb, PRODUCT_COLLECTION),
      ...queryConstraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        setProducts(items);

        if (snapshot.docs.length > 0) {
          const lastDoc = snapshot.docs[snapshot.docs.length - 1];
          setPageCursors((prev) => ({
            ...prev,
            [currentPage]: lastDoc,
          }));
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching products: ', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userDb, currentPage, searchQuery]);

  // Fetch total count
  useEffect(() => {
    const fetchTotalCount = async () => {
      if (!userDb) return;

      const qConstraints: any[] = [where('status', '==', 'ACTIVE')];

      if (searchQuery.trim() !== '') {
        qConstraints.push(where('name', '>=', searchQuery));
        qConstraints.push(where('name', '<=', searchQuery + '\uf8ff'));
      }

      const q = query(
        collection(userDb, PRODUCT_COLLECTION),
        ...qConstraints
      );
      const snapshot = await getCountFromServer(q);
      setTotalItems(snapshot.data().count);
    };

    fetchTotalCount();
  }, [userDb, searchQuery]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageCursors({ 1: null });
  }, [searchQuery]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top when page changes
    const contentArea = document.querySelector('.flex-1.overflow-y-auto');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  };

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return {
    products,
    currentProducts: products, // For compatibility with existing code
    isLoading,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    handlePageChange,
  };
};
