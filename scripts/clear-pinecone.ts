import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function clearPineconeIndex() {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const indexName = 'smec-ai-knowledge-base';
  const index = pinecone.index(indexName);

  try {
    console.log('🧹 Clearing all vectors from index...');
    
    // Delete all vectors from all namespaces
    const namespaces = ['agriculture', 'clean-energy', 'medical', 'enabling-capabilities', 'smec-services'];
    
    for (const namespace of namespaces) {
      try {
        console.log(`  🗑️  Clearing namespace: ${namespace}`);
        await index.namespace(namespace).deleteAll();
      } catch (error) {
        console.log(`    ⚠️  Namespace ${namespace} might not exist, skipping...`);
      }
    }

    console.log('✅ Index cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing index:', error);
  }
}

if (require.main === module) {
  clearPineconeIndex();
}