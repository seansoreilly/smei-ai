import { neon } from '@neondatabase/serverless';

export const db = neon(process.env.DATABASE_URL!);

export type Conversation = { 
  id: string; 
  guid: string; 
  created_at: string;
  updated_at?: string;
};

export type Message = { 
  id: string; 
  conversation_id: string; 
  role: string; 
  content: string; 
  created_at: string 
};