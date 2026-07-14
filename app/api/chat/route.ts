/**
 * This is where the chat API route will live.
 *
 * During the workshop you'll wire this up to the agent in `lib/agent.ts`
 * using `createAgentUIStreamResponse` from the AI SDK. The chat panel in
 * `components/agent-chat.tsx` posts here once you swap its placeholder
 * `useState` for `useChat`.
 *
 * Workshop docs: https://agent-foundations-certification.vercel.app/docs/chat-agent
 */

// import { createAgentUIStreamResponse } from "ai";
// import { shoppingAgent } from "@/lib/agent";
import { chatFlow } from "@/lib/workflows/chat-flow";
import type { UIMessage } from "ai";
import { createUIMessageStreamResponse } from "ai";
import { start } from "workflow/api";
import { getRun } from "workflow/api";


// export const POST = async (req: Request) => {
//   const { messages } = await req.json();
//   return createAgentUIStreamResponse({ agent: shoppingAgent, uiMessages: messages });
// };

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const run = await start(chatFlow, [messages]);
  return createUIMessageStreamResponse({
    stream: run.readable,
    headers: { 
    "x-workflow-run-id": run.runId, 
  }, 
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const startIndexParam = searchParams.get("startIndex");
  const startIndex = startIndexParam ? parseInt(startIndexParam, 10) : undefined;
  const run = getRun(id);
  const readable = run.getReadable({ startIndex });
  const tailIndex = await readable.getTailIndex();
  return createUIMessageStreamResponse({
    stream: readable,
    headers: {
      "x-workflow-stream-tail-index": String(tailIndex),
    },
  });
}