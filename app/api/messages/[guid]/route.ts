import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const { guid } = await params;

    const conversationResult = await db`
      SELECT id FROM conversations WHERE guid = ${guid}
    `;

    if (conversationResult.length === 0) {
      await db`
        INSERT INTO conversations (id, guid, created_at)
        VALUES (gen_random_uuid(), ${guid}, NOW())
      `;
    }

    const messages = await db`
      SELECT m.id, m.conversation_id, m.role, m.content, m.created_at
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.guid = ${guid}
      ORDER BY m.created_at ASC
    `;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}