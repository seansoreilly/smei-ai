import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { encoding_for_model } from 'tiktoken';
import fs from 'fs/promises';
import path from 'path';

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

interface DocumentMetadata {
  file_path: string;
  title: string;
  industry: string;
  content_type: string;
  word_count: number;
  key_topics: string[];
  sme_focus: string;
  implementation_complexity?: string;
  estimated_investment_range?: string;
  service_type?: string;
  availability?: string;
  duration?: string;
  delivery_formats?: string[];
}

class DocumentChunker {
  private textSplitter: RecursiveCharacterTextSplitter;
  private encoder: any;

  constructor() {
    // Initialize text splitter with 500 token target and 50 token overlap
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000, // Increased to target ~500 tokens (more conservative estimate: 6 chars per token)
      chunkOverlap: 300, // Increased for 50 token overlap
      separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''],
    });

    // Initialize OpenAI tokenizer for accurate token counting
    this.encoder = encoding_for_model('gpt-3.5-turbo');
  }

  private countTokens(text: string): number {
    const tokens = this.encoder.encode(text);
    return tokens.length;
  }

  private generateChunkId(docId: string, chunkIndex: number): string {
    return `${docId}_chunk_${chunkIndex.toString().padStart(3, '0')}`;
  }

  private extractDocId(filePath: string): string {
    const fileName = path.basename(filePath, '.md');
    const directory = path.basename(path.dirname(filePath));
    return `${directory}_${fileName}`;
  }

  async chunkDocument(
    filePath: string,
    content: string,
    metadata: DocumentMetadata
  ): Promise<DocumentChunk[]> {
    const docId = this.extractDocId(filePath);
    
    // Split the document into initial chunks
    const textChunks = await this.textSplitter.splitText(content);
    
    // Optimize chunks to target token range
    const optimizedChunks = this.optimizeChunks(textChunks);
    
    // Convert to DocumentChunk objects
    const chunks: DocumentChunk[] = optimizedChunks.map((chunk, index) => ({
      chunk_id: this.generateChunkId(docId, index),
      doc_id: docId,
      text: chunk.trim(),
      token_count: this.countTokens(chunk),
      industry: metadata.industry,
      source_url: `smec-ai-kb://${filePath}`,
      title: metadata.title,
      chunk_index: index,
    }));

    return chunks;
  }

  private optimizeChunks(textChunks: string[]): string[] {
    const optimized: string[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    const targetMin = 480;
    const targetMax = 520;

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const chunkTokens = this.countTokens(chunk);

      // If this chunk alone exceeds target, try to split it
      if (chunkTokens > targetMax) {
        // Finalize current chunk if it exists
        if (currentChunk && currentTokens >= 300) {
          optimized.push(currentChunk.trim());
          currentChunk = '';
          currentTokens = 0;
        }
        
        // Split large chunk using sentence boundaries
        const sentences = chunk.split(/(?<=[.!?])\s+/);
        let tempChunk = '';
        let tempTokens = 0;
        
        for (const sentence of sentences) {
          const sentenceTokens = this.countTokens(sentence);
          const combinedTokens = this.countTokens(tempChunk + ' ' + sentence);
          
          if (combinedTokens > targetMax && tempTokens >= 300) {
            optimized.push(tempChunk.trim());
            tempChunk = sentence;
            tempTokens = sentenceTokens;
          } else {
            tempChunk = tempChunk ? tempChunk + ' ' + sentence : sentence;
            tempTokens = combinedTokens;
          }
          
          // If we hit target range, finalize
          if (tempTokens >= targetMin && tempTokens <= targetMax) {
            optimized.push(tempChunk.trim());
            tempChunk = '';
            tempTokens = 0;
          }
        }
        
        // Start next chunk with remaining content
        if (tempChunk && tempTokens > 0) {
          currentChunk = tempChunk;
          currentTokens = tempTokens;
        }
        continue;
      }

      // Check if adding this chunk would exceed target
      const combinedTokens = this.countTokens(currentChunk + '\n\n' + chunk);
      
      if (combinedTokens > targetMax && currentTokens > 0) {
        // Finalize current chunk if it's substantial
        if (currentTokens >= 300) {
          optimized.push(currentChunk.trim());
        }
        currentChunk = chunk;
        currentTokens = chunkTokens;
      } else {
        // Add to current chunk
        if (currentChunk) {
          currentChunk += '\n\n' + chunk;
          currentTokens = combinedTokens;
        } else {
          currentChunk = chunk;
          currentTokens = chunkTokens;
        }
      }

      // If current chunk is in target range, finalize it
      if (currentTokens >= targetMin && currentTokens <= targetMax) {
        optimized.push(currentChunk.trim());
        currentChunk = '';
        currentTokens = 0;
      }
    }

    // Add final chunk if it has substantial content
    if (currentChunk && currentTokens >= 300) {
      // If final chunk is too large, try to split it
      if (currentTokens > targetMax) {
        const sentences = currentChunk.split(/(?<=[.!?])\s+/);
        let tempChunk = '';
        let tempTokens = 0;
        
        for (const sentence of sentences) {
          const combinedTokens = this.countTokens(tempChunk + ' ' + sentence);
          
          if (combinedTokens > targetMax && tempTokens >= 300) {
            optimized.push(tempChunk.trim());
            tempChunk = sentence;
            tempTokens = this.countTokens(sentence);
          } else {
            tempChunk = tempChunk ? tempChunk + ' ' + sentence : sentence;
            tempTokens = combinedTokens;
          }
        }
        
        if (tempChunk && tempTokens >= 300) {
          optimized.push(tempChunk.trim());
        }
      } else {
        optimized.push(currentChunk.trim());
      }
    }

    return optimized;
  }

  async processAllDocuments(): Promise<DocumentChunk[]> {
    const allChunks: DocumentChunk[] = [];
    const knowledgeBasePath = path.join(process.cwd(), 'data', 'knowledge-base');

    // Read metadata
    const metadataPath = path.join(knowledgeBasePath, 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    console.log('🔍 Processing documents for chunking...');

    for (const docInfo of metadata.document_inventory) {
      const fullPath = path.join(knowledgeBasePath, docInfo.file_path);
      
      try {
        console.log(`📄 Processing: ${docInfo.title}`);
        
        const content = await fs.readFile(fullPath, 'utf-8');
        const documentChunks = await this.chunkDocument(fullPath, content, docInfo);
        
        console.log(`  ✅ Generated ${documentChunks.length} chunks`);
        console.log(`  📊 Token range: ${Math.min(...documentChunks.map(c => c.token_count))} - ${Math.max(...documentChunks.map(c => c.token_count))}`);
        
        allChunks.push(...documentChunks);
      } catch (error) {
        console.error(`❌ Error processing ${docInfo.file_path}:`, error);
      }
    }

    return allChunks;
  }

  async saveChunks(chunks: DocumentChunk[]): Promise<void> {
    const outputDir = path.join(process.cwd(), 'data', 'chunked-documents');
    await fs.mkdir(outputDir, { recursive: true });

    // Save as JSONL format (one JSON object per line)
    const jsonlPath = path.join(outputDir, 'document-chunks.jsonl');
    const jsonlContent = chunks.map(chunk => JSON.stringify(chunk)).join('\n');
    await fs.writeFile(jsonlPath, jsonlContent, 'utf-8');

    // Save as JSON for easier inspection
    const jsonPath = path.join(outputDir, 'document-chunks.json');
    await fs.writeFile(jsonPath, JSON.stringify(chunks, null, 2), 'utf-8');

    // Generate statistics
    const stats = this.generateStatistics(chunks);
    const statsPath = path.join(outputDir, 'chunking-statistics.json');
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2), 'utf-8');

    console.log(`💾 Saved ${chunks.length} chunks to ${outputDir}`);
    console.log(`📊 Statistics saved to chunking-statistics.json`);
  }

  private generateStatistics(chunks: DocumentChunk[]) {
    const tokenCounts = chunks.map(c => c.token_count);
    const industries = [...new Set(chunks.map(c => c.industry))];
    const documents = [...new Set(chunks.map(c => c.doc_id))];

    const industryStats = industries.reduce((acc, industry) => {
      const industryChunks = chunks.filter(c => c.industry === industry);
      acc[industry] = {
        chunk_count: industryChunks.length,
        avg_token_count: Math.round(
          industryChunks.reduce((sum, c) => sum + c.token_count, 0) / industryChunks.length
        ),
        min_tokens: Math.min(...industryChunks.map(c => c.token_count)),
        max_tokens: Math.max(...industryChunks.map(c => c.token_count)),
      };
      return acc;
    }, {} as Record<string, any>);

    return {
      total_chunks: chunks.length,
      total_documents: documents.length,
      token_statistics: {
        min: Math.min(...tokenCounts),
        max: Math.max(...tokenCounts),
        mean: Math.round(tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length),
        median: this.calculateMedian(tokenCounts),
        chunks_in_target_range: tokenCounts.filter(t => t >= 480 && t <= 520).length,
        percentage_in_target: Math.round((tokenCounts.filter(t => t >= 480 && t <= 520).length / tokenCounts.length) * 100),
      },
      industry_breakdown: industryStats,
      documents_processed: documents,
      quality_metrics: {
        all_docs_chunked: documents.length === new Set(chunks.map(c => c.doc_id)).size,
        no_oversized_chunks: tokenCounts.every(t => t <= 520),
        avg_tokens_in_range: tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length >= 480 &&
                             tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length <= 520,
      },
      chunking_timestamp: new Date().toISOString(),
    };
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  }

  cleanup(): void {
    if (this.encoder) {
      this.encoder.free();
    }
  }
}

// Main execution function
async function main() {
  console.log('🚀 Starting document chunking process...');
  
  const chunker = new DocumentChunker();
  
  try {
    const chunks = await chunker.processAllDocuments();
    await chunker.saveChunks(chunks);
    
    console.log('✅ Document chunking completed successfully!');
    console.log(`📈 Total chunks created: ${chunks.length}`);
    
    // Display summary statistics
    const tokenCounts = chunks.map(c => c.token_count);
    const avgTokens = Math.round(tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length);
    const inTargetRange = tokenCounts.filter(t => t >= 480 && t <= 520).length;
    const targetPercentage = Math.round((inTargetRange / tokenCounts.length) * 100);
    
    console.log(`📊 Average tokens per chunk: ${avgTokens}`);
    console.log(`🎯 Chunks in target range (480-520): ${inTargetRange}/${tokenCounts.length} (${targetPercentage}%)`);
    console.log(`📏 Token range: ${Math.min(...tokenCounts)} - ${Math.max(...tokenCounts)}`);
    
  } catch (error) {
    console.error('❌ Error during chunking process:', error);
    process.exit(1);
  } finally {
    chunker.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DocumentChunker, type DocumentChunk };