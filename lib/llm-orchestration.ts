import OpenAI from 'openai';
import { ChatCompletionMessage } from 'openai/resources/chat/completions';
import pLimit from 'p-limit';

interface SimpleMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const limit = pLimit(60);

export interface ConversationStage {
  stage: 'discovery' | 'exploration' | 'solution' | 'implementation';
  followUpQuestions: string[];
}

export interface ConversationState {
  stage: ConversationStage['stage'];
  tokenCount: number;
  messageHistory: SimpleMessage[];
}

const SYSTEM_PROMPTS = {
  base: `You are the SMEC AI Advisor, an intelligent assistant for the Small to Medium Enterprise Centre of Artificial Intelligence (SMEC AI). SMEC AI is an Australian Government-backed initiative that helps SMEs (Small: 1-19 employees, Medium: 20-199 employees) adopt both new and existing AI solutions.

Your mission is to guide Australian SMEs through AI discovery, assessment, and implementation across four priority industries:
- Agriculture: Precision farming, crop monitoring, supply chain optimization
- Clean Energy: Grid optimization, predictive maintenance, energy forecasting  
- Medical/Healthcare: Diagnostic assistance, patient flow, research acceleration
- Enabling Capabilities: Process automation, quality control, predictive analytics (advanced manufacturing, technology)

SMEC AI Services you can recommend:
- AI Products & Consultations: For businesses ready to adopt existing solutions
- One-on-One Consultations: Personalized guidance (500+ available)
- Short Courses: AI skill development programs
- AI Studio Program: 8-week intensive program for custom AI solution development

Key Features:
- Free service funded by Australian Government's AI Adopt program
- Industry-specific AI recommendations based on business context
- AI maturity evaluation and readiness assessment
- ROI calculators and implementation timeline guidance
- Connection to vetted AI solution providers and university partners
- Grant and funding opportunity information

Design Principles:
- Simplicity first: No technical jargon unless necessary
- Action-oriented: Every conversation leads to clear next steps
- Trust building: Transparent about AI capabilities and limitations
- Inclusive design: Accessible to users of all technical backgrounds
- Value-focused: Emphasizes practical business outcomes over technology

Always assess business size, industry sector, current technology usage, pain points, and budget constraints to provide personalized AI opportunity recommendations.`,

  discovery: `Current conversation stage: DISCOVERY
Welcome the user to SMEC AI and understand their business context. Ask about:
- Industry sector (agriculture, clean energy, medical, enabling capabilities)
- Business size (1-19 employees = small, 20-199 = medium)
- Current technology usage and digital maturity
- Specific business challenges or goals
- AI knowledge level and previous experience`,

  exploration: `Current conversation stage: EXPLORATION
Based on their business context, explore specific AI opportunities. Discuss:
- Relevant AI use cases for their industry and business size
- Current pain points that AI could address
- Budget considerations and implementation timeline
- Technical readiness and resource requirements
- Potential ROI and business impact`,

  solution: `Current conversation stage: ASSESSMENT & SOLUTION
Provide AI maturity evaluation and specific recommendations:
- Assess readiness for different AI solutions
- Prioritize opportunities by impact and feasibility
- Recommend appropriate SMEC AI services (consultations, courses, AI Studio)
- Provide realistic implementation timelines and resource requirements
- Suggest vetted AI solutions from the product directory`,

  implementation: `Current conversation stage: CONNECTION & NEXT STEPS
Guide toward concrete action and SMEC AI service engagement:
- Recommend specific SMEC AI services and programs
- Provide direct links to book consultations or register for courses
- Assess eligibility for the 8-week AI Studio Program
- Offer conversation summary and recommendations for download
- Connect with relevant university partners or tech providers
- Inform about funding opportunities and grants`
};

const FOLLOW_UP_QUESTIONS = {
  discovery: [
    "Which industry best describes your business: agriculture, clean energy, medical/healthcare, or enabling capabilities?",
    "How many employees does your business have?",
    "What specific business challenges are you hoping AI might help solve?",
    "What's your current level of experience with AI or digital technologies?",
    "Are you looking to improve efficiency, reduce costs, or explore new opportunities?"
  ],
  exploration: [
    "What AI applications have you heard about in your industry that interest you?",
    "What's your estimated budget range for AI implementation?",
    "Do you have internal technical expertise, or would you need external support?",
    "What would be your ideal timeline for implementing an AI solution?",
    "Are there any specific processes or areas of your business you'd like to focus on?"
  ],
  solution: [
    "Which of these AI opportunities seems most relevant to your immediate needs?",
    "Would you be interested in starting with a consultation to dive deeper into these options?",
    "Are you more interested in adopting existing AI solutions or developing something custom?",
    "What level of support would you prefer: self-guided learning, one-on-one guidance, or intensive program?",
    "Would you like me to check your eligibility for the AI Studio Program?"
  ],
  implementation: [
    "Would you like me to help you book a consultation with one of our AI specialists?",
    "Are you interested in our short courses to build internal AI knowledge first?",
    "Should I provide you with a summary of our conversation and recommendations?",
    "Would information about available grants or funding opportunities be helpful?",
    "Are there other SMEs in your network who might benefit from SMEC AI services?"
  ]
};

export class LLMOrchestrationService {
  private conversationStates = new Map<string, ConversationState>();

  private determineStage(messages: SimpleMessage[]): ConversationStage['stage'] {
    const messageCount = messages.filter(m => m.role === 'user').length;
    
    if (messageCount <= 2) return 'discovery';
    if (messageCount <= 4) return 'exploration';
    if (messageCount <= 6) return 'solution';
    return 'implementation';
  }

  private estimateTokenCount(messages: SimpleMessage[]): number {
    const totalContent = messages.map(m => m.content).join(' ');
    return Math.ceil(totalContent.length / 4);
  }

  private async compressMessages(messages: SimpleMessage[]): Promise<ChatCompletionMessage[]> {
    if (messages.length <= 4) {
      return messages as ChatCompletionMessage[];
    }

    const systemMessage = messages.find(m => m.role === 'system');
    const recentMessages = messages.slice(-4);
    const middleMessages = messages.slice(1, -4);

    if (middleMessages.length === 0) return messages as ChatCompletionMessage[];

    const conversationSummary = middleMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    try {
      const summaryResponse = await limit(() => 
        openai.chat.completions.create({
          model: 'gpt-4.1-nano', // Use cheaper model for summarization
          messages: [
            {
              role: 'system',
              content: 'Summarize the following conversation history concisely, preserving key context and decisions:'
            },
            {
              role: 'user',
              content: conversationSummary
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        })
      );

      const summary = summaryResponse.choices[0]?.message?.content || 'Previous conversation context unavailable.';

      const compressedMessages = [
        ...(systemMessage ? [systemMessage] : []),
        {
          role: 'system' as const,
          content: `Previous conversation summary: ${summary}`
        },
        ...recentMessages
      ] as ChatCompletionMessage[];

      return compressedMessages;
    } catch (error) {
      console.error('Failed to compress messages:', error);
      return messages.slice(-6) as ChatCompletionMessage[];
    }
  }

  private buildSystemPrompt(stage: ConversationStage['stage']): string {
    return `${SYSTEM_PROMPTS.base}\n\n${SYSTEM_PROMPTS[stage]}`;
  }

  private getFollowUpQuestions(stage: ConversationStage['stage']): string[] {
    return FOLLOW_UP_QUESTIONS[stage];
  }

  async processConversation(
    conversationId: string, 
    messages: SimpleMessage[]
  ): Promise<{
    messages: ChatCompletionMessage[];
    stage: ConversationStage['stage'];
    followUpQuestions: string[];
  }> {
    let state = this.conversationStates.get(conversationId);
    
    if (!state) {
      state = {
        stage: 'discovery',
        tokenCount: 0,
        messageHistory: []
      };
    }

    const currentStage = this.determineStage(messages);
    const tokenCount = this.estimateTokenCount(messages);

    state.stage = currentStage;
    state.tokenCount = tokenCount;
    state.messageHistory = messages;

    this.conversationStates.set(conversationId, state);

    let processedMessages: ChatCompletionMessage[];

    if (tokenCount > 8000) {
      processedMessages = await this.compressMessages(messages);
    } else {
      processedMessages = messages as ChatCompletionMessage[];
    }

    const systemPrompt = this.buildSystemPrompt(currentStage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (processedMessages[0] as any) = {
      role: 'system',
      content: systemPrompt
    };

    const followUpQuestions = this.getFollowUpQuestions(currentStage);

    return {
      messages: processedMessages,
      stage: currentStage,
      followUpQuestions
    };
  }

  async createChatCompletion(
    messages: ChatCompletionMessage[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    } = {}
  ) {
    return limit(() => 
      openai.chat.completions.create({
        model: options.model || 'gpt-4.1-mini',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        stream: options.stream || false,
        ...options
      })
    );
  }

  getConversationState(conversationId: string): ConversationState | undefined {
    return this.conversationStates.get(conversationId);
  }

  clearConversationState(conversationId: string): void {
    this.conversationStates.delete(conversationId);
  }

  clearAllStates(): void {
    this.conversationStates.clear();
  }
}

export const llmOrchestration = new LLMOrchestrationService();