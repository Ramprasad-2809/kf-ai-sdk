// ============================================================
// API CLIENT FOR FORM OPERATIONS
// ============================================================
// Handles schema fetching and form submissions

import { api, getDefaultHeaders, getApiBaseUrl } from '../../../api';
import type { BackendSchema, FormOperation, SubmissionResult } from './types';

// ============================================================
// SCHEMA FETCHING
// ============================================================

/**
 * Fetch BDO schema from backend metadata endpoint
 */
export async function fetchFormSchema(source: string): Promise<BackendSchema> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getDefaultHeaders();
    
    // Use BDO metadata endpoint: /meta/bdo/{bdo_id}
    const response = await fetch(`${baseUrl.replace('/api', '')}/meta/bdo/${source}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch schema for ${source}: ${response.statusText}`);
    }

    const bdoSchema = await response.json();
    
    // Validate that response is a valid BDO schema object
    if (!bdoSchema || typeof bdoSchema !== 'object' || !bdoSchema.Fields) {
      throw new Error(`Invalid BDO schema response for ${source}`);
    }

    // Return the full BDO schema - the form processor will extract what it needs
    return bdoSchema as BackendSchema;
  } catch (error) {
    console.error(`Schema fetch error for ${source}:`, error);
    throw new Error(`Failed to load form schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch form schema with retry logic
 */
export async function fetchFormSchemaWithRetry(
  source: string, 
  maxRetries: number = 3
): Promise<BackendSchema> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFormSchema(source);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError!;
}

// ============================================================
// RECORD OPERATIONS
// ============================================================

/**
 * Fetch existing record for update operations
 */
export async function fetchRecord<T = any>(source: string, recordId: string): Promise<T> {
  try {
    const record = await api<T>(source).get(recordId);
    return record;
  } catch (error) {
    console.error(`Record fetch error for ${source}/${recordId}:`, error);
    throw new Error(`Failed to load record: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Submit form data (create or update)
 */
export async function submitFormData<T = any>(
  source: string,
  operation: FormOperation,
  data: Partial<T>,
  recordId?: string
): Promise<SubmissionResult> {
  try {
    let result;
    
    if (operation === 'create') {
      result = await api<T>(source).create(data);
      return {
        success: true,
        data: result,
        recordId: result._id || recordId
      };
    } else if (operation === 'update') {
      if (!recordId) {
        throw new Error('Record ID is required for update operations');
      }
      
      result = await api<T>(source).update(recordId, data);
      return {
        success: true,
        data: result,
        recordId: result._id || recordId
      };
    } else {
      throw new Error(`Unsupported operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Form submission error:`, error);
    const submissionError = new Error(
      `Failed to ${operation} record: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    
    return {
      success: false,
      error: submissionError
    };
  }
}

// ============================================================
// REFERENCE DATA FETCHING
// ============================================================

/**
 * Fetch reference field data
 */
export async function fetchReferenceData(
  businessObject: string,
  fields: string[] = ['_id'],
  filters?: any,
  sort?: any
): Promise<any[]> {
  try {
    const listOptions: any = {};
    
    // Add filters if provided
    if (filters) {
      listOptions.Filter = filters;
    }
    
    // Add sorting if provided
    if (sort) {
      listOptions.Sort = sort;
    }
    
    // Limit fields to what's needed
    if (fields.length > 0) {
      listOptions.Field = fields;
    }
    
    const response = await api(businessObject).list(listOptions);
    return response.Data || [];
  } catch (error) {
    console.error(`Reference data fetch error for ${businessObject}:`, error);
    // Don't throw, return empty array to allow form to continue working
    return [];
  }
}

/**
 * Fetch all reference data for a schema
 */
export async function fetchAllReferenceData(
  referenceFields: Record<string, any>
): Promise<Record<string, any[]>> {
  const referenceData: Record<string, any[]> = {};
  
  // Fetch all reference data in parallel
  const fetchPromises = Object.entries(referenceFields).map(async ([fieldName, config]) => {
    try {
      const data = await fetchReferenceData(
        config.businessObject,
        config.fields,
        config.filters,
        config.sort
      );
      return [fieldName, data];
    } catch (error) {
      console.warn(`Failed to fetch reference data for ${fieldName}:`, error);
      return [fieldName, []];
    }
  });
  
  const results = await Promise.allSettled(fetchPromises);
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const [fieldName, data] = result.value;
      referenceData[fieldName as string] = Array.isArray(data) ? data : [];
    }
  });
  
  return referenceData;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate form data before submission
 */
export function validateFormData<T>(
  data: Partial<T>,
  requiredFields: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  for (const field of requiredFields) {
    const value = data[field as keyof T];
    if (value === undefined || value === null || value === '') {
      errors.push(`${field} is required`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Clean form data before submission (remove computed fields, empty values, etc.)
 */
export function cleanFormData<T>(
  data: Partial<T>,
  computedFields: string[]
): Partial<T> {
  const cleanedData = { ...data };
  
  // Remove computed fields
  for (const field of computedFields) {
    delete cleanedData[field as keyof T];
  }
  
  // Remove undefined values
  Object.keys(cleanedData).forEach(key => {
    if (cleanedData[key as keyof T] === undefined) {
      delete cleanedData[key as keyof T];
    }
  });
  
  return cleanedData;
}

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * Parse API error response
 */
export function parseApiError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return !navigator.onLine || 
         error?.code === 'NETWORK_ERROR' ||
         error?.message?.toLowerCase().includes('network') ||
         error?.message?.toLowerCase().includes('fetch');
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  return error?.status === 400 ||
         error?.response?.status === 400 ||
         error?.message?.toLowerCase().includes('validation') ||
         error?.message?.toLowerCase().includes('invalid');
}

// ============================================================
// CACHE MANAGEMENT
// ============================================================

/**
 * Simple in-memory cache for schemas and reference data
 */
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Cache data with TTL
 */
export function setCacheData(key: string, data: any, ttlMinutes: number = 10): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000
  });
}

/**
 * Get cached data if not expired
 */
export function getCacheData(key: string): any | null {
  const item = cache.get(key);
  
  if (!item) {
    return null;
  }
  
  if (Date.now() - item.timestamp > item.ttl) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

/**
 * Clear cache
 */
export function clearCache(keyPrefix?: string): void {
  if (keyPrefix) {
    const keysToDelete = Array.from(cache.keys()).filter(key => key.startsWith(keyPrefix));
    keysToDelete.forEach(key => cache.delete(key));
  } else {
    cache.clear();
  }
}

// ============================================================
// CACHED API FUNCTIONS
// ============================================================

/**
 * Fetch schema with caching
 */
export async function fetchFormSchemaWithCache(source: string): Promise<BackendSchema> {
  const cacheKey = `schema:${source}`;
  const cached = getCacheData(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const schema = await fetchFormSchemaWithRetry(source);
  setCacheData(cacheKey, schema, 30); // Cache for 30 minutes
  
  return schema;
}

/**
 * Fetch reference data with caching
 */
export async function fetchReferenceDataWithCache(
  businessObject: string,
  fields: string[] = ['_id'],
  filters?: any,
  sort?: any
): Promise<any[]> {
  const cacheKey = `reference:${businessObject}:${JSON.stringify({ fields, filters, sort })}`;
  const cached = getCacheData(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const data = await fetchReferenceData(businessObject, fields, filters, sort);
  setCacheData(cacheKey, data, 5); // Cache for 5 minutes
  
  return data;
}