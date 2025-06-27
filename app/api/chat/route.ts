import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { guid, message } = await request.json();

    if (!guid || !message) {
      return NextResponse.json(
        { error: 'GUID and message are required' },
        { status: 400 }
      );
    }

    const conversationResult = await db`
      SELECT id FROM conversations WHERE guid = ${guid}
    `;

    let conversationId: string;
    if (conversationResult.length === 0) {
      const newConversation = await db`
        INSERT INTO conversations (id, guid, created_at)
        VALUES (gen_random_uuid(), ${guid}, NOW())
        RETURNING id
      `;
      conversationId = newConversation[0].id;
    } else {
      conversationId = conversationResult[0].id;
    }

    await db`
      INSERT INTO messages (id, conversation_id, role, content, created_at)
      VALUES (gen_random_uuid(), ${conversationId}, 'user', ${message}, NOW())
    `;

    const previousMessages = await db`
      SELECT role, content
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `;

    const messages = previousMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content as string,
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Provide concise, helpful responses.',
        },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    await db`
      INSERT INTO messages (id, conversation_id, role, content, created_at)
      VALUES (gen_random_uuid(), ${conversationId}, 'assistant', ${assistantResponse}, NOW())
    `;

    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}