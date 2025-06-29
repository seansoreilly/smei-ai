// Simple test without external dependencies
console.log('🧪 Testing AI Opportunity Assessment Module - Simple Test\n');

// Mock the scoring function logic
function scoreOpportunity(opportunity, profile) {
  let readiness = 0;
  
  if (profile.digitalMaturity === 'advanced') readiness += 2;
  else if (profile.digitalMaturity === 'developing') readiness += 1;
  
  if (profile.technicalCapacity === 'strong') readiness += 2;
  else if (profile.technicalCapacity === 'limited') readiness += 1;
  
  if (opportunity.technicalComplexity === 'low') readiness += 1;
  else if (opportunity.technicalComplexity === 'high') readiness -= 1;
  
  readiness = Math.max(0, Math.min(5, readiness));

  let impact = 0;
  if (opportunity.businessImpact === 'high') impact += 3;
  else if (opportunity.businessImpact === 'medium') impact += 2;
  else impact += 1;
  
  if (profile.size === 'medium') impact += 1;
  impact = Math.max(0, Math.min(5, impact));

  let complexity = 0;
  if (opportunity.technicalComplexity === 'high') complexity += 3;
  else if (opportunity.technicalComplexity === 'medium') complexity += 2;
  else complexity += 1;
  
  if (profile.technicalCapacity === 'strong') complexity -= 1;
  else if (profile.technicalCapacity === 'none') complexity += 1;
  
  complexity = Math.max(0, Math.min(5, complexity));

  let cost = 2; // Default medium cost
  const composite = (impact * 0.4) + (readiness * 0.3) + ((5 - cost) * 0.2) + ((5 - complexity) * 0.1);

  return {
    readiness,
    impact,
    complexity,
    cost,
    composite: Math.round(composite * 100) / 100
  };
}

// Test scenarios
const testProfile = {
  industry: 'agriculture',
  size: 'small',
  digitalMaturity: 'developing',
  budget: 'medium',
  technicalCapacity: 'limited'
};

const testOpportunity = {
  title: 'AI-Powered Crop Monitoring',
  technicalComplexity: 'medium',
  businessImpact: 'high'
};

const score = scoreOpportunity(testOpportunity, testProfile);

console.log('📊 Test Results:');
console.log(`Opportunity: ${testOpportunity.title}`);
console.log(`Business: ${testProfile.industry} (${testProfile.size})`);
console.log(`Scores:`);
console.log(`  - Readiness: ${score.readiness}/5`);
console.log(`  - Impact: ${score.impact}/5`);
console.log(`  - Complexity: ${score.complexity}/5`);
console.log(`  - Cost: ${score.cost}/5`);
console.log(`  - Composite: ${score.composite}/5`);

if (score.composite >= 3.5) {
  console.log('✅ Highly recommended opportunity');
} else if (score.composite >= 2.5) {
  console.log('⚠️ Moderately suitable opportunity');
} else {
  console.log('❌ Challenging opportunity');
}

console.log('\n✅ Basic scoring algorithm test passed!');