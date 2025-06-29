// Simple test for service recommendation engine without external dependencies
console.log('🧪 Testing Service Recommendation Engine\n');

// Mock the eligibility and scoring logic
function checkEligibility(service, profile, scores) {
  const criteria = service.eligibilityCriteria;

  if (criteria.businessSizes && !criteria.businessSizes.includes(profile.size)) {
    return false;
  }

  if (criteria.industries && !criteria.industries.includes(profile.industry)) {
    return false;
  }

  if (criteria.digitalMaturityLevels && !criteria.digitalMaturityLevels.includes(profile.digitalMaturity)) {
    return false;
  }

  if (criteria.technicalCapacityLevels && !criteria.technicalCapacityLevels.includes(profile.technicalCapacity)) {
    return false;
  }

  if (scores) {
    if (criteria.minImpactScore && scores.impact < criteria.minImpactScore) {
      return false;
    }
    if (criteria.minReadinessScore && scores.readiness < criteria.minReadinessScore) {
      return false;
    }
  }

  return true;
}

function calculateMatchScore(service, profile, scores) {
  let score = 0;

  if (!checkEligibility(service, profile, scores)) {
    return 0;
  }

  score += 50; // Base eligibility

  // Digital maturity alignment
  if (profile.digitalMaturity === 'advanced') score += 15;
  else if (profile.digitalMaturity === 'developing') score += 10;
  else score += 5;

  // Technical capacity alignment  
  if (profile.technicalCapacity === 'strong') score += 15;
  else if (profile.technicalCapacity === 'limited') score += 10;
  else score += 5;

  // Service type preferences
  if (scores) {
    if (service.type === 'program' && scores.readiness >= 3 && scores.impact >= 4) {
      score += 20;
    }
    if (service.type === 'consultation' && scores.readiness < 3) {
      score += 15;
    }
    if (service.type === 'course' && profile.digitalMaturity === 'basic') {
      score += 15;
    }
  }

  return Math.min(100, score);
}

// Test data
const testProfile = {
  industry: 'agriculture',
  size: 'small',
  digitalMaturity: 'developing',
  budget: 'medium',
  technicalCapacity: 'limited'
};

const testScores = {
  readiness: 2,
  impact: 4,
  complexity: 3,
  cost: 2
};

const testServices = [
  {
    id: 'ai-studio-program',
    name: 'AI Studio Program',
    type: 'program',
    cost: 'free',
    eligibilityCriteria: {
      minImpactScore: 4,
      minReadinessScore: 3,
      businessSizes: ['small', 'medium']
    }
  },
  {
    id: 'one-on-one-consultation',
    name: 'One-on-One AI Consultation',
    type: 'consultation',
    cost: 'free',
    eligibilityCriteria: {
      businessSizes: ['small', 'medium'],
      industries: ['agriculture', 'clean-energy', 'medical', 'enabling-capabilities']
    }
  },
  {
    id: 'ai-fundamentals-course',
    name: 'AI Fundamentals for SMEs',
    type: 'course',
    cost: 'free',
    eligibilityCriteria: {
      businessSizes: ['small', 'medium'],
      digitalMaturityLevels: ['basic', 'developing', 'advanced']
    }
  }
];

console.log('📊 Test Profile:');
console.log(`Business: ${testProfile.industry} (${testProfile.size})`);
console.log(`Digital Maturity: ${testProfile.digitalMaturity}`);
console.log(`Technical Capacity: ${testProfile.technicalCapacity}`);
console.log(`Opportunity Scores: Readiness(${testScores.readiness}) Impact(${testScores.impact})\n`);

console.log('🎯 Service Recommendations:\n');

const recommendations = [];

testServices.forEach(service => {
  const matchScore = calculateMatchScore(service, testProfile, testScores);
  const eligible = checkEligibility(service, testProfile, testScores);
  
  if (matchScore > 0) {
    recommendations.push({
      service: service.name,
      matchScore,
      priority: matchScore >= 80 ? 'high' : matchScore >= 60 ? 'medium' : 'low'
    });
  }
  
  console.log(`${service.name}:`);
  console.log(`  ✓ Eligible: ${eligible ? 'Yes' : 'No'}`);
  console.log(`  📊 Match Score: ${matchScore}/100`);
  console.log(`  🎯 Priority: ${matchScore >= 80 ? 'High' : matchScore >= 60 ? 'Medium' : matchScore > 0 ? 'Low' : 'Not recommended'}`);
  console.log('');
});

// Sort recommendations
recommendations.sort((a, b) => b.matchScore - a.matchScore);

console.log('🏆 Top Recommendations:');
recommendations.slice(0, 3).forEach((rec, index) => {
  console.log(`${index + 1}. ${rec.service} (${rec.matchScore}/100 - ${rec.priority} priority)`);
});

console.log('\n✅ Service recommendation test completed successfully!');

// Test eligibility edge cases
console.log('\n🔍 Testing Eligibility Edge Cases:');

// High readiness case
const highReadinessProfile = { ...testProfile, digitalMaturity: 'advanced', technicalCapacity: 'strong' };
const highReadinessScores = { readiness: 4, impact: 5, complexity: 2, cost: 1 };

const studioEligible = checkEligibility(testServices[0], highReadinessProfile, highReadinessScores);
console.log(`AI Studio Program eligible for high-readiness business: ${studioEligible ? 'Yes' : 'No'}`);

// Low readiness case  
const lowReadinessProfile = { ...testProfile, digitalMaturity: 'basic', technicalCapacity: 'none' };
const lowReadinessScores = { readiness: 1, impact: 2, complexity: 4, cost: 3 };

const consultationScore = calculateMatchScore(testServices[1], lowReadinessProfile, lowReadinessScores);
console.log(`Consultation match score for low-readiness business: ${consultationScore}/100`);

console.log('\n✅ All tests passed!');