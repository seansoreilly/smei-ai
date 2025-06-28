import { db } from './db';
import { BusinessProfile, AIOpportunity, OpportunityScore } from './ai-opportunity-assessment';

export interface SMECService {
  id: string;
  name: string;
  description: string;
  type: 'consultation' | 'course' | 'program' | 'product';
  category: string;
  duration?: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  targetAudience: string[];
  prerequisites: string[];
  deliveryMode: 'online' | 'in-person' | 'hybrid';
  bookingUrl?: string;
  infoUrl?: string;
  eligibilityCriteria: {
    minImpactScore?: number;
    minReadinessScore?: number;
    maxComplexityScore?: number;
    businessSizes?: ('small' | 'medium')[];
    industries?: ('agriculture' | 'clean-energy' | 'medical' | 'enabling-capabilities')[];
    digitalMaturityLevels?: ('basic' | 'developing' | 'advanced')[];
    technicalCapacityLevels?: ('none' | 'limited' | 'strong')[];
  };
  tags: string[];
}

export interface ServiceRecommendation {
  service: SMECService;
  matchScore: number;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  ctaText: string;
  ctaUrl: string;
}

// SMEC AI Services Configuration
const SMEC_SERVICES: SMECService[] = [
  {
    id: 'ai-studio-program',
    name: 'AI Studio Program',
    description: '8-week intensive program for custom AI solution development with dedicated support',
    type: 'program',
    category: 'Custom Development',
    duration: '8 weeks',
    cost: 'free',
    targetAudience: ['SMEs ready for custom AI development', 'Businesses with clear AI use cases'],
    prerequisites: ['Dedicated team member', 'Clear business objectives', 'Technical readiness'],
    deliveryMode: 'hybrid',
    bookingUrl: 'https://smec.ai/programs/ai-studio/apply',
    infoUrl: 'https://smec.ai/programs/ai-studio',
    eligibilityCriteria: {
      minImpactScore: 4,
      minReadinessScore: 3,
      businessSizes: ['small', 'medium'],
      digitalMaturityLevels: ['developing', 'advanced'],
      technicalCapacityLevels: ['limited', 'strong']
    },
    tags: ['custom-development', 'intensive', 'high-impact', 'mentorship']
  },
  {
    id: 'one-on-one-consultation',
    name: 'One-on-One AI Consultation',
    description: 'Personalized guidance session with AI experts to assess your specific needs',
    type: 'consultation',
    category: 'Assessment & Planning',
    duration: '60-90 minutes',
    cost: 'free',
    targetAudience: ['All SMEs exploring AI', 'Businesses needing strategic guidance'],
    prerequisites: ['Basic business overview prepared'],
    deliveryMode: 'online',
    bookingUrl: 'https://smec.ai/consultations/book',
    infoUrl: 'https://smec.ai/consultations',
    eligibilityCriteria: {
      businessSizes: ['small', 'medium'],
      industries: ['agriculture', 'clean-energy', 'medical', 'enabling-capabilities']
    },
    tags: ['consultation', 'assessment', 'strategic', 'personalized']
  },
  {
    id: 'ai-fundamentals-course',
    name: 'AI Fundamentals for SMEs',
    description: 'Comprehensive course covering AI basics, business applications, and implementation strategies',
    type: 'course',
    category: 'Education & Training',
    duration: '4 weeks',
    cost: 'free',
    targetAudience: ['Business owners', 'Managers', 'Team leaders'],
    prerequisites: ['No technical background required'],
    deliveryMode: 'online',
    bookingUrl: 'https://smec.ai/courses/fundamentals/enroll',
    infoUrl: 'https://smec.ai/courses/fundamentals',
    eligibilityCriteria: {
      businessSizes: ['small', 'medium'],
      digitalMaturityLevels: ['basic', 'developing', 'advanced']
    },
    tags: ['education', 'fundamentals', 'business-focused', 'self-paced']
  },
  {
    id: 'industry-specific-workshop',
    name: 'Industry-Specific AI Workshop',
    description: 'Targeted workshops focusing on AI applications in your specific industry sector',
    type: 'course',
    category: 'Industry Training',
    duration: '1-2 days',
    cost: 'free',
    targetAudience: ['Industry professionals', 'Sector-specific teams'],
    prerequisites: ['Industry experience helpful'],
    deliveryMode: 'hybrid',
    bookingUrl: 'https://smec.ai/workshops/industry/book',
    infoUrl: 'https://smec.ai/workshops/industry',
    eligibilityCriteria: {
      businessSizes: ['small', 'medium'],
      industries: ['agriculture', 'clean-energy', 'medical', 'enabling-capabilities'],
      digitalMaturityLevels: ['developing', 'advanced']
    },
    tags: ['workshop', 'industry-specific', 'practical', 'networking']
  },
  {
    id: 'ai-products-directory',
    name: 'AI Products & Solutions Directory',
    description: 'Curated marketplace of vetted AI solutions ready for SME implementation',
    type: 'product',
    category: 'Solution Discovery',
    cost: 'free',
    targetAudience: ['SMEs ready to implement', 'Businesses seeking immediate solutions'],
    prerequisites: ['Clear budget and timeline'],
    deliveryMode: 'online',
    infoUrl: 'https://smec.ai/products',
    eligibilityCriteria: {
      minReadinessScore: 2,
      businessSizes: ['small', 'medium'],
      digitalMaturityLevels: ['developing', 'advanced']
    },
    tags: ['marketplace', 'ready-solutions', 'vetted', 'implementation']
  },
  {
    id: 'technical-readiness-assessment',
    name: 'Technical Readiness Assessment',
    description: 'Comprehensive evaluation of your technical infrastructure and AI readiness',
    type: 'consultation',
    category: 'Technical Assessment',
    duration: '2-3 hours',
    cost: 'free',
    targetAudience: ['SMEs with technical questions', 'Businesses planning implementation'],
    prerequisites: ['Access to current systems documentation'],
    deliveryMode: 'online',
    bookingUrl: 'https://smec.ai/assessments/technical/book',
    infoUrl: 'https://smec.ai/assessments/technical',
    eligibilityCriteria: {
      businessSizes: ['small', 'medium'],
      technicalCapacityLevels: ['none', 'limited'],
      digitalMaturityLevels: ['basic', 'developing']
    },
    tags: ['assessment', 'technical', 'infrastructure', 'readiness']
  },
  {
    id: 'grant-funding-guidance',
    name: 'Grant & Funding Guidance',
    description: 'Support in identifying and applying for AI implementation grants and funding opportunities',
    type: 'consultation',
    category: 'Financial Support',
    duration: '45 minutes',
    cost: 'free',
    targetAudience: ['SMEs seeking funding', 'Businesses with budget constraints'],
    prerequisites: ['Business plan or project outline'],
    deliveryMode: 'online',
    bookingUrl: 'https://smec.ai/funding/guidance/book',
    infoUrl: 'https://smec.ai/funding/guidance',
    eligibilityCriteria: {
      businessSizes: ['small', 'medium'],
      minImpactScore: 3
    },
    tags: ['funding', 'grants', 'financial', 'support']
  }
];

export class ServiceRecommendationEngine {
  private services: SMECService[] = SMEC_SERVICES;

  private checkEligibility(service: SMECService, profile: BusinessProfile, scores?: OpportunityScore): boolean {
    const criteria = service.eligibilityCriteria;

    // Check business size
    if (criteria.businessSizes && !criteria.businessSizes.includes(profile.size)) {
      return false;
    }

    // Check industry
    if (criteria.industries && !criteria.industries.includes(profile.industry)) {
      return false;
    }

    // Check digital maturity
    if (criteria.digitalMaturityLevels && !criteria.digitalMaturityLevels.includes(profile.digitalMaturity)) {
      return false;
    }

    // Check technical capacity
    if (criteria.technicalCapacityLevels && !criteria.technicalCapacityLevels.includes(profile.technicalCapacity)) {
      return false;
    }

    // Check score-based criteria if scores are provided
    if (scores) {
      if (criteria.minImpactScore && scores.impact < criteria.minImpactScore) {
        return false;
      }
      if (criteria.minReadinessScore && scores.readiness < criteria.minReadinessScore) {
        return false;
      }
      if (criteria.maxComplexityScore && scores.complexity > criteria.maxComplexityScore) {
        return false;
      }
    }

    return true;
  }

  private calculateMatchScore(
    service: SMECService, 
    profile: BusinessProfile, 
    opportunity?: AIOpportunity,
    scores?: OpportunityScore
  ): number {
    let score = 0;

    // Base eligibility score
    if (this.checkEligibility(service, profile, scores)) {
      score += 50;
    } else {
      return 0; // Not eligible
    }

    // Digital maturity alignment
    if (profile.digitalMaturity === 'advanced') score += 15;
    else if (profile.digitalMaturity === 'developing') score += 10;
    else score += 5;

    // Technical capacity alignment
    if (profile.technicalCapacity === 'strong') score += 15;
    else if (profile.technicalCapacity === 'limited') score += 10;
    else score += 5;

    // Service type preference based on readiness and complexity
    if (scores) {
      if (service.type === 'program' && scores.readiness >= 3 && scores.impact >= 4) {
        score += 20; // High-impact, ready businesses get program priority
      }
      if (service.type === 'consultation' && scores.readiness < 3) {
        score += 15; // Low readiness benefits from consultation
      }
      if (service.type === 'course' && profile.digitalMaturity === 'basic') {
        score += 15; // Basic maturity benefits from education
      }
      if (service.type === 'product' && scores.readiness >= 3) {
        score += 10; // Ready businesses can explore products
      }
    }

    // Industry-specific bonus
    if (service.id === 'industry-specific-workshop') {
      score += 10;
    }

    // Budget consideration
    if (profile.budget === 'low' && service.cost === 'free') {
      score += 5;
    }

    return Math.min(100, score);
  }

  private generateRationale(
    service: SMECService, 
    profile: BusinessProfile, 
    matchScore: number,
    opportunity?: AIOpportunity
  ): string {
    const reasons = [];

    if (matchScore >= 80) {
      reasons.push('Highly recommended based on your profile');
    } else if (matchScore >= 60) {
      reasons.push('Good fit for your current needs');
    } else {
      reasons.push('Suitable option to consider');
    }

    if (service.type === 'program' && opportunity) {
      reasons.push('ideal for developing custom AI solutions');
    }
    if (service.type === 'consultation') {
      reasons.push('provides personalized guidance for your situation');
    }
    if (service.type === 'course' && profile.digitalMaturity === 'basic') {
      reasons.push('builds foundational AI knowledge');
    }
    if (service.cost === 'free') {
      reasons.push('fully funded by Australian Government');
    }

    return reasons.join(', ');
  }

  private determinePriority(matchScore: number): 'high' | 'medium' | 'low' {
    if (matchScore >= 80) return 'high';
    if (matchScore >= 60) return 'medium';
    return 'low';
  }

  private generateCTA(service: SMECService): { text: string; url: string } {
    switch (service.type) {
      case 'program':
        return {
          text: 'Apply for AI Studio Program',
          url: service.bookingUrl || service.infoUrl || '#'
        };
      case 'consultation':
        return {
          text: 'Book Your Free Consultation',
          url: service.bookingUrl || service.infoUrl || '#'
        };
      case 'course':
        return {
          text: 'Enroll in Course',
          url: service.bookingUrl || service.infoUrl || '#'
        };
      case 'product':
        return {
          text: 'Explore AI Solutions',
          url: service.infoUrl || '#'
        };
      default:
        return {
          text: 'Learn More',
          url: service.infoUrl || '#'
        };
    }
  }

  async recommend(
    profile: BusinessProfile,
    assessedOpportunities?: AIOpportunity[]
  ): Promise<ServiceRecommendation[]> {
    const recommendations: ServiceRecommendation[] = [];

    // Get the top opportunity for scoring context
    const topOpportunity = assessedOpportunities?.[0];
    const topScores = topOpportunity?.score;

    for (const service of this.services) {
      const matchScore = this.calculateMatchScore(service, profile, topOpportunity, topScores);
      
      if (matchScore > 0) {
        const rationale = this.generateRationale(service, profile, matchScore, topOpportunity);
        const priority = this.determinePriority(matchScore);
        const cta = this.generateCTA(service);

        recommendations.push({
          service,
          matchScore,
          rationale,
          priority,
          ctaText: cta.text,
          ctaUrl: cta.url
        });
      }
    }

    // Sort by match score (descending) and return top 5
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  getServiceById(id: string): SMECService | undefined {
    return this.services.find(service => service.id === id);
  }

  getAllServices(): SMECService[] {
    return [...this.services];
  }

  getServicesByType(type: SMECService['type']): SMECService[] {
    return this.services.filter(service => service.type === type);
  }

  getServicesByCategory(category: string): SMECService[] {
    return this.services.filter(service => service.category === category);
  }

  // Database operations for service metadata
  async syncServicesToDatabase(): Promise<void> {
    try {
      // Create services table if it doesn't exist
      await db`
        CREATE TABLE IF NOT EXISTS smec_services (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          duration TEXT,
          cost TEXT NOT NULL,
          target_audience JSONB NOT NULL,
          prerequisites JSONB NOT NULL,
          delivery_mode TEXT NOT NULL,
          booking_url TEXT,
          info_url TEXT,
          eligibility_criteria JSONB NOT NULL,
          tags JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      // Clear existing data
      await db`DELETE FROM smec_services`;

      // Insert current services
      for (const service of this.services) {
        await db`
          INSERT INTO smec_services (
            id, name, description, type, category, duration, cost,
            target_audience, prerequisites, delivery_mode, booking_url,
            info_url, eligibility_criteria, tags
          ) VALUES (
            ${service.id}, ${service.name}, ${service.description}, 
            ${service.type}, ${service.category}, ${service.duration || null}, 
            ${service.cost}, ${JSON.stringify(service.targetAudience)},
            ${JSON.stringify(service.prerequisites)}, ${service.deliveryMode},
            ${service.bookingUrl || null}, ${service.infoUrl || null},
            ${JSON.stringify(service.eligibilityCriteria)}, ${JSON.stringify(service.tags)}
          )
        `;
      }

      console.log(`Synced ${this.services.length} services to database`);
    } catch (error) {
      console.error('Failed to sync services to database:', error);
      throw error;
    }
  }

  async loadServicesFromDatabase(): Promise<SMECService[]> {
    try {
      const rows = await db`
        SELECT * FROM smec_services ORDER BY name
      `;

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type as SMECService['type'],
        category: row.category,
        duration: row.duration,
        cost: row.cost as SMECService['cost'],
        targetAudience: row.target_audience,
        prerequisites: row.prerequisites,
        deliveryMode: row.delivery_mode as SMECService['deliveryMode'],
        bookingUrl: row.booking_url,
        infoUrl: row.info_url,
        eligibilityCriteria: row.eligibility_criteria,
        tags: row.tags
      }));
    } catch (error) {
      console.error('Failed to load services from database:', error);
      return this.services; // Fallback to static services
    }
  }
}

export const serviceRecommendationEngine = new ServiceRecommendationEngine();