const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const db = neon(process.env.DATABASE_URL);

async function debugQuery() {
  try {
    const testGuid = '436ec1ac-3529-481b-be4e-5dfed2297651';
    
    console.log('1. Testing basic connection...');
    const connection = await db`SELECT NOW() as current_time`;
    console.log('Connection OK:', connection[0]);
    
    console.log('\n2. Checking conversations table...');
    const conversations = await db`SELECT * FROM conversations WHERE guid = ${testGuid}`;
    console.log('Conversations found:', conversations.length);
    console.log('Conversation data:', conversations);
    
    if (conversations.length > 0) {
      const conversationId = conversations[0].id;
      
      console.log('\n3. Checking messages for conversation ID:', conversationId);
      const messagesDirect = await db`SELECT * FROM messages WHERE conversation_id = ${conversationId}`;
      console.log('Direct messages found:', messagesDirect.length);
      console.log('Messages:', messagesDirect);
      
      console.log('\n4. Testing the exact JOIN query from API...');
      const messagesJoin = await db`
        SELECT m.id, m.conversation_id, m.role, m.content, m.created_at
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.guid = ${testGuid}
        ORDER BY m.created_at ASC
      `;
      console.log('JOIN query messages found:', messagesJoin.length);
      console.log('JOIN query result:', messagesJoin);
    }
    
    console.log('\n5. Checking all conversations...');
    const allConversations = await db`SELECT guid, id FROM conversations LIMIT 5`;
    console.log('Sample conversations:', allConversations);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugQuery();