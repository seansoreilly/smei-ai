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

   # Database (Optional)
   DATABASE_URL=your_neon_db_connection_string

   # Application
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Initialize the knowledge base** (First time setup)

   ```bash
   # Chunk documents and generate embeddings
   npm run build
   node scripts/chunk-documents.ts
   node scripts/generate-embeddings.ts
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
│   │   └── resources/         # Resource APIs
│   └── [guid]/                 # Dynamic conversation pages
├── components/                  # React components
│   ├── ChatInterface.tsx      # Main chat component
│   ├── InputBox.tsx          # Chat input
│   └── MessageItem.tsx       # Message display
├── data/                       # Data and knowledge base
│   ├── knowledge-base/        # Domain knowledge files
│   ├── chunked-documents/     # Processed document chunks
│   └── evaluation-results/    # Performance metrics
├── lib/                        # Core utilities
│   ├── ai-opportunity-assessment.ts
│   ├── knowledge-base-retrieval.ts
│   ├── llm-orchestration.ts
│   └── service-recommendation.ts
└── scripts/                    # Utility scripts
    ├── chunk-documents.ts     # Document processing
    ├── generate-embeddings.ts # Vector generation
    └── evaluate-retrieval-performance.ts
```

## 🛠 Usage

### Starting a Consultation

1. Navigate to the home page
2. Begin a conversation by describing your business challenge or opportunity
3. The AI will analyze your input and provide:
   - Relevant domain expertise
   - Opportunity assessments
   - Service recommendations
   - Implementation guidance

### Exporting Reports

- Conversations can be exported as PDF reports
- Access via the export API: `/api/export/pdf/[conversation-id]`

### Managing Knowledge Base

Update domain knowledge by modifying files in `data/knowledge-base/`:

- `agriculture/` - Farming and crop management
- `clean-energy/` - Renewable energy solutions
- `medical/` - Healthcare and diagnostic systems
- `enabling-capabilities/` - Cross-domain technologies

After updates, re-run the embedding generation:

```bash
node scripts/generate-embeddings.ts
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing and Evaluation

The platform includes comprehensive testing utilities:

```bash
# Test retrieval performance
node scripts/test-retrieval.ts

# Evaluate system performance
node scripts/evaluate-retrieval-performance.ts

# Test opportunity assessment
node scripts/test-opportunity-assessment.ts
```

### Adding New Domains

1. Create new knowledge files in `data/knowledge-base/[domain]/`
2. Update `data/metadata.json` with domain information
3. Re-run document chunking and embedding generation
4. Update service recommendation logic in `lib/service-recommendation.ts`

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm run start
```

## 📊 Performance Monitoring

The platform includes built-in performance monitoring:

- Retrieval accuracy metrics
- Response time analysis
- Knowledge base coverage reports
- User interaction analytics

Access evaluation results in `data/evaluation-results/`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is proprietary to SMEC and not open source.

## 🆘 Support

For technical support or questions:

- Check the documentation in `/documentation`
- Review evaluation results for system performance
- Contact the development team

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with CRM systems
- [ ] Mobile application
- [ ] Real-time collaboration features
