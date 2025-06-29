import { aiOpportunityAssessment, BusinessProfile } from '../lib/ai-opportunity-assessment';

async function testAssessment() {
  console.log('🧪 Testing AI Opportunity Assessment Module\n');

  // Test business profiles
  const testProfiles: BusinessProfile[] = [
    {
      industry: 'agriculture',
      size: 'small',
      digitalMaturity: 'developing',
      budget: 'medium',
      timeline: 'short-term',
      technicalCapacity: 'limited',
      currentPainPoints: ['crop monitoring', 'yield prediction'],
      businessGoals: ['increase efficiency', 'reduce costs']
    },
    {
      industry: 'clean-energy',
      size: 'medium',
      digitalMaturity: 'advanced',
      budget: 'high',
      timeline: 'long-term',
      technicalCapacity: 'strong',
      currentPainPoints: ['equipment maintenance', 'energy forecasting'],
      businessGoals: ['optimize operations', 'prevent downtime']
    },
    {
      industry: 'medical',
      size: 'small',
      digitalMaturity: 'basic',
      budget: 'low',
      timeline: 'immediate',
      technicalCapacity: 'none',
      currentPainPoints: ['patient scheduling', 'wait times'],
      businessGoals: ['improve patient experience', 'streamline operations']
    }
  ];

  for (let i = 0; i < testProfiles.length; i++) {
    const profile = testProfiles[i];
    console.log(`📊 Test ${i + 1}: ${profile.industry.toUpperCase()} - ${profile.size} business`);
    console.log(`Digital Maturity: ${profile.digitalMaturity}, Budget: ${profile.budget}, Tech Capacity: ${profile.technicalCapacity}\n`);

    try {
      const opportunities = await aiOpportunityAssessment.assess(profile);
      
      if (opportunities.length === 0) {
        console.log('❌ No opportunities found for this profile\n');
        continue;
      }

      console.log(`✅ Found ${opportunities.length} ranked opportunities:\n`);
      
      opportunities.forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.title} (ID: ${opp.id})`);
        console.log(`   📈 Score: ${opp.score?.composite}/5`);
        console.log(`   📊 Breakdown: Readiness(${opp.score?.readiness}) Impact(${opp.score?.impact}) Complexity(${opp.score?.complexity}) Cost(${opp.score?.cost})`);
        console.log(`   💰 Investment: ${opp.requiredInvestment}`);
        console.log(`   ⏱️  Timeline: ${opp.implementationTime}`);
        console.log(`   💡 Rationale: ${opp.rationale}`);
        console.log(`   🛠️  SMEC Services: ${opp.smecServices.join(', ')}\n`);
      });
      
    } catch (error) {
      console.error(`❌ Error assessing profile ${i + 1}:`, error);
    }
    
    console.log('─'.repeat(80) + '\n');
  }

  // Test utility functions
  console.log('🔧 Testing utility functions:\n');
  
  const allOpportunities = aiOpportunityAssessment.getAllOpportunities();
  console.log(`📋 Total opportunities available: ${allOpportunities.length}`);
  
  const agOpportunities = aiOpportunityAssessment.getOpportunitiesByIndustry('agriculture');
  console.log(`🌾 Agriculture opportunities: ${agOpportunities.length}`);
  
  const cropMonitoring = aiOpportunityAssessment.getOpportunityById('ag-crop-monitoring');
  console.log(`🔍 Found opportunity by ID: ${cropMonitoring ? cropMonitoring.title : 'Not found'}`);

  console.log('\n✅ Assessment module test completed successfully!');
}

// Run the test
testAssessment().catch(console.error);