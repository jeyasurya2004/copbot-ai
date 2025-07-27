const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error('VITE_GROQ_API_KEY is not defined in your environment. Please add it to your .env file.');
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT = 60000; // 60 seconds

interface ConversationEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserConversation {
  [sessionId: string]: ConversationEntry[];
}

class GroqService {
  private userConversations: { [userId: string]: UserConversation } = {};
  private contextPrompt = `You are CopBot, an AI specialized in police records, judicial references, and law enforcement procedures (Tamil Nadu / Thoothukudi focus).

Answer queries thoroughly, referencing local knowledge. Be concise, helpful, and professional. Always maintain a respectful and authoritative tone suitable for citizen-police interactions.`;

  private getConversationHistory(userId: string, sessionId: string): ConversationEntry[] {
    if (!this.userConversations[userId]) {
      this.userConversations[userId] = {};
    }
    if (!this.userConversations[userId][sessionId]) {
      this.userConversations[userId][sessionId] = [
        { role: 'system', content: this.contextPrompt }
      ];
    }
    return this.userConversations[userId][sessionId];
  }

  async sendMessage(
    message: string, 
    userId: string, 
    sessionId: string,
    // @ts-ignore
    onChunk?: (chunk: string) => void // Kept for potential future streaming implementation
  ): Promise<string> {
    try {
      console.log('=== GROQ API DEBUG START ===');
      console.log('Sending message to Groq API:', message, 'for user:', userId, 'session:', sessionId);
      
      const conversationHistory = this.getConversationHistory(userId, sessionId);
      const messagesToSend = [...conversationHistory, { role: 'user', content: message }];

      const requestBody = {
        model: 'llama3-8b-8192',
        messages: messagesToSend,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.8,
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Groq API error: ${response.status} - ${errorText}`);
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const fullResponse = data.choices?.[0]?.message?.content;

      if (!fullResponse) {
        throw new Error('The AI model did not provide a valid response.');
      }

      this.userConversations[userId][sessionId].push({ role: 'user', content: message });
      this.userConversations[userId][sessionId].push({ role: 'assistant', content: fullResponse });

      console.log('AI response received:', fullResponse);
      console.log('=== GROQ API DEBUG END ===');
      return fullResponse;

    } catch (error) {
      console.error('Groq API call failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. The server is taking too long to respond.');
      }
      throw error;
    }
  }

  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const titlePrompt = `Generate a very short, descriptive title (2-3 words) for a chat that starts with this message: "${firstMessage}". Do not add any introductory text, just return the title.`;
      
      const requestBody = {
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: this.contextPrompt },
          { role: 'user', content: titlePrompt }
        ],
        temperature: 0.7,
        max_tokens: 50,
      };

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Title generation API error: ${response.status} - ${errorText}`);
        return 'New Chat'; // Fallback
      }

      const data = await response.json();
      const title = data.choices?.[0]?.message?.content?.trim().replace(/['"]/g, '');

      return title && title.length > 0 ? title.substring(0, 50) : 'New Chat';
    } catch (error) {
      console.error('Error in generateChatTitle:', error);
      return 'New Chat'; // Fallback title
    }
  }

  clearHistory(userId: string, sessionId: string) {
    if (this.userConversations[userId] && this.userConversations[userId][sessionId]) {
      this.userConversations[userId][sessionId] = [
        { role: 'system', content: this.contextPrompt }
      ];
    }
  }

  clearAllUserData(userId: string) {
    delete this.userConversations[userId];
  }
}

export const groqService = new GroqService();
