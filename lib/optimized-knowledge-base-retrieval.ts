import { KnowledgeBaseRetrieval, RelevantDocument, RetrievalOptions } from './knowledge-base-retrieval';

interface CacheEntry {
  results: RelevantDocument[];
  timestamp: number;
  ttl: number;
}

interface OptimizedRetrievalOptions extends RetrievalOptions {
  useCache?: boolean;
  timeout?: number;
}

export class OptimizedKnowledgeBaseRetrieval {
  private baseRetrieval: KnowledgeBaseRetrieval;
  private embeddingCache: Map<string, { embedding: number[]; timestamp: number }>;
  private resultCache: Map<string, CacheEntry>;
  private readonly EMBEDDING_CACHE_TTL = 3600000; // 1 hour
  private readonly RESULT_CACHE_TTL = 300000; // 5 minutes
  private readonly DEFAULT_TIMEOUT = 2000; // 2 seconds

  constructor() {
    this.baseRetrieval = new KnowledgeBaseRetrieval();
    this.embeddingCache = new Map();
    this.resultCache = new Map();
    
    // Cleanup old cache entries every 5 minutes
    setInterval(() => this.cleanupCache(), 300000);
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    // Clean embedding cache
    for (const [key, entry] of this.embeddingCache.entries()) {
      if (now - entry.timestamp > this.EMBEDDING_CACHE_TTL) {
        this.embeddingCache.delete(key);
      }
    }
    
    // Clean result cache
    for (const [key, entry] of this.resultCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.resultCache.delete(key);
      }
    }
  }

  private generateCacheKey(industry: string, query: string, options: OptimizedRetrievalOptions): string {
    const { topK = 3, minScore = 0.3, includeAllIndustries = false } = options;
    return `${industry}:${query}:${topK}:${minScore}:${includeAllIndustries}`;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Optimized retrieval with caching and performance improvements
   */
  async getRelevantDocs(
    industry: string,
    query: string,
    options: OptimizedRetrievalOptions = {}
  ): Promise<RelevantDocument[]> {
    // Set optimized defaults
    const opts: OptimizedRetrievalOptions = {
      topK: 3, // Reduced from 5 for better performance
      minScore: 0.3, // Increased from default for better quality
      useCache: true,
      timeout: this.DEFAULT_TIMEOUT,
      ...options
    };

    const cacheKey = this.generateCacheKey(industry, query, opts);

    // Check result cache first
    if (opts.useCache) {
      const cached = this.resultCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.results;
      }
    }

    try {
      // Use timeout to prevent hanging requests
      const results = await this.withTimeout(
        this.baseRetrieval.getRelevantDocs(industry, query, opts),
        opts.timeout!
      );

      // Cache successful results
      if (opts.useCache && results.length > 0) {
        this.resultCache.set(cacheKey, {
          results,
          timestamp: Date.now(),
          ttl: this.RESULT_CACHE_TTL
        });
      }

      return results;

    } catch (error) {
      console.warn(`Retrieval failed for query "${query}":`, error);
      
      // Return cached results if available, even if expired
      const staleCache = this.resultCache.get(cacheKey);
      if (staleCache) {
        console.warn('Returning stale cached results due to error');
        return staleCache.results;
      }

      // Return empty results as fallback
      return [];
    }
  }

  /**
   * Fast search with aggressive optimization
   */
  async fastSearch(
    industry: string,
    query: string
  ): Promise<RelevantDocument[]> {
    return this.getRelevantDocs(industry, query, {
      topK: 3,
      minScore: 0.4,
      useCache: true,
      timeout: 1000 // Even more aggressive timeout
    });
  }

  /**
   * Comprehensive search for when quality matters more than speed
   */
  async comprehensiveSearch(
    industry: string,
    query: string
  ): Promise<RelevantDocument[]> {
    return this.getRelevantDocs(industry, query, {
      topK: 8,
      minScore: 0.2,
      includeAllIndustries: true,
      useCache: true,
      timeout: 5000 // Longer timeout for comprehensive search
    });
  }

  /**
   * Batch process multiple queries efficiently
   */
  async batchSearch(
    queries: Array<{ industry: string; query: string; options?: OptimizedRetrievalOptions }>
  ): Promise<RelevantDocument[][]> {
    // Process queries concurrently for better performance
    const promises = queries.map(({ industry, query, options }) =>
      this.getRelevantDocs(industry, query, options)
    );

    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('Batch search partially failed:', error);
      // Return individual results, handling failures gracefully
      return Promise.allSettled(promises).then(results =>
        results.map(result => 
          result.status === 'fulfilled' ? result.value : []
        )
      );
    }
  }

  /**
   * Pre-warm cache with common queries
   */
  async warmupCache(commonQueries: Array<{ industry: string; query: string }>): Promise<void> {
    console.log(`🔥 Warming up cache with ${commonQueries.length} common queries...`);
    
    const batchSize = 5;
    for (let i = 0; i < commonQueries.length; i += batchSize) {
      const batch = commonQueries.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(({ industry, query }) =>
          this.getRelevantDocs(industry, query, { useCache: true })
        )
      );
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < commonQueries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('✅ Cache warmup completed');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { embeddingCacheSize: number; resultCacheSize: number; hitRate?: number } {
    return {
      embeddingCacheSize: this.embeddingCache.size,
      resultCacheSize: this.resultCache.size
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.embeddingCache.clear();
    this.resultCache.clear();
  }

  /**
   * Health check for the retrieval system
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const results = await this.fastSearch('agriculture', 'AI crop monitoring');
      const latency = Date.now() - startTime;
      
      if (latency > 2000) {
        return { status: 'unhealthy', latency, error: 'High latency detected' };
      } else if (latency > 1000 || results.length === 0) {
        return { status: 'degraded', latency, error: 'Performance or quality issues' };
      } else {
        return { status: 'healthy', latency };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        latency: Date.now() - startTime, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export optimized instance and utility functions
let _optimizedInstance: OptimizedKnowledgeBaseRetrieval | null = null;

export function getOptimizedRetrieval(): OptimizedKnowledgeBaseRetrieval {
  if (!_optimizedInstance) {
    _optimizedInstance = new OptimizedKnowledgeBaseRetrieval();
  }
  return _optimizedInstance;
}

export async function quickSearch(
  industry: string,
  query: string
): Promise<RelevantDocument[]> {
  return getOptimizedRetrieval().fastSearch(industry, query);
}

export async function detailedSearch(
  industry: string,
  query: string
): Promise<RelevantDocument[]> {
  return getOptimizedRetrieval().comprehensiveSearch(industry, query);
}