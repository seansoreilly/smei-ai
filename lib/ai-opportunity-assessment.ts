/* eslint-disable @typescript-eslint/no-explicit-any */
import { llmOrchestration } from './llm-orchestration';

export interface OpportunityScore {
  readiness: number; // 0-5 scale
  impact: number; // 0-5 scale
  complexity: number; // 0-5 scale (lower is better)
  cost: number; // 0-5 scale (lower is better)
  composite: number; // weighted final score
}

export interface BusinessProfile {
  industry: 'agriculture' | 'clean-energy' | 'medical' | 'enabling-capabilities';
  size: 'small' | 'medium'; // small: 1-19, medium: 20-199
  digitalMaturity: 'basic' | 'developing' | 'advanced';
  budget: 'low' | 'medium' | 'high'; // <$10k, $10k-$50k, >$50k
  timeline: 'immediate' | 'short-term' | 'long-term'; // <3mo, 3-12mo, >12mo
  technicalCapacity: 'none' | 'limited' | 'strong';
  currentPainPoints: string[];
  businessGoals: string[];
}

export interface AIOpportunity {
  id: string;
  title: string;
  description: string;
  industry: BusinessProfile['industry'];
  implementationTime: string;
  requiredInvestment: string;
  technicalComplexity: 'low' | 'medium' | 'high';
  businessImpact: 'low' | 'medium' | 'high';
  prerequisites: string[];
  potentialROI: string;
  smecServices: string[];
  score?: OpportunityScore;
  rationale?: string;
}

// Predefined AI opportunities by industry
const AI_OPPORTUNITIES: AIOpportunity[] = [
  // Agriculture
  {
    id: 'ag-crop-monitoring',
    title: 'AI-Powered Crop Monitoring',
    description: 'Use satellite imagery and AI to monitor crop health, predict yields, and optimize irrigation',
    industry: 'agriculture',
    implementationTime: '3-6 months',
    requiredInvestment: '$15,000-$40,000',
    technicalComplexity: 'medium',
    businessImpact: 'high',
    prerequisites: ['Internet connectivity', 'Basic smartphone/tablet usage'],
    potentialROI: '20-35% yield improvement',
    smecServices: ['AI Products & Consultations', 'One-on-One Consultations']
  },
  {
    id: 'ag-precision-farming',
    title: 'Precision Farming with IoT Sensors',
    description: 'Deploy soil sensors and weather stations with AI analytics for optimized farming decisions',
    industry: 'agriculture',
    implementationTime: '2-4 months',
    requiredInvestment: '$8,000-$25,000',
    technicalComplexity: 'low',
    businessImpact: 'medium',
    prerequisites: ['Field access for sensor installation'],
    potentialROI: '15-25% input cost reduction',
    smecServices: ['Short Courses', 'AI Products & Consultations']
  },
  // Clean Energy
  {
    id: 'ce-predictive-maintenance',
    title: 'Predictive Maintenance for Energy Equipment',
    description: 'AI-driven maintenance scheduling to prevent equipment failures and optimize uptime',
    industry: 'clean-energy',
    implementationTime: '4-8 months',
    requiredInvestment: '$20,000-$60,000',
    technicalComplexity: 'high',
    businessImpact: 'high',
    prerequisites: ['Equipment sensors', 'Historical maintenance data'],
    potentialROI: '25-40% maintenance cost reduction',
    smecServices: ['AI Studio Program', 'One-on-One Consultations']
  },
  {
    id: 'ce-energy-forecasting',
    title: 'AI Energy Demand Forecasting',
    description: 'Predict energy consumption patterns to optimize grid operations and reduce costs',
    industry: 'clean-energy',
    implementationTime: '3-6 months',
    requiredInvestment: '$12,000-$35,000',
    technicalComplexity: 'medium',
    businessImpact: 'medium',
    prerequisites: ['Historical energy usage data', 'Smart meter integration'],
    potentialROI: '10-20% energy cost savings',
    smecServices: ['AI Products & Consultations', 'Short Courses']
  },
  // Medical
  {
    id: 'med-diagnostic-assistance',
    title: 'AI Diagnostic Assistance',
    description: 'AI-powered tools to assist with medical image analysis and diagnostic decisions',
    industry: 'medical',
    implementationTime: '6-12 months',
    requiredInvestment: '$30,000-$80,000',
    technicalComplexity: 'high',
    businessImpact: 'high',
    prerequisites: ['Medical imaging equipment', 'Regulatory compliance'],
    potentialROI: '30-50% diagnostic accuracy improvement',
    smecServices: ['AI Studio Program', 'One-on-One Consultations']
  },
  {
    id: 'med-patient-flow',
    title: 'Patient Flow Optimization',
    description: 'AI scheduling and resource allocation to reduce wait times and improve patient experience',
    industry: 'medical',
    implementationTime: '2-4 months',
    requiredInvestment: '$5,000-$15,000',
    technicalComplexity: 'low',
    businessImpact: 'medium',
    prerequisites: ['Patient management system', 'Historical appointment data'],
    potentialROI: '20-30% efficiency improvement',
    smecServices: ['AI Products & Consultations', 'Short Courses']
  },
  // Enabling Capabilities
  {
    id: 'ec-quality-control',
    title: 'AI-Powered Quality Control',
    description: 'Computer vision systems for automated defect detection and quality assurance',
    industry: 'enabling-capabilities',
    implementationTime: '4-8 months',
    requiredInvestment: '$25,000-$70,000',
    technicalComplexity: 'high',
    businessImpact: 'high',
    prerequisites: ['Manufacturing equipment', 'Camera systems'],
    potentialROI: '40-60% defect reduction',
    smecServices: ['AI Studio Program', 'One-on-One Consultations']
  },
  {
    id: 'ec-process-automation',
    title: 'Process Automation with AI',
    description: 'Automate repetitive tasks and workflows using AI-powered tools',
    industry: 'enabling-capabilities',
    implementationTime: '1-3 months',
    requiredInvestment: '$3,000-$12,000',
    technicalComplexity: 'low',
    businessImpact: 'medium',
    prerequisites: ['Digital workflow systems'],
    potentialROI: '25-40% time savings',
    smecServices: ['Short Courses', 'AI Products & Consultations']
  }
];

export class AIOpportunityAssessment {
  private scoreOpportunity(opportunity: AIOpportunity, profile: BusinessProfile): OpportunityScore {
    // Readiness scoring (0-5)
    let readiness = 0;
    
    // Digital maturity impact
    if (profile.digitalMaturity === 'advanced') readiness += 2;
    else if (profile.digitalMaturity === 'developing') readiness += 1;
    
    // Technical capacity impact
    if (profile.technicalCapacity === 'strong') readiness += 2;
    else if (profile.technicalCapacity === 'limited') readiness += 1;
    
    // Complexity penalty
    if (opportunity.technicalComplexity === 'low') readiness += 1;
    else if (opportunity.technicalComplexity === 'high') readiness -= 1;
    
    readiness = Math.max(0, Math.min(5, readiness));

    // Impact scoring (0-5)
    let impact = 0;
    
    // Business impact base score
    if (opportunity.businessImpact === 'high') impact += 3;
    else if (opportunity.businessImpact === 'medium') impact += 2;
    else impact += 1;
    
    // Business size multiplier
    if (profile.size === 'medium') impact += 1;
    
    // Goal alignment bonus
    const relevantGoals = profile.businessGoals.some(goal => 
      opportunity.description.toLowerCase().includes(goal.toLowerCase()) ||
      goal.toLowerCase().includes('efficiency') ||
      goal.toLowerCase().includes('cost') ||
      goal.toLowerCase().includes('quality')
    );
    if (relevantGoals) impact += 1;
    
    impact = Math.max(0, Math.min(5, impact));

    // Complexity scoring (0-5, lower is better)
    let complexity = 0;
    
    if (opportunity.technicalComplexity === 'high') complexity += 3;
    else if (opportunity.technicalComplexity === 'medium') complexity += 2;
    else complexity += 1;
    
    // Adjust for technical capacity
    if (profile.technicalCapacity === 'strong') complexity -= 1;
    else if (profile.technicalCapacity === 'none') complexity += 1;
    
    complexity = Math.max(0, Math.min(5, complexity));

    // Cost scoring (0-5, lower is better)
    let cost = 0;
    
    // Extract cost from investment string
    const investmentLower = opportunity.requiredInvestment.toLowerCase();
    if (investmentLower.includes('80,000') || investmentLower.includes('70,000')) cost += 4;
    else if (investmentLower.includes('60,000') || investmentLower.includes('50,000')) cost += 3;
    else if (investmentLower.includes('40,000') || investmentLower.includes('35,000')) cost += 2;
    else if (investmentLower.includes('25,000') || investmentLower.includes('15,000')) cost += 1;
    
    // Adjust for budget
    if (profile.budget === 'high') cost -= 1;
    else if (profile.budget === 'low') cost += 1;
    
    cost = Math.max(0, Math.min(5, cost));

    // Calculate composite score with weights
    const composite = (impact * 0.4) + (readiness * 0.3) + ((5 - cost) * 0.2) + ((5 - complexity) * 0.1);

    return {
      readiness,
      impact,
      complexity,
      cost,
      composite: Math.round(composite * 100) / 100
    };
  }

  private async generateRationale(
    opportunity: AIOpportunity, 
    profile: BusinessProfile, 
    score: OpportunityScore
  ): Promise<string> {
    const prompt = `Explain why this AI opportunity is ${score.composite >= 3.5 ? 'highly recommended' : score.composite >= 2.5 ? 'moderately suitable' : 'challenging'} for this business:

Business Context:
- Industry: ${profile.industry}
- Size: ${profile.size} (${profile.size === 'small' ? '1-19' : '20-199'} employees)
- Digital Maturity: ${profile.digitalMaturity}
- Budget: ${profile.budget}
- Technical Capacity: ${profile.technicalCapacity}
- Current Pain Points: ${profile.currentPainPoints.join(', ')}

AI Opportunity:
- ${opportunity.title}: ${opportunity.description}
- Investment: ${opportunity.requiredInvestment}
- Complexity: ${opportunity.technicalComplexity}
- Implementation Time: ${opportunity.implementationTime}

Scores:
- Readiness: ${score.readiness}/5
- Impact: ${score.impact}/5
- Complexity: ${score.complexity}/5 (lower is better)
- Cost: ${score.cost}/5 (lower is better)
- Overall: ${score.composite}/5

Provide a concise 2-3 sentence rationale focusing on the key factors.`;

    try {
      const response: any = await llmOrchestration.createChatCompletion([
        { role: 'system', content: 'You are an AI business consultant. Provide clear, actionable insights.' } as any,
        { role: 'user', content: prompt } as any
      ], {
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        max_tokens: 150
      });

      return response.choices[0]?.message?.content || 'Assessment rationale unavailable.';
    } catch (error) {
      console.error('Failed to generate rationale:', error);
      return `Score: ${score.composite}/5. This opportunity shows ${score.impact >= 3 ? 'high' : 'moderate'} potential impact with ${score.readiness >= 3 ? 'good' : 'limited'} readiness for your business context.`;
    }
  }

  async assess(businessProfile: BusinessProfile): Promise<AIOpportunity[]> {
    // Filter opportunities by industry
    const relevantOpportunities = AI_OPPORTUNITIES.filter(
      op => op.industry === businessProfile.industry
    );

    // Score and rank opportunities
    const scoredOpportunities = await Promise.all(
      relevantOpportunities.map(async (opportunity) => {
        const score = this.scoreOpportunity(opportunity, businessProfile);
        const rationale = await this.generateRationale(opportunity, businessProfile, score);
        
        return {
          ...opportunity,
          score,
          rationale
        };
      })
    );

    // Sort by composite score (descending) and return top 5
    return scoredOpportunities
      .sort((a, b) => (b.score?.composite || 0) - (a.score?.composite || 0))
      .slice(0, 5);
  }

  getOpportunityById(id: string): AIOpportunity | undefined {
    return AI_OPPORTUNITIES.find(op => op.id === id);
  }

  getAllOpportunities(): AIOpportunity[] {
    return [...AI_OPPORTUNITIES];
  }

  getOpportunitiesByIndustry(industry: BusinessProfile['industry']): AIOpportunity[] {
    return AI_OPPORTUNITIES.filter(op => op.industry === industry);
  }
}

export const aiOpportunityAssessment = new AIOpportunityAssessment();