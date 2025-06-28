'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Calculator, BookOpen } from 'lucide-react';

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

interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  company: string;
  challenge: string;
  solution: string;
  results: string[];
  readTime: string;
  tags: string[];
}

interface ROIInputs {
  currentCosts: number;
  timeToImplement: number;
  expectedSavings: number;
  implementationCost: number;
  discountRate: number;
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'cases' | 'roi'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [products, setProducts] = useState<AIProduct[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  // ROI Calculator state
  const [roiInputs, setROIInputs] = useState<ROIInputs>({
    currentCosts: 50000,
    timeToImplement: 6,
    expectedSavings: 15000,
    implementationCost: 25000,
    discountRate: 0.1
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      // Load products from API
      const productsResponse = await fetch('/api/resources/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData);
      }

      // Load case studies (mock data for now)
      setCaseStudies(mockCaseStudies);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustry === 'all' || 
                           product.industry.includes(selectedIndustry);
    
    const matchesPrice = selectedPriceRange === 'all' || 
                        product.priceRange === selectedPriceRange;

    return matchesSearch && matchesIndustry && matchesPrice;
  });

  const filteredCaseStudies = caseStudies.filter(study => {
    const matchesSearch = study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         study.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         study.challenge.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustry === 'all' || 
                           study.industry === selectedIndustry;

    return matchesSearch && matchesIndustry;
  });

  const calculateROI = () => {
    const { currentCosts, timeToImplement, expectedSavings, implementationCost, discountRate } = roiInputs;
    
    // Calculate net present value over 3 years
    const yearsToCalculate = 3;
    let totalPV = -implementationCost; // Initial investment (negative)
    
    for (let year = 1; year <= yearsToCalculate; year++) {
      const cashFlow = expectedSavings * 12; // Annual savings
      const presentValue = cashFlow / Math.pow(1 + discountRate, year);
      totalPV += presentValue;
    }
    
    const roiPercentage = ((totalPV + implementationCost) / implementationCost) * 100;
    const paybackPeriod = implementationCost / (expectedSavings * 12);
    
    return {
      npv: totalPV,
      roi: roiPercentage,
      paybackPeriod: paybackPeriod,
      totalSavings: expectedSavings * 12 * yearsToCalculate
    };
  };

  const roiResults = calculateROI();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Resources & Tools</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore vetted AI solutions, learn from real case studies, and calculate the ROI of your AI investments
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="inline w-4 h-4 mr-2" />
              AI Products
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'cases'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="inline w-4 h-4 mr-2" />
              Case Studies
            </button>
            <button
              onClick={() => setActiveTab('roi')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'roi'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calculator className="inline w-4 h-4 mr-2" />
              ROI Calculator
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {(activeTab === 'products' || activeTab === 'cases') && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search products, vendors, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Industries</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="clean-energy">Clean Energy</option>
                  <option value="medical">Medical</option>
                  <option value="enabling-capabilities">Enabling Capabilities</option>
                </select>
              </div>
              {activeTab === 'products' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={selectedPriceRange}
                    onChange={(e) => setSelectedPriceRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Prices</option>
                    <option value="free">Free</option>
                    <option value="low">Low (&lt;$1k/month)</option>
                    <option value="medium">Medium ($1k-$5k/month)</option>
                    <option value="high">High (&gt;$5k/month)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Sections */}
        {activeTab === 'products' && (
          <ProductsSection products={filteredProducts} />
        )}

        {activeTab === 'cases' && (
          <CaseStudiesSection caseStudies={filteredCaseStudies} />
        )}

        {activeTab === 'roi' && (
          <ROICalculatorSection 
            inputs={roiInputs}
            setInputs={setROIInputs}
            results={roiResults}
          />
        )}
      </div>
    </div>
  );
}

// Product Directory Component
function ProductsSection({ products }: { products: AIProduct[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              product.priceRange === 'free' ? 'bg-green-100 text-green-800' :
              product.priceRange === 'low' ? 'bg-blue-100 text-blue-800' :
              product.priceRange === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {product.priceRange === 'free' ? 'Free' :
               product.priceRange === 'low' ? '<$1k/mo' :
               product.priceRange === 'medium' ? '$1k-5k/mo' :
               '>$5k/mo'}
            </span>
          </div>
          
          <p className="text-gray-600 mb-4">{product.description}</p>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm"><span className="font-medium">Vendor:</span> {product.vendor}</p>
            <p className="text-sm"><span className="font-medium">Category:</span> {product.category}</p>
            <p className="text-sm"><span className="font-medium">Implementation:</span> {product.implementation}</p>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {product.industry.map((ind) => (
              <span key={ind} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                {ind.replace('-', ' ')}
              </span>
            ))}
          </div>

          {product.website && (
            <a
              href={product.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Learn More
            </a>
          )}
        </div>
      ))}
      
      {products.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

// Case Studies Component
function CaseStudiesSection({ caseStudies }: { caseStudies: CaseStudy[] }) {
  return (
    <div className="space-y-6">
      {caseStudies.map((study) => (
        <div key={study.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{study.title}</h3>
              <p className="text-sm text-gray-600">{study.company} • {study.industry} • {study.readTime}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Challenge</h4>
              <p className="text-gray-600 text-sm">{study.challenge}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Solution</h4>
              <p className="text-gray-600 text-sm">{study.solution}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Results</h4>
              <ul className="space-y-1">
                {study.results.map((result, index) => (
                  <li key={index} className="text-gray-600 text-sm">• {result}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {study.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
      
      {caseStudies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No case studies found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

// ROI Calculator Component
function ROICalculatorSection({ 
  inputs, 
  setInputs, 
  results 
}: { 
  inputs: ROIInputs;
  setInputs: (inputs: ROIInputs) => void;
  results: any;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Investment Calculator</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Annual Operational Costs ($)
            </label>
            <input
              type="number"
              value={inputs.currentCosts}
              onChange={(e) => setInputs({...inputs, currentCosts: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Implementation Cost ($)
            </label>
            <input
              type="number"
              value={inputs.implementationCost}
              onChange={(e) => setInputs({...inputs, implementationCost: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Monthly Savings ($)
            </label>
            <input
              type="number"
              value={inputs.expectedSavings}
              onChange={(e) => setInputs({...inputs, expectedSavings: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time to Implement (months)
            </label>
            <input
              type="number"
              value={inputs.timeToImplement}
              onChange={(e) => setInputs({...inputs, timeToImplement: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={inputs.discountRate * 100}
              onChange={(e) => setInputs({...inputs, discountRate: Number(e.target.value) / 100})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Investment Analysis</h3>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {results.roi > 0 ? '+' : ''}{results.roi.toFixed(1)}%
            </div>
            <p className="text-gray-600">Return on Investment (3 years)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-semibold text-gray-900">
                ${results.npv.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Net Present Value</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-semibold text-gray-900">
                {results.paybackPeriod.toFixed(1)} years
              </div>
              <p className="text-sm text-gray-600">Payback Period</p>
            </div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-semibold text-blue-900">
              ${results.totalSavings.toLocaleString()}
            </div>
            <p className="text-sm text-blue-700">Total Savings (3 years)</p>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p>• Based on 3-year projection with {(inputs.discountRate * 100).toFixed(1)}% discount rate</p>
            <p>• Assumes consistent monthly savings of ${inputs.expectedSavings.toLocaleString()}</p>
            <p>• Does not include maintenance or training costs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data for case studies
const mockCaseStudies: CaseStudy[] = [
  {
    id: 'cs1',
    title: 'Smart Crop Monitoring Increases Yield by 25%',
    industry: 'agriculture',
    company: 'GreenFields Farm',
    challenge: 'Manual crop monitoring was time-intensive and led to delayed detection of plant diseases and pest infestations.',
    solution: 'Implemented AI-powered satellite imagery analysis and IoT sensors to monitor crop health in real-time.',
    results: [
      '25% increase in crop yield',
      '40% reduction in pesticide use',
      '60% faster disease detection',
      '$85,000 annual cost savings'
    ],
    readTime: '3 min read',
    tags: ['crop-monitoring', 'satellite-imagery', 'iot-sensors', 'yield-optimization']
  },
  {
    id: 'cs2',
    title: 'Predictive Maintenance Reduces Energy Equipment Downtime',
    industry: 'clean-energy',
    company: 'SolarTech Solutions',
    challenge: 'Unexpected equipment failures caused significant downtime and revenue loss in solar farm operations.',
    solution: 'Deployed AI-driven predictive maintenance system using sensor data and machine learning algorithms.',
    results: [
      '70% reduction in unplanned downtime',
      '30% decrease in maintenance costs',
      '15% improvement in energy output',
      '$120,000 annual savings'
    ],
    readTime: '4 min read',
    tags: ['predictive-maintenance', 'solar-energy', 'machine-learning', 'downtime-reduction']
  },
  {
    id: 'cs3',
    title: 'AI Scheduling Improves Patient Flow by 35%',
    industry: 'medical',
    company: 'Regional Health Clinic',
    challenge: 'Poor scheduling led to long patient wait times and inefficient resource utilization.',
    solution: 'Implemented AI-powered scheduling system that optimizes appointments based on historical data and patient needs.',
    results: [
      '35% improvement in patient flow',
      '50% reduction in wait times',
      '20% increase in patient satisfaction',
      '25% better resource utilization'
    ],
    readTime: '3 min read',
    tags: ['patient-scheduling', 'healthcare-optimization', 'patient-satisfaction', 'resource-management']
  }
];