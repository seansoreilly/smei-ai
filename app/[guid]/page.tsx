import { notFound } from 'next/navigation';
import { ChatInterface } from '@/components/ChatInterface';

interface PageProps {
  params: Promise<{ guid: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ChatPage({ params }: PageProps) {
  const { guid } = await params;

  if (!UUID_REGEX.test(guid)) {
    notFound();
  }

  return <ChatInterface guid={guid} />;
}