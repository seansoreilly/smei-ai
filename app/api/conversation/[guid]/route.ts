import { NextRequest, NextResponse } from 'next/server';
import { db, type Conversation, type Message } from '@/lib/db';

function isValidGuid(guid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(guid);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const { guid } = await params;

    if (!isValidGuid(guid)) {
      return NextResponse.json(
        { error: 'Invalid GUID format' },
        { status: 400 }
      );
    }

    // Get conversation metadata
    const conversations = await db`
      SELECT id, guid, created_at 
      FROM conversations 
      WHERE guid = ${guid}
    `;

    if (conversations.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversation = conversations[0] as Conversation;

    // Get messages ordered by creation time
    const messages = await db`
      SELECT id, conversation_id, role, content, created_at
      FROM messages 
      WHERE conversation_id = ${conversation.id}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({
      conversation,
      messages: messages as Message[]
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const { guid } = await params;

    if (!isValidGuid(guid)) {
      return NextResponse.json(
        { error: 'Invalid GUID format' },
        { status: 400 }
      );
    }

    // Check if conversation exists
    const conversations = await db`
      SELECT id FROM conversations WHERE guid = ${guid}
    `;

    if (conversations.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update the conversation's updated_at timestamp
    const updated = await db`
      UPDATE conversations 
      SET updated_at = NOW() 
      WHERE guid = ${guid}
      RETURNING id, guid, created_at, updated_at
    `;

    return NextResponse.json({
      conversation: updated[0]
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}