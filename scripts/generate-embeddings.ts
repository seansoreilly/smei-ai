import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface DocumentChunk {
  chunk_id: string;
  doc_id: string;
  text: string;
  token_count: number;
  industry: string;
  source_url: string;
  title: string;
  chunk_index: number;
}

interface PineconeVector {
  id: string;
  values: number[];
  metadata: {
    industry: string;
    source_url: string;
    doc_id: string;
    title: string;
    text: string;
    token_count: number;
    chunk_index: number;
  };
}

class EmbeddingGenerator {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string = 'smec-ai-knowledge-base';

  constructor() {
    // Initialize Pinecone
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    console.log('🔧 Initialized Pinecone and OpenAI clients');
  }

  async setupPineconeIndex(): Promise<void> {
    try {
      console.log('🔍 Checking if Pinecone index exists...');
      
      // Check if index exists
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        console.log(`📦 Creating Pinecone index: ${this.indexName}`);
        
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // text-embedding-3-small dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });

        // Wait for index to be ready
        console.log('⏳ Waiting for index to be ready...');
        await this.waitForIndexReady();
      } else {
        console.log(`✅ Index ${this.indexName} already exists`);
      }

      // Get index stats
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      console.log(`📊 Index stats:`, stats);

    } catch (error) {
      console.error('❌ Error setting up Pinecone index:', error);
      throw error;
    }
  }

  private async waitForIndexReady(): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const index = this.pinecone.index(this.indexName);
        await index.describeIndexStats();
        console.log('✅ Index is ready!');
        return;
      } catch (error) {
        attempts++;
        console.log(`⏳ Index not ready yet, attempt ${attempts}/${maxAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      }
    }

    throw new Error('Index did not become ready within expected time');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Error generating embedding:', error);
      throw error;
    }
  }

  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      console.log(`🔄 Generating embeddings for ${texts.length} texts...`);
      
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('❌ Error generating batch embeddings:', error);
      throw error;
    }
  }

  async processChunksInBatches(chunks: DocumentChunk[]): Promise<void> {
    const batchSize = 50; // Conservative batch size to avoid rate limits
    const index = this.pinecone.index(this.indexName);

    console.log(`🚀 Processing ${chunks.length} chunks in batches of ${batchSize}...`);

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(chunks.length / batchSize);

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)...`);

      try {
        // Generate embeddings for this batch
        const texts = batch.map(chunk => chunk.text);
        const embeddings = await this.generateEmbeddingsBatch(texts);

        // Prepare vectors for Pinecone
        const vectors: PineconeVector[] = batch.map((chunk, index) => ({
          id: chunk.chunk_id,
          values: embeddings[index],
          metadata: {
            industry: chunk.industry,
            source_url: chunk.source_url,
            doc_id: chunk.doc_id,
            title: chunk.title,
            text: chunk.text,
            token_count: chunk.token_count,
            chunk_index: chunk.chunk_index,
          },
        }));

        // Upsert to Pinecone with namespace by industry
        const industries = [...new Set(batch.map(chunk => chunk.industry))];
        
        for (const industry of industries) {
          const industryVectors = vectors.filter(v => v.metadata.industry === industry);
          
          if (industryVectors.length > 0) {
            // Map "all_industries" to "smec-services" for better organization
            const namespace = industry === 'all_industries' ? 'smec-services' : industry.replace('_', '-');
            
            console.log(`  📤 Upserting ${industryVectors.length} vectors to namespace: ${namespace}`);
            
            await index.namespace(namespace).upsert(industryVectors);
          }
        }

        console.log(`  ✅ Batch ${batchNumber} completed successfully`);

        // Add delay between batches to respect rate limits
        if (i + batchSize < chunks.length) {
          console.log('  ⏱️  Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Error processing batch ${batchNumber}:`, error);
        throw error;
      }
    }

    console.log('🎉 All batches processed successfully!');
  }

  async loadChunks(): Promise<DocumentChunk[]> {
    const chunksPath = path.join(process.cwd(), 'data', 'chunked-documents', 'document-chunks.json');
    
    try {
      const chunksContent = await fs.readFile(chunksPath, 'utf-8');
      const chunks: DocumentChunk[] = JSON.parse(chunksContent);
      
      console.log(`📚 Loaded ${chunks.length} chunks from ${chunksPath}`);
      return chunks;
    } catch (error) {
      console.error('❌ Error loading chunks:', error);
      throw error;
    }
  }

  async validateUpload(): Promise<void> {
    console.log('🔍 Validating upload...');
    
    const index = this.pinecone.index(this.indexName);
    const stats = await index.describeIndexStats();
    
    console.log('📊 Final index statistics:');
    console.log(`  Total vectors: ${stats.totalVectorCount}`);
    console.log(`  Namespaces: ${Object.keys(stats.namespaces || {}).length}`);
    
    // Log namespace breakdown
    if (stats.namespaces) {
      for (const [namespace, namespaceStats] of Object.entries(stats.namespaces)) {
        console.log(`    ${namespace}: ${namespaceStats.vectorCount} vectors`);
      }
    }

    // Test retrieval for each namespace
    const namespaces = Object.keys(stats.namespaces || {});
    for (const namespace of namespaces) {
      try {
        console.log(`🧪 Testing retrieval for namespace: ${namespace}`);
        
        // Generate a test query embedding
        const testQuery = "AI implementation for small business";
        const queryEmbedding = await this.generateEmbedding(testQuery);
        
        // Search in this namespace
        const searchResults = await index.namespace(namespace).query({
          vector: queryEmbedding,
          topK: 3,
          includeMetadata: true,
        });

        console.log(`  ✅ Retrieved ${searchResults.matches.length} results for ${namespace}`);
        
        // Log first result details
        if (searchResults.matches.length > 0) {
          const firstMatch = searchResults.matches[0];
          console.log(`    Top result: ${firstMatch.metadata?.title} (score: ${firstMatch.score?.toFixed(4)})`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing namespace ${namespace}:`, error);
      }
    }
  }

  async generateStatistics(): Promise<void> {
    const chunks = await this.loadChunks();
    const index = this.pinecone.index(this.indexName);
    const stats = await index.describeIndexStats();

    const statistics = {
      processing_summary: {
        total_chunks_processed: chunks.length,
        total_vectors_uploaded: stats.totalRecordCount,
        upload_success_rate: `${((stats.totalRecordCount || 0) / chunks.length * 100).toFixed(1)}%`,
        processing_timestamp: new Date().toISOString(),
      },
      industry_breakdown: {} as Record<string, any>,
      pinecone_stats: stats,
      quality_metrics: {
        all_chunks_uploaded: (stats.totalRecordCount || 0) === chunks.length,
        namespaces_created: Object.keys(stats.namespaces || {}).length,
        expected_namespaces: [...new Set(chunks.map(c => c.industry))].length,
      },
    };

    // Calculate industry breakdown
    const industries = [...new Set(chunks.map(c => c.industry))];
    for (const industry of industries) {
      const industryChunks = chunks.filter(c => c.industry === industry);
      const namespace = industry === 'all_industries' ? 'smec-services' : industry.replace('_', '-');
      const namespaceStats = stats.namespaces?.[namespace];
      
      statistics.industry_breakdown[industry] = {
        chunks_expected: industryChunks.length,
        vectors_uploaded: namespaceStats?.recordCount || 0,
        upload_success: ((namespaceStats?.recordCount || 0) / industryChunks.length * 100).toFixed(1) + '%',
        avg_token_count: Math.round(
          industryChunks.reduce((sum, c) => sum + c.token_count, 0) / industryChunks.length
        ),
      };
    }

    // Save statistics
    const statsPath = path.join(process.cwd(), 'data', 'chunked-documents', 'embedding-statistics.json');
    await fs.writeFile(statsPath, JSON.stringify(statistics, null, 2), 'utf-8');
    
    console.log('📊 Statistics saved to embedding-statistics.json');
    console.log('📈 Upload Summary:');
    console.log(`  • Total chunks: ${chunks.length}`);
    console.log(`  • Total vectors: ${stats.totalRecordCount}`);
    console.log(`  • Success rate: ${statistics.processing_summary.upload_success_rate}`);
    console.log(`  • Namespaces: ${Object.keys(stats.namespaces || {}).length}`);
  }
}

// Main execution function
async function main() {
  console.log('🚀 Starting embedding generation and Pinecone upload...');
  
  const generator = new EmbeddingGenerator();
  
  try {
    // Setup Pinecone index
    await generator.setupPineconeIndex();
    
    // Load document chunks
    const chunks = await generator.loadChunks();
    
    // Process chunks in batches
    await generator.processChunksInBatches(chunks);
    
    // Validate upload
    await generator.validateUpload();
    
    // Generate statistics
    await generator.generateStatistics();
    
    console.log('✅ Embedding generation and upload completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during embedding process:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { EmbeddingGenerator };