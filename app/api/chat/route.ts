import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { llmOrchestration } from '@/lib/llm-orchestration';
import { withValidation } from '@/lib/validation/middleware';
import { validateChatMessage } from '@/lib/validation/schemas';
import { sanitizeMessage } from '@/lib/sanitize';

async function handleChatRequest(
  request: NextRequest,
  data: { content: string; guid?: string; message?: string }
) {
  const guid = data.guid;
  const message = sanitizeMessage(data.content || data.message || '');

  if (!guid || !message) {
    return new NextResponse(
      JSON.stringify({ error: 'GUID and message are required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
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

    const conversationMessages = [
      ...previousMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content as string,
      }))
    ];

    if (conversationMessages.length === 0 || conversationMessages[0].role !== 'system') {
      conversationMessages.unshift({ role: 'system', content: '' });
    }

    const { messages: processedMessages, stage, followUpQuestions } = await llmOrchestration.processConversation(
      conversationId,
      conversationMessages
    );

    let stream;
    try {
      stream = await llmOrchestration.createChatCompletion(processedMessages, {
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as unknown as AsyncIterable<any>;
    } catch (error) {
      console.error('Failed to create chat completion:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to initialize chat stream' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let fullResponse = '';
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        const timeout = setTimeout(() => {
          controller.error(new Error('Stream timeout'));
        }, 30000);

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          try {
            await db`
              INSERT INTO messages (id, conversation_id, role, content, created_at)
              VALUES (gen_random_uuid(), ${conversationId}, 'assistant', ${fullResponse}, NOW())
            `;
          } catch (dbError) {
            console.error('Failed to save assistant message:', dbError);
            // Continue execution - don't fail the stream for DB issues
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            content: '', 
            stage, 
            followUpQuestions: followUpQuestions.slice(0, 3)
          })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          clearTimeout(timeout);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error processing chat request:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const POST = withValidation(validateChatMessage, handleChatRequest);