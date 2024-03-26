import OpenAI from "openai";
import {
  OpenAIStream,
  StreamingTextResponse,
  AnthropicStream,
  AIStream,
  readableFromAsyncIterable,
} from "ai";
import Anthropic from "@anthropic-ai/sdk";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export const runtime = "edge"; // 'nodejs' is the default

const createSystemPrompt = (language: string) =>
  `<instructions>
You are Brick Bot, an expert in ${language}. You will be given a snippet of a conversation between an instructor and a pupil. 
The pupil made a mistake, or several mistakes. Your job is to correct the pupil's response. 
You should identify mistakes, give the correct version of what they were trying to say, and then you should explain why their response was wrong.
If the pupil does not answer a question, this is not a mistake. 
Reply in XML with the following format:
<response>
<mistakes>{{a itemized list of mistakes with the response.}}}</mistakes>
<corrected-response>{{the corrected response, using perfect ${language}}}</corrected-response>
<explanation>{{a detailed explanation to help bridge the gap between what the pupil said and what the correct way to say that is}}</explanation>
</response>

</instructions>
`;


// <example>
// Instructor: "Du machst das gut. Was ist deine Lieblingsfarbe?"
// Pupil: Danke! Mein lieblingsfarbe ist blue
// <response>
// <mistakes></mistakes>
// <explanation></explanation>
// <corrected-response>Meine Lieblingsfarbe ist blau.<corrected-response>
// </response>
// </example>
export async function POST(req: Request) {
  console.log("get Corrected Sentence hit");
  try {
    const { pupilMessage, instructorMessage, language } = await req.json();

    const res = client.messages.stream({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      system: createSystemPrompt(language),
      messages: [
        {
          role: "user",
          content: `Pupil: ${pupilMessage}
          Instructor: ${instructorMessage}
          Output: `,
        },
      ],
    });



    return new StreamingTextResponse(
      AnthropicStream(res)
    );
  } catch (e) {
    throw e;
  }
}
