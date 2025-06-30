import { NextRequest, NextResponse } from 'next/server';
import { db, type Conversation, type Message } from '@/lib/db';
import { withParamValidation } from '@/lib/validation/middleware';
import { validateGuid, type ValidationResult } from '@/lib/validation/schemas';

async function handleGetConversation(
  request: NextRequest,
  data: { guid: string }
) {
  const { guid } = data;

  try {
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

async function handlePatchConversation(
  request: NextRequest,
  data: { guid: string }
) {
  const { guid } = data;

  try {
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

function validateGuidParam(data: unknown): ValidationResult<{ guid: string }> {
  if (!data || typeof data !== 'object') {
    return { 
      success: false, 
      error: { issues: [{ path: ['params'], message: 'Invalid parameters' }] } 
    };
  }
  const params = data as Record<string, unknown>;
  const guidValidation = validateGuid(params.guid);
  
  if (!guidValidation.success) {
    return {
      success: false,
      error: guidValidation.error
    };
  }
  
  return {
    success: true,
    data: { guid: guidValidation.data! }
  };
}

export const GET = withParamValidation(validateGuidParam, handleGetConversation);
export const PATCH = withParamValidation(validateGuidParam, handlePatchConversation);