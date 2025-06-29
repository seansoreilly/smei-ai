import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const db = neon(process.env.DATABASE_URL);
const guid = "436ec1ac-3529-481b-be4e-5dfed2297651";

async function checkGuid() {
  try {
    console.log("Checking for GUID:", guid);

    // Check conversations
    const conversations = await db`
      SELECT * FROM conversations WHERE guid = ${guid}
    `;
    console.log("Conversations with this GUID:", conversations.length);
    if (conversations.length > 0) {
      console.log("Conversation:", conversations[0]);
    }

    // Check all conversations
    const allConversations = await db`
      SELECT guid, id FROM conversations ORDER BY created_at DESC LIMIT 10
    `;
    console.log("\nRecent conversations:");
    allConversations.forEach((conv) => {
      console.log(`- GUID: ${conv.guid}, ID: ${conv.id}`);
    });

    // Check if GUID exists with different case
    const caseInsensitive = await db`
      SELECT * FROM conversations WHERE LOWER(guid) = LOWER(${guid})
    `;
    console.log("\nCase-insensitive search results:", caseInsensitive.length);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

checkGuid();
