'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[]; // Document data with ID. Defaults to an empty array.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries gracefully.
 * 
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. If null or undefined, the hook will wait.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    targetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[];

  const [data, setData] = useState<StateDataType>([]); // Default to empty array
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  // Memoize the string representation of the query to use as a dependency.
  const queryKey = useMemo(() => {
    if (!targetRefOrQuery) return null;
    if (targetRefOrQuery.type === 'collection') {
      return (targetRefOrQuery as CollectionReference).path;
    }
    // A more robust way to stringify a query
    const queryAsInternal = targetRefOrQuery as InternalQuery;
    const path = queryAsInternal._query.path.canonicalString();
    const filters = (targetRefOrQuery as Query)._query.filters.map(f => f.toString()).join();
    const orderBy = (targetRefOrQuery as Query)._query.explicitOrderBy.map(o => `${o.field.canonicalString()}_${o.dir}`).join();
    return `${path}|${filters}|${orderBy}`;

  }, [targetRefOrQuery]);

  useEffect(() => {
    // If the query/ref is explicitly null or undefined, it means we are waiting for dependencies.
    // Set loading to true and clear previous data/errors.
    if (!targetRefOrQuery) {
      setData([]);
      setIsLoading(true);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        // This logic extracts the path from either a ref or a query
        const path: string =
          targetRefOrQuery.type === 'collection'
            ? (targetRefOrQuery as CollectionReference).path
            : (targetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        })

        setError(contextualError)
        setData([])
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [queryKey]); // Re-run if the generated query key changes.
  
  return { data, isLoading, error };
}
