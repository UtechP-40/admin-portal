import { apiService } from './api';
import type { DocumentVersion, DocumentChange, DocumentValidationResult } from '../types/database';
import type { ApiResponse } from '../types/api';

export class DocumentVersioningService {
  /**
   * Get version history for a document
   */
  static async getVersionHistory(
    collection: string,
    documentId: string
  ): Promise<DocumentVersion[]> {
    const response = await apiService.get<ApiResponse<DocumentVersion[]>>(
      `/database/collections/${collection}/${documentId}/versions`
    );
    return response.data.data;
  }

  /**
   * Create a new version of a document
   */
  static async createVersion(
    collection: string,
    documentId: string,
    data: any,
    comment?: string
  ): Promise<DocumentVersion> {
    const response = await apiService.post<ApiResponse<DocumentVersion>>(
      `/database/collections/${collection}/${documentId}/versions`,
      { data, comment }
    );
    return response.data.data;
  }

  /**
   * Restore a document to a specific version
   */
  static async restoreVersion(
    collection: string,
    documentId: string,
    versionId: string
  ): Promise<any> {
    const response = await apiService.post<ApiResponse<any>>(
      `/database/collections/${collection}/${documentId}/versions/${versionId}/restore`
    );
    return response.data.data;
  }

  /**
   * Compare two versions of a document
   */
  static async compareVersions(
    collection: string,
    documentId: string,
    version1: string,
    version2: string
  ): Promise<DocumentChange[]> {
    const response = await apiService.get<ApiResponse<DocumentChange[]>>(
      `/database/collections/${collection}/${documentId}/versions/compare?v1=${version1}&v2=${version2}`
    );
    return response.data.data;
  }

  /**
   * Calculate changes between two documents
   */
  static calculateChanges(oldDoc: any, newDoc: any, path = ''): DocumentChange[] {
    const changes: DocumentChange[] = [];

    // Handle null/undefined cases
    if (oldDoc === null || oldDoc === undefined) {
      if (newDoc !== null && newDoc !== undefined) {
        changes.push({
          field: path || 'root',
          operation: 'add',
          newValue: newDoc,
          path
        });
      }
      return changes;
    }

    if (newDoc === null || newDoc === undefined) {
      changes.push({
        field: path || 'root',
        operation: 'delete',
        oldValue: oldDoc,
        path
      });
      return changes;
    }

    // Handle primitive types
    if (typeof oldDoc !== 'object' || typeof newDoc !== 'object') {
      if (oldDoc !== newDoc) {
        changes.push({
          field: path || 'root',
          operation: 'update',
          oldValue: oldDoc,
          newValue: newDoc,
          path
        });
      }
      return changes;
    }

    // Handle arrays
    if (Array.isArray(oldDoc) || Array.isArray(newDoc)) {
      if (!Array.isArray(oldDoc) || !Array.isArray(newDoc)) {
        changes.push({
          field: path || 'root',
          operation: 'update',
          oldValue: oldDoc,
          newValue: newDoc,
          path
        });
        return changes;
      }

      // Compare array lengths and elements
      const maxLength = Math.max(oldDoc.length, newDoc.length);
      for (let i = 0; i < maxLength; i++) {
        const fieldPath = path ? `${path}[${i}]` : `[${i}]`;
        
        if (i >= oldDoc.length) {
          changes.push({
            field: `${path}[${i}]`,
            operation: 'add',
            newValue: newDoc[i],
            path: fieldPath
          });
        } else if (i >= newDoc.length) {
          changes.push({
            field: `${path}[${i}]`,
            operation: 'delete',
            oldValue: oldDoc[i],
            path: fieldPath
          });
        } else {
          changes.push(...this.calculateChanges(oldDoc[i], newDoc[i], fieldPath));
        }
      }
      return changes;
    }

    // Handle objects
    const allKeys = new Set([...Object.keys(oldDoc), ...Object.keys(newDoc)]);
    
    for (const key of allKeys) {
      const fieldPath = path ? `${path}.${key}` : key;
      
      if (!(key in oldDoc)) {
        changes.push({
          field: key,
          operation: 'add',
          newValue: newDoc[key],
          path: fieldPath
        });
      } else if (!(key in newDoc)) {
        changes.push({
          field: key,
          operation: 'delete',
          oldValue: oldDoc[key],
          path: fieldPath
        });
      } else {
        changes.push(...this.calculateChanges(oldDoc[key], newDoc[key], fieldPath));
      }
    }

    return changes;
  }

  /**
   * Validate document against schema
   */
  static async validateDocument(
    collection: string,
    data: any
  ): Promise<DocumentValidationResult> {
    try {
      const response = await apiService.post<ApiResponse<DocumentValidationResult>>(
        `/database/collections/${collection}/validate`,
        { data }
      );
      return response.data.data;
    } catch (error) {
      // Fallback client-side validation
      return this.clientSideValidation(data);
    }
  }

  /**
   * Client-side validation fallback
   */
  private static clientSideValidation(data: any): DocumentValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Basic validation rules
    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'root',
        message: 'Document must be an object',
        path: ''
      });
    }

    // Check for dangerous fields
    const dangerousFields = ['$where', 'eval', 'function'];
    const dataStr = JSON.stringify(data);
    
    for (const field of dangerousFields) {
      if (dataStr.includes(field)) {
        warnings.push({
          field: 'security',
          message: `Potentially dangerous field detected: ${field}`,
          path: ''
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Format change description for display
   */
  static formatChangeDescription(change: DocumentChange): string {
    switch (change.operation) {
      case 'add':
        return `Added ${change.field} with value: ${this.formatValue(change.newValue)}`;
      case 'delete':
        return `Removed ${change.field} (was: ${this.formatValue(change.oldValue)})`;
      case 'update':
        return `Changed ${change.field} from ${this.formatValue(change.oldValue)} to ${this.formatValue(change.newValue)}`;
      default:
        return `Unknown operation on ${change.field}`;
    }
  }

  /**
   * Format value for display
   */
  private static formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      const str = JSON.stringify(value);
      return str.length > 50 ? `${str.substring(0, 47)}...` : str;
    }
    return String(value);
  }
}