import { openai } from '@ai-sdk/openai';
import { 
    streamText, 
    UIMessage, 
    convertToModelMessages, 
    experimental_createMCPClient as createMCPClient 
} from 'ai';


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const openSeaMCPClient = await createMCPClient({
    transport: {
        type: 'sse',
        url: 'https://mcp.opensea.io/sse',
        headers: {
            'Authorization': `Bearer ${process.env.OPENSEA_BEARER_TOKEN}`,
        }
    }
  });

  const tools = await openSeaMCPClient.tools();

  const result = streamText({
    model: openai('gpt-5-mini'),
    system: 'You are a helpful assistant specialized in answering questions about the NFTs and Crypto Tokens. You can use the tools provided to you to get the information you need. ',
    messages: convertToModelMessages(messages),
    tools,
    toolChoice: 'auto',
    onFinish: async (message) => {
        await openSeaMCPClient.close();
    }
  });

  return result.toUIMessageStreamResponse({
    // Forward reasoning tokens so the UI can indicate reasoning state
    sendReasoning: true,
  });
}