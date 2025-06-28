import { KnowledgeBaseRetrieval } from '../lib/knowledge-base-retrieval';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

class RetrievalOptimizer {
  private retrieval: KnowledgeBaseRetrieval;

  constructor() {
    this.retrieval = new KnowledgeBaseRetrieval();
  }

  async analyzePerformanceBottlenecks(): Promise<void> {
    console.log('🔍 Analyzing Performance Bottlenecks\n');
    
    const testQuery = 'AI implementation for small business';
    const testIndustry = 'agriculture';
    
    // Test embedding generation time
    console.log('⏱️ Testing embedding generation...');
    const embeddingStartTime = Date.now();
    // Access private method through any cast for testing
    await (this.retrieval as any).generateQueryEmbedding(testQuery);
    const embeddingTime = Date.now() - embeddingStartTime;
    console.log(`  Embedding generation: ${embeddingTime}ms\n`);
    
    // Test full retrieval
    console.log('⏱️ Testing full retrieval...');
    const fullStartTime = Date.now();
    await this.retrieval.getRelevantDocs(testIndustry, testQuery, { topK: 5 });
    const fullTime = Date.now() - fullStartTime;
    console.log(`  Full retrieval: ${fullTime}ms`);
    console.log(`  Estimated Pinecone query time: ${fullTime - embeddingTime}ms\n`);
    
    // Recommendations
    console.log('💡 Performance Analysis:');
    if (embeddingTime > 200) {
      console.log('  ⚠️ Embedding generation is slow - consider caching or batching');
    }
    if ((fullTime - embeddingTime) > 200) {
      console.log('  ⚠️ Pinecone queries are slow - check network latency and index size');
    }
    if (fullTime > 500) {
      console.log('  ⚠️ Overall latency too high - implement caching strategy');
    }
  }

  async testCachingStrategy(): Promise<void> {
    console.log('💾 Testing Caching Strategy\n');
    
    const testQuery = 'crop monitoring AI solutions';
    const testIndustry = 'agriculture';
    
    // First call (cold)
    console.log('❄️ Cold call...');
    const coldStart = Date.now();
    const coldResults = await this.retrieval.getRelevantDocs(testIndustry, testQuery, { topK: 5 });
    const coldTime = Date.now() - coldStart;
    console.log(`  Cold call time: ${coldTime}ms`);
    
    // Second call (should be faster due to any internal caching)
    console.log('🔥 Warm call...');
    const warmStart = Date.now();
    const warmResults = await this.retrieval.getRelevantDocs(testIndustry, testQuery, { topK: 5 });
    const warmTime = Date.now() - warmStart;
    console.log(`  Warm call time: ${warmTime}ms`);
    
    const improvement = ((coldTime - warmTime) / coldTime) * 100;
    console.log(`  Improvement: ${improvement.toFixed(1)}%\n`);
    
    // Verify results are consistent
    const consistent = coldResults.length === warmResults.length &&
                      coldResults[0]?.id === warmResults[0]?.id;
    console.log(`  Results consistent: ${consistent ? '✅' : '❌'}`);
  }

  async optimizeQueryParameters(): Promise<void> {
    console.log('🎯 Optimizing Query Parameters\n');
    
    const testQueries = [
      { query: 'AI crop monitoring', industry: 'agriculture' },
      { query: 'smart grid optimization', industry: 'clean_energy' },
      { query: 'medical diagnostics AI', industry: 'medical' }
    ];
    
    const paramCombinations = [
      { topK: 3, minScore: 0.4 },
      { topK: 5, minScore: 0.3 },
      { topK: 8, minScore: 0.2 }
    ];
    
    for (const params of paramCombinations) {
      console.log(`\n📊 Testing topK=${params.topK}, minScore=${params.minScore}`);
      
      let totalTime = 0;
      let totalResults = 0;
      let totalScore = 0;
      
      for (const test of testQueries) {
        const startTime = Date.now();
        const results = await this.retrieval.getRelevantDocs(
          test.industry,
          test.query,
          { topK: params.topK, minScore: params.minScore }
        );
        const queryTime = Date.now() - startTime;
        
        totalTime += queryTime;
        totalResults += results.length;
        totalScore += results.length > 0 ? results[0].score : 0;
      }
      
      const avgTime = totalTime / testQueries.length;
      const avgResults = totalResults / testQueries.length;
      const avgScore = totalScore / testQueries.length;
      
      console.log(`  Avg time: ${avgTime.toFixed(0)}ms`);
      console.log(`  Avg results: ${avgResults.toFixed(1)}`);
      console.log(`  Avg top score: ${avgScore.toFixed(3)}`);
      
      // Calculate efficiency score (quality / time)
      const efficiency = (avgScore * avgResults) / (avgTime / 100);
      console.log(`  Efficiency score: ${efficiency.toFixed(3)}`);
    }
  }

  async testConcurrentQueries(): Promise<void> {
    console.log('\n🚀 Testing Concurrent Query Performance\n');
    
    const queries = [
      { query: 'AI crop monitoring', industry: 'agriculture' },
      { query: 'smart grid optimization', industry: 'clean_energy' },
      { query: 'medical diagnostics', industry: 'medical' },
      { query: 'manufacturing automation', industry: 'enabling_capabilities' },
      { query: 'SMEC AI services', industry: 'all_industries' }
    ];
    
    // Sequential execution
    console.log('📝 Sequential execution:');
    const sequentialStart = Date.now();
    for (const query of queries) {
      await this.retrieval.getRelevantDocs(query.industry, query.query, { topK: 3 });
    }
    const sequentialTime = Date.now() - sequentialStart;
    console.log(`  Total time: ${sequentialTime}ms`);
    console.log(`  Average per query: ${(sequentialTime / queries.length).toFixed(0)}ms`);
    
    // Concurrent execution
    console.log('\n⚡ Concurrent execution:');
    const concurrentStart = Date.now();
    await Promise.all(
      queries.map(query => 
        this.retrieval.getRelevantDocs(query.industry, query.query, { topK: 3 })
      )
    );
    const concurrentTime = Date.now() - concurrentStart;
    console.log(`  Total time: ${concurrentTime}ms`);
    console.log(`  Average per query: ${(concurrentTime / queries.length).toFixed(0)}ms`);
    
    const speedup = sequentialTime / concurrentTime;
    console.log(`  Speedup factor: ${speedup.toFixed(2)}x`);
  }

  async generateOptimizationReport(): Promise<void> {
    console.log('\n📋 Optimization Recommendations\n');
    
    const recommendations = [
      {
        issue: 'High Latency (>1000ms average)',
        impact: 'High',
        solutions: [
          'Implement embedding caching with Redis or in-memory cache',
          'Use smaller embedding models if precision allows',
          'Implement connection pooling for Pinecone',
          'Add request timeouts and circuit breakers'
        ]
      },
      {
        issue: 'Variable Response Times',
        impact: 'Medium', 
        solutions: [
          'Implement query result caching for common queries',
          'Use CDN for static responses',
          'Add query preprocessing to standardize inputs',
          'Monitor and alert on performance degradation'
        ]
      },
      {
        issue: 'Embedding Generation Overhead',
        impact: 'Medium',
        solutions: [
          'Batch similar queries when possible',
          'Pre-compute embeddings for common queries',
          'Use faster embedding models for real-time queries',
          'Implement async processing for non-critical queries'
        ]
      }
    ];
    
    for (const rec of recommendations) {
      console.log(`🔴 ${rec.issue} (Impact: ${rec.impact})`);
      rec.solutions.forEach(solution => console.log(`  💡 ${solution}`));
      console.log('');
    }
    
    console.log('🎯 Immediate Actions:');
    console.log('  1. Set topK=3 and minScore=0.3 for better performance');
    console.log('  2. Implement request timeouts (max 2 seconds)');
    console.log('  3. Add error handling and fallback responses');
    console.log('  4. Monitor query latency and implement alerting');
    console.log('  5. Consider implementing a simple in-memory cache for frequent queries');
  }
}

// Main execution function
async function main() {
  const optimizer = new RetrievalOptimizer();
  
  try {
    await optimizer.analyzePerformanceBottlenecks();
    await optimizer.testCachingStrategy();
    await optimizer.optimizeQueryParameters();
    await optimizer.testConcurrentQueries();
    await optimizer.generateOptimizationReport();
    
    console.log('\n✅ Optimization analysis complete!');
    
  } catch (error) {
    console.error('❌ Optimization analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}