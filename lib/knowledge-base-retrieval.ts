import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RelevantDocument {
  id: string;
  content: string;
  score: number;
  metadata: {
    industry: string;
    source_url: string;
    doc_id: string;
    title: string;
    token_count: number;
    chunk_index: number;
  };
}

export interface RetrievalOptions {
  topK?: number;
  minScore?: number;
  includeAllIndustries?: boolean;
  filter?: Record<string, any>;
}

export class KnowledgeBaseRetrieval {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string = 'smec-ai-knowledge-base';

  constructor() {
    // Validate required environment variables
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate embedding for a query string
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw new Error('Failed to generate query embedding');
    }
  }

  /**
   * Map industry name to namespace
   */
  private mapIndustryToNamespace(industry: string): string {
    const industryMap: Record<string, string> = {
      'agriculture': 'agriculture',
      'clean_energy': 'clean_energy',
      'clean-energy': 'clean_energy',
      'medical': 'medical',
      'healthcare': 'medical',
      'enabling_capabilities': 'enabling_capabilities',
      'enabling-capabilities': 'enabling_capabilities',
      'manufacturing': 'enabling_capabilities',
      'technology': 'enabling_capabilities',
      'all_industries': 'all_industries',
      'all-industries': 'all_industries',
      'smec-services': 'all_industries',
      'smec_services': 'all_industries',
      'general': 'all_industries'
    };

    return industryMap[industry.toLowerCase()] || industry.toLowerCase();
  }

  /**
   * Get available industries/namespaces
   */
  async getAvailableIndustries(): Promise<string[]> {
    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      
      return Object.keys(stats.namespaces || {});
    } catch (error) {
      console.error('Error getting available industries:', error);
      return [];
    }
  }

  /**
   * Core retrieval function
   */
  async getRelevantDocs(
    industry: string,
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RelevantDocument[]> {
    const {
      topK = 5,
      minScore = 0.3,
      includeAllIndustries = false,
      filter = {}
    } = options;

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Map industry to namespace
      const namespace = this.mapIndustryToNamespace(industry);
      
      // Get Pinecone index
      const index = this.pinecone.index(this.indexName);
      
      // Prepare search results array
      const allResults: RelevantDocument[] = [];

      // Search in primary namespace
      try {
        const searchResults = await index.namespace(namespace).query({
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true,
          filter: Object.keys(filter).length > 0 ? filter : undefined,
        });

        const namespaceResults = searchResults.matches
          .filter(match => (match.score || 0) >= minScore)
          .map(match => ({
            id: match.id,
            content: match.metadata?.text as string || '',
            score: match.score || 0,
            metadata: {
              industry: match.metadata?.industry as string || industry,
              source_url: match.metadata?.source_url as string || '',
              doc_id: match.metadata?.doc_id as string || '',
              title: match.metadata?.title as string || '',
              token_count: match.metadata?.token_count as number || 0,
              chunk_index: match.metadata?.chunk_index as number || 0,
            },
          }));

        allResults.push(...namespaceResults);
      } catch (error) {
        console.warn(`Warning: Could not search namespace ${namespace}:`, error);
      }

      // Optionally include results from all_industries namespace (SMEC services)
      if (includeAllIndustries && namespace !== 'all_industries') {
        try {
          const generalSearchResults = await index.namespace('all_industries').query({
            vector: queryEmbedding,
            topK: Math.ceil(topK / 2), // Get fewer results from general namespace
            includeMetadata: true,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
          });

          const generalResults = generalSearchResults.matches
            .filter(match => (match.score || 0) >= minScore)
            .map(match => ({
              id: match.id,
              content: match.metadata?.text as string || '',
              score: match.score || 0,
              metadata: {
                industry: match.metadata?.industry as string || 'all_industries',
                source_url: match.metadata?.source_url as string || '',
                doc_id: match.metadata?.doc_id as string || '',
                title: match.metadata?.title as string || '',
                token_count: match.metadata?.token_count as number || 0,
                chunk_index: match.metadata?.chunk_index as number || 0,
              },
            }));

          allResults.push(...generalResults);
        } catch (error) {
          console.warn('Warning: Could not search all-industries namespace:', error);
        }
      }

      // Sort by score (descending) and limit to topK
      const sortedResults = allResults
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return sortedResults;

    } catch (error) {
      console.error('Error retrieving relevant documents:', error);
      throw new Error('Failed to retrieve relevant documents');
    }
  }

  /**
   * Multi-industry search across all relevant namespaces
   */
  async searchAcrossIndustries(
    query: string,
    industries: string[] = [],
    options: RetrievalOptions = {}
  ): Promise<RelevantDocument[]> {
    const { topK = 10, minScore = 0.3 } = options;

    try {
      // If no industries specified, search all available
      if (industries.length === 0) {
        industries = await this.getAvailableIndustries();
      }

      // Generate query embedding once
      const queryEmbedding = await this.generateQueryEmbedding(query);
      const index = this.pinecone.index(this.indexName);
      
      const allResults: RelevantDocument[] = [];
      const resultsPerNamespace = Math.ceil(topK / industries.length);

      // Search each industry namespace
      for (const industry of industries) {
        const namespace = this.mapIndustryToNamespace(industry);
        
        try {
          const searchResults = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: resultsPerNamespace,
            includeMetadata: true,
          });

          const namespaceResults = searchResults.matches
            .filter(match => (match.score || 0) >= minScore)
            .map(match => ({
              id: match.id,
              content: match.metadata?.text as string || '',
              score: match.score || 0,
              metadata: {
                industry: match.metadata?.industry as string || industry,
                source_url: match.metadata?.source_url as string || '',
                doc_id: match.metadata?.doc_id as string || '',
                title: match.metadata?.title as string || '',
                token_count: match.metadata?.token_count as number || 0,
                chunk_index: match.metadata?.chunk_index as number || 0,
              },
            }));

          allResults.push(...namespaceResults);
        } catch (error) {
          console.warn(`Warning: Could not search namespace ${namespace}:`, error);
        }
      }

      // Sort by score and return top results
      return allResults
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    } catch (error) {
      console.error('Error searching across industries:', error);
      throw new Error('Failed to search across industries');
    }
  }

  /**
   * Get related documents based on a document ID
   */
  async getRelatedDocuments(
    documentId: string,
    industry: string,
    options: RetrievalOptions = {}
  ): Promise<RelevantDocument[]> {
    const { topK = 5 } = options;

    try {
      // First, get the document content to use as the query
      const namespace = this.mapIndustryToNamespace(industry);
      const index = this.pinecone.index(this.indexName);
      
      const fetchResult = await index.namespace(namespace).fetch([documentId]);
      const document = fetchResult.records[documentId];
      
      if (!document || !document.metadata?.text) {
        throw new Error('Document not found or has no content');
      }

      // Use the document content as the query to find similar documents
      const query = document.metadata.text as string;
      
      // Get relevant documents, excluding the original document
      const results = await this.getRelevantDocs(industry, query, {
        ...options,
        topK: topK + 1, // Get one extra to account for filtering out the original
      });

      // Filter out the original document and return top results
      return results
        .filter(doc => doc.id !== documentId)
        .slice(0, topK);

    } catch (error) {
      console.error('Error getting related documents:', error);
      throw new Error('Failed to get related documents');
    }
  }

  /**
   * Search with semantic query expansion
   */
  async expandedSearch(
    query: string,
    industry: string,
    options: RetrievalOptions = {}
  ): Promise<RelevantDocument[]> {
    const { topK = 8 } = options;

    try {
      // Generate expanded queries using OpenAI
      const expandedQueries = await this.generateExpandedQueries(query, industry);
      
      const allResults: RelevantDocument[] = [];
      const resultsPerQuery = Math.ceil(topK / expandedQueries.length);

      // Search with each expanded query
      for (const expandedQuery of expandedQueries) {
        const results = await this.getRelevantDocs(industry, expandedQuery, {
          ...options,
          topK: resultsPerQuery,
        });
        allResults.push(...results);
      }

      // Deduplicate by ID and sort by score
      const uniqueResults = new Map<string, RelevantDocument>();
      for (const result of allResults) {
        if (!uniqueResults.has(result.id) || 
            (uniqueResults.get(result.id)?.score || 0) < result.score) {
          uniqueResults.set(result.id, result);
        }
      }

      return Array.from(uniqueResults.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    } catch (error) {
      console.error('Error in expanded search:', error);
      // Fallback to regular search
      return this.getRelevantDocs(query, industry, options);
    }
  }

  /**
   * Generate expanded queries for better retrieval
   */
  private async generateExpandedQueries(query: string, industry: string): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert in ${industry} and AI applications for small-medium enterprises. Generate 3 semantically related but distinct queries that would help find relevant information for the original query. Focus on practical, SME-relevant aspects.`
          },
          {
            role: 'user',
            content: `Original query: "${query}"\n\nGenerate 3 expanded queries (one per line, no numbers or bullets):`
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const expandedText = response.choices[0]?.message?.content || '';
      const expandedQueries = expandedText
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 10)
        .slice(0, 3);

      // Always include the original query
      return [query, ...expandedQueries];

    } catch (error) {
      console.warn('Could not generate expanded queries, using original:', error);
      return [query];
    }
  }

  /**
   * Get retrieval statistics
   */
  async getRetrievalStats(): Promise<Record<string, any>> {
    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      
      return {
        total_vectors: stats.totalRecordCount,
        namespaces: Object.keys(stats.namespaces || {}),
        namespace_counts: stats.namespaces,
        index_fullness: stats.indexFullness,
        dimension: stats.dimension,
      };
    } catch (error) {
      console.error('Error getting retrieval stats:', error);
      return {};
    }
  }
}

// Export a function to get a default instance for convenience
let _defaultInstance: KnowledgeBaseRetrieval | null = null;

export function getKnowledgeBaseRetrieval(): KnowledgeBaseRetrieval {
  if (!_defaultInstance) {
    _defaultInstance = new KnowledgeBaseRetrieval();
  }
  return _defaultInstance;
}

// Export utility functions
export async function getRelevantDocs(
  industry: string,
  query: string,
  topK: number = 5
): Promise<RelevantDocument[]> {
  return getKnowledgeBaseRetrieval().getRelevantDocs(industry, query, { topK });
}

export async function searchAllIndustries(
  query: string,
  topK: number = 10
): Promise<RelevantDocument[]> {
  return getKnowledgeBaseRetrieval().searchAcrossIndustries(query, [], { topK });
}