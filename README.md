# SMEC AI - Intelligent Consultation & Opportunity Assessment Platform

A Next.js-powered AI platform that provides intelligent consultation services and opportunity assessments across multiple domains including agriculture, clean energy, manufacturing, and medical technologies.

## 🌟 Features

- **AI-Powered Chat Interface**: Interactive consultation sessions with domain-specific AI assistance
- **Opportunity Assessment**: Automated analysis and recommendations for business opportunities
- **Multi-Domain Knowledge Base**: Comprehensive coverage across:
  - Agriculture & Precision Farming
  - Clean Energy & Smart Grid Systems
  - Manufacturing Automation
  - Medical & Diagnostic AI Systems
- **Service Recommendations**: Intelligent matching of SMEC services to client needs
- **PDF Export**: Generate detailed consultation reports
- **Vector Search**: Advanced RAG (Retrieval-Augmented Generation) with Pinecone integration
- **Performance Monitoring**: Built-in evaluation and optimization tools

## 🏗️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI/ML**: OpenAI GPT, LangChain, Vector Embeddings
- **Database**: Neon PostgreSQL, Pinecone Vector Database
- **Deployment**: Vercel (recommended)
- **Authentication**: NextAuth.js
- **PDF Generation**: PDFKit
- **Styling**: Tailwind CSS with Typography plugin

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Pinecone account (for vector database)
- OpenAI API key
- Neon PostgreSQL database (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd smec-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   # AI Services
   OPENAI_API_KEY=your_openai_api_key_here

   # Vector Database
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=your_index_name

   # Database (Optional - for conversation persistence)
   DATABASE_URL=your_neon_db_connection_string

   # Application Security
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000

   # Optional: Custom API endpoints
   CUSTOM_AI_ENDPOINT=your_custom_endpoint
   ```

4. **Initialize the knowledge base** (First time setup)

   ```bash
   # Build the application first
   npm run build

   # Process documents and generate embeddings
   npx ts-node scripts/chunk-documents.ts
   npx ts-node scripts/generate-embeddings.ts
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to access the platform.

## 📚 Project Structure

```
smec-ai/
├── app/                          # Next.js app router
│   ├── api/                     # API routes
│   │   ├── chat/               # Chat API endpoints
│   │   ├── conversation/       # Conversation management
│   │   ├── export/            # PDF export functionality
│   │   ├── messages/          # Message management
│   │   └── resources/         # Resource APIs
│   ├── [guid]/                 # Dynamic conversation pages
│   ├── resources/             # Resources page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/                  # React components
│   ├── Avatar.tsx            # User avatar component
│   ├── ChatInterface.tsx     # Main chat component
│   ├── InputBox.tsx         # Chat input component
│   └── MessageItem.tsx      # Message display component
├── data/                       # Data and knowledge base
│   ├── knowledge-base/        # Domain knowledge files
│   │   ├── agriculture/      # Farming and crop management
│   │   ├── clean-energy/     # Renewable energy solutions
│   │   ├── medical/         # Healthcare and diagnostic systems
│   │   └── enabling-capabilities/ # Cross-domain technologies
│   ├── chunked-documents/     # Processed document chunks
│   ├── evaluation-results/    # Performance metrics
│   └── products.yaml         # Product configuration
├── lib/                        # Core utilities and services
│   ├── ai-opportunity-assessment.ts
│   ├── knowledge-base-retrieval.ts
│   ├── optimized-knowledge-base-retrieval.ts
│   ├── llm-orchestration.ts
│   ├── service-recommendation.ts
│   ├── db.ts                 # Database utilities
│   └── init-db.ts           # Database initialization
├── scripts/                    # Utility scripts
│   ├── chunk-documents.ts     # Document processing
│   ├── generate-embeddings.ts # Vector generation
│   ├── evaluate-retrieval-performance.ts
│   ├── optimize-retrieval.ts
│   └── test-*.ts/js          # Various test scripts
├── public/                     # Static assets
│   ├── logo-h-b.png         # SMEC logo
│   └── *.svg                # Icon files
└── Configuration files
    ├── next.config.ts        # Next.js configuration
    ├── tailwind.config.js    # Tailwind CSS configuration
    ├── tsconfig.json        # TypeScript configuration
    └── eslint.config.mjs    # ESLint configuration
```

## 🛠 Usage

### Starting a Consultation

1. Navigate to the home page at `http://localhost:3000`
2. Begin a conversation by describing your business challenge or opportunity
3. The AI will analyze your input and provide:
   - Relevant domain expertise
   - Opportunity assessments
   - Service recommendations
   - Implementation guidance

### Conversation Management

- Each conversation gets a unique GUID-based URL
- Conversations are persistent and can be resumed
- Messages are stored and retrieved dynamically

### Exporting Reports

- Conversations can be exported as PDF reports
- Access via the export API: `/api/export/pdf/[conversation-id]`
- Reports include full conversation history and recommendations

### Managing Knowledge Base

Update domain knowledge by modifying files in `data/knowledge-base/`:

- `agriculture/` - Farming and crop management
- `clean-energy/` - Renewable energy solutions
- `medical/` - Healthcare and diagnostic systems
- `enabling-capabilities/` - Cross-domain technologies

After updates, re-run the embedding generation:

```bash
npx ts-node scripts/generate-embeddings.ts
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Development Utilities

```bash
# Test retrieval performance
npx ts-node scripts/test-retrieval.ts

# Test optimized retrieval
npx ts-node scripts/test-optimized-retrieval.ts

# Evaluate system performance
npx ts-node scripts/evaluate-retrieval-performance.ts

# Test opportunity assessment
npx ts-node scripts/test-opportunity-assessment.ts

# Test service recommendations
node scripts/test-service-recommendation.js

# Simple API test
node test-api.js

# Direct API test
node test-direct-api.js
```

### API Endpoints

#### Chat API

- `POST /api/chat` - Process chat messages and return AI responses
- `GET /api/conversation/[guid]` - Retrieve conversation by ID
- `GET /api/messages/[guid]` - Get messages for a conversation

#### Export API

- `GET /api/export/pdf/[guid]` - Export conversation as PDF

#### Resources API

- `GET /api/resources/products` - Get available products and services

### Adding New Domains

1. Create new knowledge files in `data/knowledge-base/[domain]/`
2. Update `data/metadata.json` with domain information
3. Re-run document chunking and embedding generation:
   ```bash
   npx ts-node scripts/chunk-documents.ts
   npx ts-node scripts/generate-embeddings.ts
   ```
4. Update service recommendation logic in `lib/service-recommendation.ts`

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**

   - Connect your GitHub repository to Vercel
   - Import the project in Vercel dashboard

2. **Configure Environment Variables**
   Set the following in your Vercel project settings:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=your_index_name
   DATABASE_URL=your_neon_db_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

3. **Deploy**
   - Deploy automatically on push to main branch
   - Manual deployment via Vercel CLI: `vercel --prod`

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance Monitoring

The platform includes built-in performance monitoring:

- **Retrieval Accuracy**: Vector search precision and recall metrics
- **Response Time Analysis**: API endpoint performance tracking
- **Knowledge Base Coverage**: Domain coverage and gap analysis
- **User Interaction Analytics**: Conversation flow and engagement metrics

Access evaluation results in `data/evaluation-results/`:

- `benchmark-summary.json` - Overall performance metrics
- `evaluation-results.csv` - Detailed test results
- `final-performance-report.md` - Comprehensive analysis

### Running Performance Tests

```bash
# Complete evaluation suite
npx ts-node scripts/evaluate-retrieval-performance.ts

# Optimize retrieval parameters
npx ts-node scripts/optimize-retrieval.ts

# Clear Pinecone index (use with caution)
npx ts-node scripts/clear-pinecone.ts
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

```bash
# Ensure .env.local exists and contains required variables
cp .env.example .env.local
# Edit .env.local with your actual values
```

#### 2. Pinecone Index Not Found

```bash
# Verify your Pinecone configuration
# Check index name matches PINECONE_INDEX_NAME
# Ensure index dimensions match embedding model (1536 for OpenAI)
```

#### 3. Embeddings Generation Fails

```bash
# Check OpenAI API key is valid
# Ensure sufficient API credits
# Verify document chunks are properly formatted
```

#### 4. Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

#### 5. Database Connection Issues

```bash
# Test database connection
node -e "console.log(process.env.DATABASE_URL)"
# Verify Neon database is accessible
```

### Development Tips

- Use `npm run lint` to catch common issues
- Check browser console for client-side errors
- Monitor API response times in Network tab
- Use TypeScript strict mode for better error catching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and add tests
4. Run linting and tests: `npm run lint`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

### Code Standards

- Use TypeScript for all new code
- Follow the existing code style
- Add JSDoc comments for public functions
- Include unit tests for new functionality
- Update documentation for API changes

## 📄 License

This project is proprietary to SMEC and not open source. All rights reserved.

## 🆘 Support

For technical support or questions:

- Check the troubleshooting section above
- Review the documentation in `/documentation`
- Check evaluation results for system performance insights
- Contact the development team for enterprise support

## 🔮 Roadmap

### Near Term (Q1 2024)

- [ ] Enhanced conversation persistence
- [ ] Improved PDF export formatting
- [ ] Real-time typing indicators
- [ ] Advanced search and filtering

### Medium Term (Q2-Q3 2024)

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with CRM systems
- [ ] Mobile-responsive improvements

### Long Term (Q4 2024+)

- [ ] Mobile application
- [ ] Real-time collaboration features
- [ ] Advanced AI model fine-tuning
- [ ] Enterprise SSO integration

---

**Built with ❤️ by the SMEC AI Team**
