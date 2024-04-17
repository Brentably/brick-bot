import OpenAI from "openai";
import {
  OpenAIStream,
  StreamingTextResponse,
  AnthropicStream,
  AIStream,
  readableFromAsyncIterable,
} from "ai";
import Anthropic from "@anthropic-ai/sdk";
import { createChatSystemPrompt } from "../../../lib/prompts";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import chalk from "chalk";
import fs from "fs";
import xml2js from 'xml2js'
import { MessageData, TokenData } from "../../../lib/types";

const parser = new xml2js.Parser();
if (!process.env.OPENAI_API_KEY) throw new Error("no openai api key");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});


// export const runtime = "edge"; // 'nodejs' is the default

const HARDCODED_WORD_LIST = (JSON.parse(fs.readFileSync(process.cwd() + '/app/wordDataArr.json', 'utf8')) as any[]).map(wordData => wordData.word).slice(0, 2000)

console.log('hwd: ', HARDCODED_WORD_LIST)


const createSystemPrompt = (language: string = `German`, topic: string,  wordList: string[], focusList: string[]) => `
    <instructions>
    You are Brick Bot, an expert ${language} speaker, eager to chat with the learner about ${topic}. Keep the conversation interesting! Engage with the user and ask them questions so they want to keep talking! 

    Only use words based on the following word list: 
    <list>
    ${wordList.join(`\n`)}
    </list>

    Please try to use words from the following list as much as possible, while still engaging the user and conforming to the allowed word list!
    <list>
    ${focusList.join("\n")}
    </list>

    It can be different versions of each of these words, including different case, plurality, gender, or conjugation.
    For instance, "das" or "dem" would count as a version of "der". 
    If "Sie" is on the list, you could use "Ihnen".
    If "sein" is on the list, you could use "bin" or "ist".
    If "Berg" is on the list, you could use "Bergen".
    If "Haus" is on the list, you could use "Hause".
    If "verstecken" is on the list, you could use "Verstecke".
    If "essen" is on the list, you could use "aß".
    If "unterer" is on the list, you could use "untere".
    If "nächster" is on the list, you could use "nächste".
    If "dieser" is on the list, you could use "dies".
    

    But *ONLY* use words and versions of words from this list. DO NOT use any other words. Let me reiterate, do NOT, use any other words.

    Before you reply, consider the word list and how you might structure your reply given your limited vocabulary. Write out this thinking within <thinking> tags.
    Always reply in this XML format:
    \`\`\`
    <thinking></thinking>
    <answer></answer>
    \`\`\`
    </instructions>

    <example>
    Give me a one sentence title for a musical about fish.
    <thinking>
    Hmm. "Fisch" steht nicht auf der Liste, also kann ich das nicht verwenden. Welche anderen Wörter könnten für ein Musical über Fische nützlich sein? Steht "Musik" auf der Liste? Ja! Was ist mit "Wasser"? Ja, das steht auch auf der Liste. "Schwimmen" steht nicht auf der Liste, aber "Bewegen" schon. "Tier" steht auf der Liste, könnte also nützlich sein, weil ich "Fisch" nicht verwenden kann.
    </thinking>
    <answer>
    Musikalische Wassertiere
    </answer>
    </example>`;

export async function POST(req: Request) {
  async function _main(
    messages: MessageParam[],
    systemPrompt: string,
    depth = 1
  ): Promise<[string, string, string[]]> {
    const startTime = performance.now();
    const res = client.messages.stream({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    });

    res.on("text", (text) => process.stdout.write(text));
    res.on("end", () => {
      const endTime = performance.now();
      console.log(chalk.bgRed(`\nLatency for LLM call: ${Math.round(endTime - startTime)}ms`));});
    const final = await res.finalMessage();
    const text = final.content[0].text;

    const xmlJson = await parser.parseStringPromise("<result>" + text + "</result>");
    const isValid = Boolean(xmlJson.result.answer);
    // try again if didn't follow XML structure
    if (!isValid) return await _main(messages, systemPrompt, depth + 1);
    messages.push({ role: "assistant", content: text });

    const aStartTime = performance.now();
    const [misusedWords, focusWordsUsed] = await getAnalysis(xmlJson.result.answer[0]);
    console.log(chalk.bgRed(`\nLatency for analysis: ${Math.round(performance.now() - aStartTime)}ms`));

    const hasMisusedWords = misusedWords.length > 0;
    console.log({ hasMisusedWords, misusedWords });

    if (!hasMisusedWords) {
      console.log("\x1b[33m%s\x1b[0m", `${depth} attempts to finish`);
      return [text, xmlJson.result.answer[0], focusWordsUsed];
    } else {
      messages.push({
        role: "user",
        content: `<instructions>Unfortunately, you used: ${misusedWords.join(
          ", "
        )}. Let me reiterate, do *ONLY* use words provided on the list. DO NOT mess up again.</instructions>`,
      });
      return await _main(messages, systemPrompt, depth + 1);
    }
  }

  const getAnalysis = async (
    assistantResponse: string = ""
  ): Promise<[string[], string[]]> => {
    const tokenDataArr = await tokenizer(assistantResponse);
    // console.log('tokenDataArr')
    // console.log(tokenDataArr)
    const misused: string[] = [];
    for (let tokenData of tokenDataArr) {
      if (!tokenData.id) continue; // skip over punctuation and spaced
      // if anyof the rootwords returned are in the wordList AND it's not a word that the user has used
      if (
        !tokenData.root_words.some((word) => HARDCODED_WORD_LIST.includes(word)) &&
        !allUsedUserWords.includes(tokenData.token)
      ) {
        misused.push(tokenData.token);
      }
    }


    const focusWordsUsed = misused.length !== 0 ? [] : Array.from(new Set(tokenDataArr.flatMap(tokenData => tokenData.root_words.filter(rootWord => focusList.includes(rootWord)))))

    return [misused, focusWordsUsed];
  };
  const { messages, messagesData, language, topic, focusList } = await req.json();
  console.log(`messagesData`)
  console.log(messagesData)
  const allUsedUserWords = Array.from(new Set((messagesData as MessageData[]).flatMap(x => 'tokenDataArr' in x ? x['tokenDataArr']!.map(tokenData => tokenData.token) : [])))
  allUsedUserWords.push('Brick', "Bot")
  
  try {



    // const [xmlResp, cleanResp, focusWordsUsed] = await _main(messages, createSystemPrompt(language, topic, HARDCODED_WORD_LIST, focusList))

    console.log(`cleanResp generated: `, 'cleanResp')


    const singleMessageStream = new ReadableStream({
      start(controller) {
        controller.enqueue('clean Resp');
        controller.close();
      }
    });
    
    return new StreamingTextResponse(singleMessageStream)
    // return Response.json({response: 'cleanResp'})
  } catch (e) {
    throw e;
  }
}







async function tokenizer(
  words: string,
  language: string = "German"
): Promise<TokenData[]> {
  // const url = `https://api.brick.bot`;
  const url = `http://localhost:8000`;
  return (await fetch(`${url}/process-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_str: words,
      language,
    }),
  }).then((resp) => {
    return resp.json()
  })).tokens as TokenData[]
}
