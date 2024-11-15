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

const createSystemPromptOld = (language: string) =>
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


const createSystemPrompt = (language: string) =>
  `
You are Brick Bot, an expert in ${language}. You will be given a message in ${language}.
The message has a mistake, or several mistakes. Your job is to correct the message to what it is supposed to be, with correct grammar, spelling, vocabulary, and sentence structure.
You give the correct version of what they were trying to say, identify mistakes, and then you should explain why their response was wrong.
Mistakes should be unique. You shouldn't repeat the same mistake twice.
If the user says a word in quotes. You should translate that word to ${language}.

Make sure to reply in ${language}!

Reply in JSON with the following type:
type CorrectionResponse = {
  mistakes: string;
  corrected_message: string;
}

and the following format:
{
  "mistakes": "{{a itemized list of mistakes with the message. sometimes just a single mistake.}}",
  "corrected_message": "{{the corrected response, using perfect ${language}}}"
}
`;
// <explanation>{{a detailed explanation to help bridge the gap between what the message was and what the correct way to say that is}}</explanation>


export async function POST(req: Request) {
  console.log("get Corrected Message hit");
  try {
    const { pupilMessage, instructorMessage, language } = await req.json();


        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          response_format: {type: 'json_object'},
          messages: [
            { role: "system", content: createSystemPrompt(language) },
            {
              role: "user",
              content: `Message: ${pupilMessage}`,
            },
          ],
        });

        try{ 
          const JSONresponse = response.choices[0].message.content ?? "";
          console.log("openai response: ", JSONresponse)
          return Response.json(JSON.parse(JSONresponse))
        } catch {

          return new Response("Couldn't parse JSON", { status: 400 });
        }


    // const res = client.messages.stream({
    //   model: "claude-3-opus-20240229",
    //   max_tokens: 2000,
    //   system: createSystemPrompt(language),
    //   messages: [
    //     {
    //       role: "user",
    //       content: `<message>${pupilMessage}</message>`,
    //     },
    //   ],
    // });



  } catch (e) {
    throw e;
  }
}
