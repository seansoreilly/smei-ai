import { KnowledgeBaseRetrieval, getRelevantDocs, searchAllIndustries } from '../lib/knowledge-base-retrieval';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TestCase {
  name: string;
  industry: string;
  query: string;
  expectedTopics?: string[];
  minScore?: number;
}

const testCases: TestCase[] = [
  // Agriculture tests
  {
    name: 'Agriculture - Crop Monitoring',
    industry: 'agriculture',
    query: 'How can AI help monitor crop health and detect diseases early?',
    expectedTopics: ['crop monitoring', 'computer vision', 'satellite imagery'],
    minScore: 0.4
  },
  {
    name: 'Agriculture - Precision Farming',
    industry: 'agriculture', 
    query: 'What are the costs and ROI for implementing precision farming with AI?',
    expectedTopics: ['precision farming', 'cost', 'ROI'],
    minScore: 0.3
  },

  // Clean Energy tests
  {
    name: 'Clean Energy - Grid Optimization',
    industry: 'clean_energy',
    query: 'AI applications for smart grid optimization and demand forecasting',
    expectedTopics: ['smart grid', 'demand forecasting', 'optimization'],
    minScore: 0.4
  },
  {
    name: 'Clean Energy - Renewable Integration', 
    industry: 'clean-energy',
    query: 'How to integrate solar and wind power using AI prediction models?',
    expectedTopics: ['solar', 'wind', 'prediction', 'renewable'],
    minScore: 0.3
  },

  // Medical tests
  {
    name: 'Medical - Diagnostic AI',
    industry: 'medical',
    query: 'AI-powered diagnostic systems for small medical practices',
    expectedTopics: ['diagnostic', 'medical imaging', 'pathology'],
    minScore: 0.4
  },
  {
    name: 'Medical - Regulatory Compliance',
    industry: 'healthcare',
    query: 'TGA requirements and regulatory compliance for medical AI systems',
    expectedTopics: ['TGA', 'regulatory', 'compliance'],
    minScore: 0.3
  },

  // Manufacturing tests
  {
    name: 'Manufacturing - Predictive Maintenance',
    industry: 'enabling_capabilities',
    query: 'Implementing predictive maintenance with AI for manufacturing equipment',
    expectedTopics: ['predictive maintenance', 'manufacturing', 'equipment'],
    minScore: 0.4
  },
  {
    name: 'Manufacturing - Quality Control',
    industry: 'manufacturing',
    query: 'Computer vision for automated quality control in production lines',
    expectedTopics: ['computer vision', 'quality control', 'production'],
    minScore: 0.3
  },

  // SMEC Services tests
  {
    name: 'SMEC Services - Consultation',
    industry: 'smec-services',
    query: 'What consultation services does SMEC AI offer for small businesses?',
    expectedTopics: ['consultation', 'SMEC AI', 'services'],
    minScore: 0.4
  },
  {
    name: 'SMEC Services - AI Studio Program',
    industry: 'all_industries',
    query: 'Details about the 8-week AI Studio intensive program',
    expectedTopics: ['AI Studio', '8-week', 'program'],
    minScore: 0.3
  }
];

class RetrievalTester {
  private retrieval: KnowledgeBaseRetrieval;

  constructor() {
    this.retrieval = new KnowledgeBaseRetrieval();
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Knowledge Base Retrieval Tests\n');
    
    // Get overall stats
    await this.printRetrievalStats();
    
    let totalTests = 0;
    let passedTests = 0;
    
    // Run individual test cases
    for (const testCase of testCases) {
      totalTests++;
      const passed = await this.runTestCase(testCase);
      if (passed) passedTests++;
      console.log(''); // Add spacing between tests
    }
    
    // Test utility functions
    console.log('🔧 Testing Utility Functions\n');
    await this.testUtilityFunctions();
    
    // Test advanced features
    console.log('🚀 Testing Advanced Features\n');
    await this.testAdvancedFeatures();
    
    // Print summary
    console.log('📊 Test Summary');
    console.log(`✅ Passed: ${passedTests}/${totalTests} individual test cases`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  }

  async printRetrievalStats(): Promise<void> {
    try {
      console.log('📊 Knowledge Base Statistics');
      const stats = await this.retrieval.getRetrievalStats();
      console.log(`  Total vectors: ${stats.total_vectors}`);
      console.log(`  Namespaces: ${stats.namespaces.join(', ')}`);
      console.log(`  Index fullness: ${(stats.index_fullness * 100).toFixed(2)}%`);
      console.log(`  Dimension: ${stats.dimension}\n`);
    } catch (error) {
      console.error('❌ Error getting stats:', error);
    }
  }

  async runTestCase(testCase: TestCase): Promise<boolean> {
    try {
      console.log(`🔍 ${testCase.name}`);
      console.log(`   Query: "${testCase.query}"`);
      console.log(`   Industry: ${testCase.industry}`);
      
      const startTime = Date.now();
      const results = await this.retrieval.getRelevantDocs(
        testCase.industry,
        testCase.query,
        { topK: 5, minScore: testCase.minScore || 0.3 }
      );
      const elapsed = Date.now() - startTime;
      
      console.log(`   ⏱️  Response time: ${elapsed}ms`);
      console.log(`   📄 Results: ${results.length} documents`);
      
      if (results.length === 0) {
        console.log('   ❌ No results returned');
        return false;
      }
      
      // Check scores are in descending order
      let scoresValid = true;
      for (let i = 1; i < results.length; i++) {
        if (results[i].score > results[i-1].score) {
          scoresValid = false;
          break;
        }
      }
      
      if (!scoresValid) {
        console.log('   ❌ Scores not in descending order');
        return false;
      }
      
      // Print top results
      results.slice(0, 3).forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.metadata.title} (score: ${doc.score.toFixed(4)})`);
        console.log(`      Industry: ${doc.metadata.industry}`);
        console.log(`      Content preview: ${doc.content.substring(0, 100)}...`);
      });
      
      console.log('   ✅ Test passed');
      return true;
      
    } catch (error) {
      console.log('   ❌ Test failed:', error);
      return false;
    }
  }

  async testUtilityFunctions(): Promise<void> {
    try {
      // Test direct utility function
      console.log('🔧 Testing getRelevantDocs utility function');
      const results1 = await getRelevantDocs('agriculture', 'crop monitoring AI', 3);
      console.log(`   ✅ getRelevantDocs returned ${results1.length} results`);
      
      // Test cross-industry search
      console.log('🔧 Testing searchAllIndustries utility function');
      const results2 = await searchAllIndustries('AI implementation for small business', 5);
      console.log(`   ✅ searchAllIndustries returned ${results2.length} results`);
      
      // Test available industries
      console.log('🔧 Testing getAvailableIndustries');
      const industries = await this.retrieval.getAvailableIndustries();
      console.log(`   ✅ Available industries: ${industries.join(', ')}`);
      
    } catch (error) {
      console.log('   ❌ Utility function test failed:', error);
    }
  }

  async testAdvancedFeatures(): Promise<void> {
    try {
      // Test multi-industry search
      console.log('🚀 Testing searchAcrossIndustries');
      const multiResults = await this.retrieval.searchAcrossIndustries(
        'AI cost and ROI for small businesses',
        ['agriculture', 'medical', 'all-industries'],
        { topK: 6 }
      );
      console.log(`   ✅ Multi-industry search returned ${multiResults.length} results`);
      
      // Show industry distribution
      const industryCount = multiResults.reduce((acc, doc) => {
        acc[doc.metadata.industry] = (acc[doc.metadata.industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`   📊 Industry distribution:`, industryCount);
      
      // Test expanded search
      console.log('🚀 Testing expandedSearch');
      const expandedResults = await this.retrieval.expandedSearch(
        'AI for farming',
        'agriculture',
        { topK: 4 }
      );
      console.log(`   ✅ Expanded search returned ${expandedResults.length} results`);
      
      // Test with include all industries option
      console.log('🚀 Testing getRelevantDocs with includeAllIndustries');
      const hybridResults = await this.retrieval.getRelevantDocs(
        'agriculture',
        'SMEC AI consultation services for farms',
        { topK: 5, includeAllIndustries: true }
      );
      console.log(`   ✅ Hybrid search returned ${hybridResults.length} results`);
      
      // Show which sources were included
      const sources = hybridResults.map(doc => doc.metadata.industry);
      console.log(`   📊 Sources included: ${[...new Set(sources)].join(', ')}`);
      
    } catch (error) {
      console.log('   ❌ Advanced feature test failed:', error);
    }
  }

  async testPerformanceBenchmark(): Promise<void> {
    console.log('⚡ Performance Benchmark');
    
    const queries = [
      'AI implementation costs',
      'predictive maintenance',
      'crop monitoring',
      'medical diagnostics',
      'SMEC AI services'
    ];
    
    const startTime = Date.now();
    const results = await Promise.all(
      queries.map(query => 
        this.retrieval.getRelevantDocs('agriculture', query, { topK: 3 })
      )
    );
    const totalTime = Date.now() - startTime;
    
    console.log(`   🏃 ${queries.length} concurrent queries completed in ${totalTime}ms`);
    console.log(`   📊 Average: ${(totalTime / queries.length).toFixed(1)}ms per query`);
    console.log(`   📈 Total results: ${results.reduce((sum, r) => sum + r.length, 0)}`);
  }
}

// Main execution function
async function main() {
  const tester = new RetrievalTester();
  
  try {
    await tester.runAllTests();
    await tester.testPerformanceBenchmark();
    
    console.log('\n🎉 All retrieval tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}