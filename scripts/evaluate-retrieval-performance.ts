import { KnowledgeBaseRetrieval, RelevantDocument } from '../lib/knowledge-base-retrieval';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface EvaluationQuery {
  id: string;
  industry: string;
  query: string;
  expected_topics: string[];
  expected_docs?: string[];
  min_score: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface EvaluationResult {
  query_id: string;
  query: string;
  industry: string;
  results_count: number;
  top_score: number;
  avg_score: number;
  latency_ms: number;
  precision_at_3: number;
  precision_at_5: number;
  topic_coverage: number;
  hallucination_risk: number;
  passed: boolean;
}

interface BenchmarkSummary {
  total_queries: number;
  avg_latency_ms: number;
  avg_precision_at_3: number;
  avg_precision_at_5: number;
  avg_topic_coverage: number;
  pass_rate: number;
  performance_grade: string;
  industry_breakdown: Record<string, any>;
  recommendations: string[];
}

class RetrievalEvaluator {
  private retrieval: KnowledgeBaseRetrieval;

  constructor() {
    this.retrieval = new KnowledgeBaseRetrieval();
  }

  private generateEvaluationQueries(): EvaluationQuery[] {
    return [
      // Agriculture - Easy
      {
        id: 'agri_001',
        industry: 'agriculture',
        query: 'How can AI help with crop monitoring?',
        expected_topics: ['crop monitoring', 'satellite', 'drone', 'computer vision'],
        min_score: 0.4,
        difficulty: 'easy'
      },
      {
        id: 'agri_002',
        industry: 'agriculture',
        query: 'What are the costs of implementing precision farming?',
        expected_topics: ['precision farming', 'cost', 'ROI', 'investment'],
        min_score: 0.3,
        difficulty: 'easy'
      },
      {
        id: 'agri_003',
        industry: 'agriculture',
        query: 'AI solutions for livestock management',
        expected_topics: ['livestock', 'health monitoring', 'activity', 'breeding'],
        min_score: 0.4,
        difficulty: 'medium'
      },

      // Clean Energy - Easy to Hard
      {
        id: 'energy_001',
        industry: 'clean_energy',
        query: 'Smart grid optimization with AI',
        expected_topics: ['smart grid', 'optimization', 'demand forecasting'],
        min_score: 0.4,
        difficulty: 'easy'
      },
      {
        id: 'energy_002',
        industry: 'clean_energy',
        query: 'Solar power prediction models for small energy companies',
        expected_topics: ['solar', 'prediction', 'forecasting', 'SME'],
        min_score: 0.3,
        difficulty: 'medium'
      },
      {
        id: 'energy_003',
        industry: 'clean_energy',
        query: 'Energy trading algorithms for wind farm operators',
        expected_topics: ['energy trading', 'wind', 'algorithms', 'market'],
        min_score: 0.3,
        difficulty: 'hard'
      },

      // Medical - Easy to Hard
      {
        id: 'medical_001',
        industry: 'medical',
        query: 'AI diagnostic systems for small medical practices',
        expected_topics: ['diagnostic', 'AI systems', 'medical practice', 'pathology'],
        min_score: 0.4,
        difficulty: 'easy'
      },
      {
        id: 'medical_002',
        industry: 'medical',
        query: 'TGA regulatory requirements for medical AI',
        expected_topics: ['TGA', 'regulatory', 'compliance', 'medical AI'],
        min_score: 0.3,
        difficulty: 'medium'
      },
      {
        id: 'medical_003',
        industry: 'medical',
        query: 'Implementing telehealth AI solutions in rural clinics',
        expected_topics: ['telehealth', 'rural', 'remote monitoring', 'implementation'],
        min_score: 0.3,
        difficulty: 'hard'
      },

      // Manufacturing - Easy to Hard
      {
        id: 'mfg_001',
        industry: 'enabling_capabilities',
        query: 'Predictive maintenance with AI for manufacturing',
        expected_topics: ['predictive maintenance', 'manufacturing', 'equipment', 'sensors'],
        min_score: 0.4,
        difficulty: 'easy'
      },
      {
        id: 'mfg_002',
        industry: 'enabling_capabilities',
        query: 'Computer vision quality control in production lines',
        expected_topics: ['computer vision', 'quality control', 'production', 'automation'],
        min_score: 0.3,
        difficulty: 'medium'
      },
      {
        id: 'mfg_003',
        industry: 'enabling_capabilities',
        query: 'Industry 4.0 transformation for small manufacturers',
        expected_topics: ['Industry 4.0', 'transformation', 'manufacturing', 'integration'],
        min_score: 0.3,
        difficulty: 'hard'
      },

      // SMEC Services - Easy to Medium
      {
        id: 'smec_001',
        industry: 'all_industries',
        query: 'SMEC AI consultation services for small businesses',
        expected_topics: ['consultation', 'SMEC AI', 'services', 'small business'],
        min_score: 0.4,
        difficulty: 'easy'
      },
      {
        id: 'smec_002',
        industry: 'all_industries',
        query: 'AI Studio 8-week intensive program details',
        expected_topics: ['AI Studio', '8-week', 'intensive', 'program'],
        min_score: 0.4,
        difficulty: 'easy'
      },
      {
        id: 'smec_003',
        industry: 'all_industries',
        query: 'Training courses for AI implementation in SMEs',
        expected_topics: ['training', 'courses', 'AI implementation', 'SME'],
        min_score: 0.3,
        difficulty: 'medium'
      },

      // Cross-Industry Queries
      {
        id: 'cross_001',
        industry: 'agriculture',
        query: 'Government funding for AI adoption in Australian businesses',
        expected_topics: ['government funding', 'AI adoption', 'Australian', 'grants'],
        min_score: 0.3,
        difficulty: 'medium'
      },
      {
        id: 'cross_002',
        industry: 'medical',
        query: 'Data privacy and security for AI systems',
        expected_topics: ['data privacy', 'security', 'AI systems', 'compliance'],
        min_score: 0.3,
        difficulty: 'medium'
      },

      // Edge Cases and Difficult Queries
      {
        id: 'edge_001',
        industry: 'agriculture',
        query: 'Blockchain integration with AI for food traceability',
        expected_topics: ['blockchain', 'traceability', 'food', 'supply chain'],
        min_score: 0.2,
        difficulty: 'hard'
      },
      {
        id: 'edge_002',
        industry: 'clean_energy',
        query: 'Quantum computing applications in energy optimization',
        expected_topics: ['quantum computing', 'energy', 'optimization', 'advanced'],
        min_score: 0.2,
        difficulty: 'hard'
      },
    ];
  }

  private calculatePrecisionAtK(
    results: RelevantDocument[],
    expectedTopics: string[],
    k: number
  ): number {
    if (results.length === 0 || k === 0) return 0;

    const topResults = results.slice(0, k);
    let relevantCount = 0;

    for (const result of topResults) {
      const content = (result.content + ' ' + result.metadata.title).toLowerCase();
      const hasRelevantTopic = expectedTopics.some(topic =>
        content.includes(topic.toLowerCase())
      );
      if (hasRelevantTopic) relevantCount++;
    }

    return relevantCount / k;
  }

  private calculateTopicCoverage(
    results: RelevantDocument[],
    expectedTopics: string[]
  ): number {
    if (expectedTopics.length === 0) return 1;

    const allContent = results
      .map(r => (r.content + ' ' + r.metadata.title).toLowerCase())
      .join(' ');

    const coveredTopics = expectedTopics.filter(topic =>
      allContent.includes(topic.toLowerCase())
    );

    return coveredTopics.length / expectedTopics.length;
  }

  private calculateHallucinationRisk(results: RelevantDocument[]): number {
    // Simple heuristic: lower scores indicate higher hallucination risk
    if (results.length === 0) return 1;

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    // Risk is higher when average score is low
    if (avgScore < 0.3) return 0.8;
    if (avgScore < 0.5) return 0.5;
    if (avgScore < 0.7) return 0.3;
    return 0.1;
  }

  async evaluateQuery(query: EvaluationQuery): Promise<EvaluationResult> {
    const startTime = Date.now();
    
    try {
      const results = await this.retrieval.getRelevantDocs(
        query.industry,
        query.query,
        { topK: 5, minScore: 0.1 } // Use low minScore to get more results for evaluation
      );
      
      const latency = Date.now() - startTime;
      
      const precision3 = this.calculatePrecisionAtK(results, query.expected_topics, 3);
      const precision5 = this.calculatePrecisionAtK(results, query.expected_topics, 5);
      const topicCoverage = this.calculateTopicCoverage(results, query.expected_topics);
      const hallucinationRisk = this.calculateHallucinationRisk(results);
      
      const topScore = results.length > 0 ? results[0].score : 0;
      const avgScore = results.length > 0 
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
        : 0;

      // Pass criteria: reasonable latency, good precision, topic coverage
      const passed = latency <= 1000 && // 1 second max
                    topScore >= query.min_score &&
                    precision3 >= 0.5 &&
                    topicCoverage >= 0.5;

      return {
        query_id: query.id,
        query: query.query,
        industry: query.industry,
        results_count: results.length,
        top_score: topScore,
        avg_score: avgScore,
        latency_ms: latency,
        precision_at_3: precision3,
        precision_at_5: precision5,
        topic_coverage: topicCoverage,
        hallucination_risk: hallucinationRisk,
        passed
      };

    } catch (error) {
      console.error(`Error evaluating query ${query.id}:`, error);
      
      return {
        query_id: query.id,
        query: query.query,
        industry: query.industry,
        results_count: 0,
        top_score: 0,
        avg_score: 0,
        latency_ms: Date.now() - startTime,
        precision_at_3: 0,
        precision_at_5: 0,
        topic_coverage: 0,
        hallucination_risk: 1,
        passed: false
      };
    }
  }

  async runFullEvaluation(): Promise<BenchmarkSummary> {
    console.log('🔬 Starting Comprehensive Retrieval Evaluation\n');
    
    const queries = this.generateEvaluationQueries();
    const results: EvaluationResult[] = [];
    
    console.log(`📋 Evaluating ${queries.length} queries across all industries...\n`);
    
    // Evaluate each query
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`[${i + 1}/${queries.length}] ${query.id}: "${query.query}"`);
      
      const result = await this.evaluateQuery(query);
      results.push(result);
      
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} Score: ${result.top_score.toFixed(3)}, Latency: ${result.latency_ms}ms, P@3: ${result.precision_at_3.toFixed(2)}`);
    }
    
    console.log('\n📊 Computing Summary Statistics...\n');
    
    // Calculate summary statistics
    const totalQueries = results.length;
    const avgLatency = results.reduce((sum, r) => sum + r.latency_ms, 0) / totalQueries;
    const avgPrecision3 = results.reduce((sum, r) => sum + r.precision_at_3, 0) / totalQueries;
    const avgPrecision5 = results.reduce((sum, r) => sum + r.precision_at_5, 0) / totalQueries;
    const avgTopicCoverage = results.reduce((sum, r) => sum + r.topic_coverage, 0) / totalQueries;
    const passRate = results.filter(r => r.passed).length / totalQueries;
    
    // Industry breakdown
    const industries = [...new Set(results.map(r => r.industry))];
    const industryBreakdown: Record<string, any> = {};
    
    for (const industry of industries) {
      const industryResults = results.filter(r => r.industry === industry);
      industryBreakdown[industry] = {
        query_count: industryResults.length,
        pass_rate: industryResults.filter(r => r.passed).length / industryResults.length,
        avg_latency: industryResults.reduce((sum, r) => sum + r.latency_ms, 0) / industryResults.length,
        avg_precision_3: industryResults.reduce((sum, r) => sum + r.precision_at_3, 0) / industryResults.length,
        avg_topic_coverage: industryResults.reduce((sum, r) => sum + r.topic_coverage, 0) / industryResults.length,
      };
    }
    
    // Performance grade
    let performanceGrade = 'F';
    if (passRate >= 0.9 && avgLatency <= 300) performanceGrade = 'A';
    else if (passRate >= 0.8 && avgLatency <= 500) performanceGrade = 'B';
    else if (passRate >= 0.7 && avgLatency <= 800) performanceGrade = 'C';
    else if (passRate >= 0.6) performanceGrade = 'D';
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (avgLatency > 500) {
      recommendations.push('Consider caching frequent queries or optimizing embedding generation');
    }
    if (avgPrecision3 < 0.7) {
      recommendations.push('Improve document chunking strategy or adjust similarity thresholds');
    }
    if (avgTopicCoverage < 0.6) {
      recommendations.push('Expand knowledge base coverage or refine document topics');
    }
    if (passRate < 0.8) {
      recommendations.push('Review failed queries and adjust retrieval parameters');
    }
    
    // Save detailed results
    await this.saveEvaluationResults(results, {
      total_queries: totalQueries,
      avg_latency_ms: avgLatency,
      avg_precision_at_3: avgPrecision3,
      avg_precision_at_5: avgPrecision5,
      avg_topic_coverage: avgTopicCoverage,
      pass_rate: passRate,
      performance_grade: performanceGrade,
      industry_breakdown: industryBreakdown,
      recommendations
    });
    
    return {
      total_queries: totalQueries,
      avg_latency_ms: avgLatency,
      avg_precision_at_3: avgPrecision3,
      avg_precision_at_5: avgPrecision5,
      avg_topic_coverage: avgTopicCoverage,
      pass_rate: passRate,
      performance_grade: performanceGrade,
      industry_breakdown: industryBreakdown,
      recommendations
    };
  }

  private async saveEvaluationResults(
    results: EvaluationResult[],
    summary: BenchmarkSummary
  ): Promise<void> {
    const outputDir = path.join(process.cwd(), 'data', 'evaluation-results');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save detailed results
    const detailedResultsPath = path.join(outputDir, 'detailed-evaluation-results.json');
    await fs.writeFile(
      detailedResultsPath,
      JSON.stringify(results, null, 2),
      'utf-8'
    );
    
    // Save benchmark summary
    const summaryPath = path.join(outputDir, 'benchmark-summary.json');
    await fs.writeFile(
      summaryPath,
      JSON.stringify(summary, null, 2),
      'utf-8'
    );
    
    // Generate CSV for easy analysis
    const csvHeader = 'query_id,industry,query,results_count,top_score,avg_score,latency_ms,precision_at_3,precision_at_5,topic_coverage,hallucination_risk,passed\n';
    const csvRows = results.map(r => 
      `${r.query_id},${r.industry},"${r.query.replace(/"/g, '""')}",${r.results_count},${r.top_score},${r.avg_score},${r.latency_ms},${r.precision_at_3},${r.precision_at_5},${r.topic_coverage},${r.hallucination_risk},${r.passed}`
    ).join('\n');
    
    const csvPath = path.join(outputDir, 'evaluation-results.csv');
    await fs.writeFile(csvPath, csvHeader + csvRows, 'utf-8');
    
    console.log(`💾 Evaluation results saved to ${outputDir}`);
  }

  async runLatencyBenchmark(): Promise<void> {
    console.log('⚡ Running Latency Benchmark...\n');
    
    const testQuery = 'AI implementation for small business';
    const iterations = 10;
    const latencies: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await this.retrieval.getRelevantDocs('agriculture', testQuery, { topK: 5 });
      const latency = Date.now() - startTime;
      latencies.push(latency);
      
      console.log(`  Run ${i + 1}: ${latency}ms`);
    }
    
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / iterations;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
    
    console.log(`\n📊 Latency Statistics:`);
    console.log(`  Average: ${avgLatency.toFixed(1)}ms`);
    console.log(`  Min: ${minLatency}ms`);
    console.log(`  Max: ${maxLatency}ms`);
    console.log(`  P95: ${p95Latency}ms`);
    
    if (avgLatency <= 300) {
      console.log(`  ✅ Latency target met (≤300ms)`);
    } else {
      console.log(`  ❌ Latency target missed (${avgLatency.toFixed(1)}ms > 300ms)`);
    }
  }

  async optimizeRetrievalParameters(): Promise<void> {
    console.log('🔧 Testing Different Retrieval Parameters...\n');
    
    const testQuery = 'AI crop monitoring for farms';
    const testIndustry = 'agriculture';
    
    const parameterTests = [
      { topK: 3, minScore: 0.3, name: 'Conservative' },
      { topK: 5, minScore: 0.2, name: 'Balanced' },
      { topK: 8, minScore: 0.1, name: 'Comprehensive' },
      { topK: 10, minScore: 0.0, name: 'Maximum' }
    ];
    
    for (const params of parameterTests) {
      const startTime = Date.now();
      const results = await this.retrieval.getRelevantDocs(
        testIndustry,
        testQuery,
        { topK: params.topK, minScore: params.minScore }
      );
      const latency = Date.now() - startTime;
      
      const avgScore = results.length > 0 
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
        : 0;
      
      console.log(`${params.name} (topK=${params.topK}, minScore=${params.minScore}):`);
      console.log(`  Results: ${results.length}, Avg Score: ${avgScore.toFixed(3)}, Latency: ${latency}ms`);
    }
  }
}

// Main execution function
async function main() {
  const evaluator = new RetrievalEvaluator();
  
  try {
    // Run comprehensive evaluation
    const summary = await evaluator.runFullEvaluation();
    
    // Print summary
    console.log('🎯 Final Benchmark Summary');
    console.log(`📈 Overall Performance Grade: ${summary.performance_grade}`);
    console.log(`✅ Pass Rate: ${(summary.pass_rate * 100).toFixed(1)}%`);
    console.log(`⏱️ Average Latency: ${summary.avg_latency_ms.toFixed(1)}ms`);
    console.log(`🎯 Precision@3: ${summary.avg_precision_at_3.toFixed(3)}`);
    console.log(`📋 Topic Coverage: ${(summary.avg_topic_coverage * 100).toFixed(1)}%`);
    
    console.log('\n🏭 Industry Performance:');
    for (const [industry, stats] of Object.entries(summary.industry_breakdown)) {
      const industryStats = stats as any;
      console.log(`  ${industry}: ${(industryStats.pass_rate * 100).toFixed(1)}% pass rate, ${industryStats.avg_latency.toFixed(0)}ms avg latency`);
    }
    
    if (summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      summary.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    // Run additional benchmarks
    await evaluator.runLatencyBenchmark();
    await evaluator.optimizeRetrievalParameters();
    
    console.log('\n🎉 Performance evaluation completed!');
    
    // Check if targets are met
    const targetsMet = summary.avg_latency_ms <= 300 && summary.avg_precision_at_3 >= 0.7;
    console.log(`\n🏆 Performance Targets: ${targetsMet ? '✅ MET' : '❌ NOT MET'}`);
    
    if (!targetsMet) {
      console.log('Consider the recommendations above to improve performance.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Evaluation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}