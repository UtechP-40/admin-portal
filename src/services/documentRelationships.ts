import { apiService } from './api';
import type { DocumentRelationship, DocumentSchema } from '../types/database';
import type { ApiResponse } from '../types/api';

export class DocumentRelationshipService {
  /**
   * Get relationships for a document
   */
  static async getDocumentRelationships(
    collection: string,
    documentId: string
  ): Promise<DocumentRelationship[]> {
    const response = await apiService.get<ApiResponse<DocumentRelationship[]>>(
      `/database/collections/${collection}/${documentId}/relationships`
    );
    return response.data.data;
  }

  /**
   * Get related documents for a specific relationship
   */
  static async getRelatedDocuments(
    collection: string,
    documentId: string,
    relationshipField: string,
    options: {
      page?: number;
      limit?: number;
      populate?: boolean;
    } = {}
  ): Promise<{ documents: any[]; total: number }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.populate) params.append('populate', 'true');

    const response = await apiService.get<ApiResponse<{ documents: any[]; total: number }>>(
      `/database/collections/${collection}/${documentId}/relationships/${relationshipField}?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Create relationship between documents
   */
  static async createRelationship(
    sourceCollection: string,
    sourceId: string,
    targetCollection: string,
    targetId: string,
    relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many',
    field: string
  ): Promise<void> {
    await apiService.post<ApiResponse<void>>(
      `/database/relationships`,
      {
        sourceCollection,
        sourceId,
        targetCollection,
        targetId,
        relationshipType,
        field
      }
    );
  }

  /**
   * Remove relationship between documents
   */
  static async removeRelationship(
    sourceCollection: string,
    sourceId: string,
    targetCollection: string,
    targetId: string,
    field: string
  ): Promise<void> {
    await apiService.delete<ApiResponse<void>>(
      `/database/relationships`,
      {
        data: {
          sourceCollection,
          sourceId,
          targetCollection,
          targetId,
          field
        }
      }
    );
  }

  /**
   * Get schema with relationship information
   */
  static async getSchemaWithRelationships(collection: string): Promise<DocumentSchema> {
    const response = await apiService.get<ApiResponse<DocumentSchema>>(
      `/database/collections/${collection}/schema`
    );
    return response.data.data;
  }

  /**
   * Analyze document relationships and suggest connections
   */
  static async analyzeRelationships(
    collection: string,
    documentId: string
  ): Promise<{
    existing: DocumentRelationship[];
    suggested: Array<{
      field: string;
      targetCollection: string;
      confidence: number;
      reason: string;
    }>;
  }> {
    const response = await apiService.get<ApiResponse<any>>(
      `/database/collections/${collection}/${documentId}/relationships/analyze`
    );
    return response.data.data;
  }

  /**
   * Build relationship graph data for visualization
   */
  static buildRelationshipGraph(
    document: any,
    relationships: DocumentRelationship[]
  ): {
    nodes: Array<{
      id: string;
      label: string;
      type: 'document' | 'related';
      collection: string;
      data: any;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      label: string;
      type: string;
    }>;
  } {
    const nodes = [];
    const edges = [];

    // Add main document node
    nodes.push({
      id: document._id,
      label: this.getDocumentLabel(document),
      type: 'document' as const,
      collection: 'main',
      data: document
    });

    // Add related document nodes and edges
    relationships.forEach((rel, index) => {
      if (rel.documents) {
        rel.documents.forEach((relDoc, docIndex) => {
          const nodeId = `${rel.targetCollection}_${relDoc._id}`;
          
          nodes.push({
            id: nodeId,
            label: this.getDocumentLabel(relDoc),
            type: 'related' as const,
            collection: rel.targetCollection,
            data: relDoc
          });

          edges.push({
            id: `edge_${index}_${docIndex}`,
            source: document._id,
            target: nodeId,
            label: rel.field,
            type: rel.type
          });
        });
      }
    });

    return { nodes, edges };
  }

  /**
   * Get a readable label for a document
   */
  private static getDocumentLabel(document: any): string {
    // Try common label fields
    const labelFields = ['name', 'title', 'label', 'username', 'email', 'code'];
    
    for (const field of labelFields) {
      if (document[field]) {
        return String(document[field]);
      }
    }

    // Fallback to ID
    return document._id ? String(document._id).substring(0, 8) + '...' : 'Unknown';
  }

  /**
   * Validate relationship constraints
   */
  static validateRelationship(
    relationship: DocumentRelationship,
    sourceDoc: any,
    targetDoc: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if source document has the relationship field
    if (!sourceDoc[relationship.field]) {
      errors.push(`Source document missing field: ${relationship.field}`);
    }

    // Check relationship type constraints
    switch (relationship.type) {
      case 'one-to-one':
        if (Array.isArray(sourceDoc[relationship.field])) {
          errors.push('One-to-one relationship cannot have multiple values');
        }
        break;
      case 'one-to-many':
        if (!Array.isArray(sourceDoc[relationship.field])) {
          errors.push('One-to-many relationship must be an array');
        }
        break;
      case 'many-to-many':
        if (!Array.isArray(sourceDoc[relationship.field])) {
          errors.push('Many-to-many relationship must be an array');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get relationship statistics
   */
  static async getRelationshipStats(collection: string): Promise<{
    totalRelationships: number;
    relationshipsByType: Record<string, number>;
    mostConnectedDocuments: Array<{
      documentId: string;
      connectionCount: number;
    }>;
    orphanedDocuments: number;
  }> {
    const response = await apiService.get<ApiResponse<any>>(
      `/database/collections/${collection}/relationships/stats`
    );
    return response.data.data;
  }
}