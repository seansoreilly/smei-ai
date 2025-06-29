import { db } from "./lib/db.js";

const guid = "436ec1ac-3529-481b-be4e-5dfed2297651";

async function testDirect() {
  try {
    console.log("Testing direct database query for GUID:", guid);

    // Test connection
    const testConnection = await db`SELECT NOW() as test_time`;
    console.log("Database connection test:", testConnection[0]);

    // Get conversation
    const conversationResult = await db`
      SELECT id FROM conversations WHERE guid = ${guid}
    `;
    console.log("Conversation found:", conversationResult);

    if (conversationResult.length > 0) {
      const conversationId = conversationResult[0].id;
      console.log("Conversation ID:", conversationId);

      // Get messages
      const messages = await db`
        SELECT m.id, m.conversation_id, m.role, m.content, m.created_at
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.guid = ${guid}
        ORDER BY m.created_at ASC
      `;

      console.log("Messages found:", messages.length);
      messages.forEach((msg, index) => {
        console.log(`Message ${index + 1}:`, {
          role: msg.role,
          content: msg.content.substring(0, 100) + "...",
        });
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testDirect();
