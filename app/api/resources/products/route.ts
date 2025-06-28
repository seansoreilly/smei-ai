import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

interface AIProduct {
  id: string;
  name: string;
  description: string;
  vendor: string;
  industry: string[];
  priceRange: 'free' | 'low' | 'medium' | 'high';
  category: string;
  features: string[];
  implementation: string;
  supportLevel: string;
  website?: string;
  tags: string[];
}

export async function GET() {
  try {
    // Load products from YAML file
    const filePath = join(process.cwd(), 'data', 'products.yaml');
    const fileContent = readFileSync(filePath, 'utf8');
    const productsData = yaml.load(fileContent) as { products: AIProduct[] };
    
    return NextResponse.json(productsData.products);
  } catch (error) {
    console.error('Failed to load products:', error);
    
    // Fallback to hardcoded products if YAML file doesn't exist
    const fallbackProducts: AIProduct[] = [
      {
        id: 'cropwise-analytics',
        name: 'CropWise Analytics',
        description: 'AI-powered crop monitoring and yield prediction using satellite imagery and weather data',
        vendor: 'AgriTech Solutions',
        industry: ['agriculture'],
        priceRange: 'medium',
        category: 'Crop Monitoring',
        features: [
          'Satellite imagery analysis',
          'Weather integration',
          'Yield prediction',
          'Disease detection',
          'Mobile app'
        ],
        implementation: '2-4 weeks',
        supportLevel: '24/7 phone and email support',
        website: 'https://example.com/cropwise',
        tags: ['satellite', 'monitoring', 'prediction', 'mobile']
      },
      {
        id: 'energyiq-optimizer',
        name: 'EnergyIQ Optimizer',
        description: 'Smart grid optimization and energy demand forecasting for renewable energy systems',
        vendor: 'GridSmart Technologies',
        industry: ['clean-energy'],
        priceRange: 'high',
        category: 'Grid Optimization',
        features: [
          'Demand forecasting',
          'Load balancing',
          'Cost optimization',
          'Real-time monitoring',
          'API integration'
        ],
        implementation: '6-12 weeks',
        supportLevel: 'Dedicated account manager',
        website: 'https://example.com/energyiq',
        tags: ['grid', 'forecasting', 'optimization', 'api']
      },
      {
        id: 'mediflow-scheduler',
        name: 'MediFlow Scheduler',
        description: 'AI-driven patient scheduling and resource optimization for healthcare facilities',
        vendor: 'HealthTech Innovations',
        industry: ['medical'],
        priceRange: 'low',
        category: 'Patient Management',
        features: [
          'Smart scheduling',
          'Resource optimization',
          'Wait time reduction',
          'Patient notifications',
          'Analytics dashboard'
        ],
        implementation: '3-6 weeks',
        supportLevel: 'Business hours support',
        website: 'https://example.com/mediflow',
        tags: ['scheduling', 'healthcare', 'optimization', 'notifications']
      },
      {
        id: 'qualityai-inspector',
        name: 'QualityAI Inspector',
        description: 'Computer vision-based quality control and defect detection for manufacturing',
        vendor: 'ManufactureTech Pro',
        industry: ['enabling-capabilities'],
        priceRange: 'high',
        category: 'Quality Control',
        features: [
          'Computer vision',
          'Defect detection',
          'Real-time analysis',
          'Statistical reporting',
          'Integration APIs'
        ],
        implementation: '8-16 weeks',
        supportLevel: 'On-site training and support',
        website: 'https://example.com/qualityai',
        tags: ['computer-vision', 'quality', 'manufacturing', 'real-time']
      },
      {
        id: 'farmbot-automation',
        name: 'FarmBot Automation',
        description: 'Automated farming system with AI-powered planting, watering, and harvesting',
        vendor: 'RoboFarm Industries',
        industry: ['agriculture'],
        priceRange: 'medium',
        category: 'Farm Automation',
        features: [
          'Automated planting',
          'Smart irrigation',
          'Weed detection',
          'Harvest timing',
          'Mobile control'
        ],
        implementation: '4-8 weeks',
        supportLevel: 'Email and video support',
        website: 'https://example.com/farmbot',
        tags: ['automation', 'irrigation', 'robotics', 'mobile']
      },
      {
        id: 'predictmaint-pro',
        name: 'PredictMaint Pro',
        description: 'Predictive maintenance platform for industrial equipment using IoT and machine learning',
        vendor: 'Industrial AI Systems',
        industry: ['clean-energy', 'enabling-capabilities'],
        priceRange: 'medium',
        category: 'Predictive Maintenance',
        features: [
          'IoT sensor integration',
          'Failure prediction',
          'Maintenance scheduling',
          'Cost analysis',
          'Mobile alerts'
        ],
        implementation: '6-10 weeks',
        supportLevel: '24/7 technical support',
        website: 'https://example.com/predictmaint',
        tags: ['iot', 'predictive', 'maintenance', 'alerts']
      },
      {
        id: 'diagnostic-assist',
        name: 'DiagnosticAssist AI',
        description: 'AI-powered medical imaging analysis and diagnostic support for radiology',
        vendor: 'MedAI Diagnostics',
        industry: ['medical'],
        priceRange: 'high',
        category: 'Medical Imaging',
        features: [
          'Image analysis',
          'Abnormality detection',
          'Report generation',
          'Integration with PACS',
          'Radiologist review'
        ],
        implementation: '12-20 weeks',
        supportLevel: 'Medical specialist support',
        website: 'https://example.com/diagnosticassist',
        tags: ['imaging', 'diagnostics', 'radiology', 'pacs']
      },
      {
        id: 'automate-workflows',
        name: 'AutomateWorkflows',
        description: 'Business process automation platform using RPA and AI for SMEs',
        vendor: 'ProcessFlow Technologies',
        industry: ['enabling-capabilities'],
        priceRange: 'low',
        category: 'Process Automation',
        features: [
          'Workflow automation',
          'Document processing',
          'Email automation',
          'Data entry',
          'Custom integrations'
        ],
        implementation: '2-6 weeks',
        supportLevel: 'Online training and support',
        website: 'https://example.com/automate',
        tags: ['automation', 'workflows', 'rpa', 'integration']
      },
      {
        id: 'solar-optimizer',
        name: 'SolarOptimizer AI',
        description: 'Solar panel performance optimization and energy production forecasting',
        vendor: 'SunTech Analytics',
        industry: ['clean-energy'],
        priceRange: 'low',
        category: 'Solar Optimization',
        features: [
          'Performance monitoring',
          'Production forecasting',
          'Maintenance alerts',
          'Weather integration',
          'ROI tracking'
        ],
        implementation: '1-3 weeks',
        supportLevel: 'Email and chat support',
        website: 'https://example.com/solaroptimizer',
        tags: ['solar', 'optimization', 'forecasting', 'roi']
      },
      {
        id: 'chatbot-healthcare',
        name: 'HealthCare ChatBot',
        description: 'AI-powered patient communication and triage system for medical practices',
        vendor: 'MedBot Solutions',
        industry: ['medical'],
        priceRange: 'free',
        category: 'Patient Communication',
        features: [
          'Patient triage',
          'Appointment booking',
          'FAQ responses',
          'Symptom checker',
          'Multi-language support'
        ],
        implementation: '1-2 weeks',
        supportLevel: 'Community forum',
        website: 'https://example.com/healthcarebot',
        tags: ['chatbot', 'triage', 'communication', 'multilingual']
      }
    ];
    
    return NextResponse.json(fallbackProducts);
  }
}