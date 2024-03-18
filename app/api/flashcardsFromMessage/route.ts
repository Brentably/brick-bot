import OpenAI from "openai";
import { StreamingTextResponse, AnthropicStream } from "ai";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export const runtime = "edge"; // 'nodejs' is the default

// prompt chaining:
// A. is there a flashcard or flashcards to be made
const createSystemPromptA = (language: string) =>
  `<instructions>
You are a ${language} language expert. You are well versed in creating excellent flashcards for language learners using spaced repetition software such as Anki and SuperMemo. You will be given a snippet of feedback from a language teacher and their pupil. Your task is simply to determine whether or not there is a flashcard, or several flashcard to be made from the teachers feedback, OR if the student performed well, and there's no flashcard to be made.
If there is a flashcard to be made, you say "YES", otherwise, you say "NO". You don't reply with anything else other than "YES" or "NO".
The examples are in German, but you should provide the same analysis for ${language}.
</instructions>

<example>
Pupil: Ich heiße Brent! Wie geht's?
Instructor: Sehr gut, Brent! Es geht mir gut, danke der Nachfrage. Ich freue mich, dich kennenzulernen. \n\nDu hast einen tollen ersten Satz auf Deutsch gesagt. \"Ich heiße Brent\" ist perfekt. Und \"Wie geht's?\" ist eine gängige Frage, um nach dem Befinden zu fragen. Sehr gut gemacht!\n\nLass uns ein bisschen üben. Vielleicht kannst du mir etwas über dich erzählen? Wo kommst du her? Was machst du gerne in deiner Freizeit? Sprich einfach, und ich korrigiere dich, wenn nötig. Keine Scheu, Fehler sind völlig normal am Anfang.
Output: NO
</example>

<example>
Pupil: Was heist "Scheu" auf English?
Instructor: \"Scheu\" bedeutet auf Englisch \"shyness\" oder \"inhibition\".\n\nDer vollständige Satz, den ich gesagt habe, war: \"Keine Scheu, Fehler sind völlig normal am Anfang.\"\n\nDas heißt: \"Don't be shy, making mistakes is totally normal in the beginning.\"\n\nEs ist ganz natürlich, am Anfang beim Lernen einer neuen Sprache Fehler zu machen. Das ist überhaupt kein Problem! Durch Üben und meine Korrekturen wirst du immer besser werden.\n\nLass uns deine letzte Aussage noch einmal zusammen anschauen: \"Was heist 'Scheu' auf English?\" Hier hast du \"heißt\" falsch geschrieben. Die korrekte Schreibweise ist \"heißt\". Ansonsten war der Satz aber prima!
Output: YES
</example>

<example> 
Pupil: Danke!
Instructor: Gerne! Ich finde es toll, dass du direkt nachfragst, wenn du etwas nicht verstehst. Das ist der beste Weg zum Lernen. \n\nLass uns nun zurückkommen zu deinen Hobbys und Interessen. Du kannst ruhig ein paar einfache Sätze auf Deutsch bilden, auch wenn sie vielleicht nicht perfekt sind. Ich werde dir dann dabei helfen, sie zu verbessern. Worauf wartest du? Los geht's!
Output: NO
</example>

<example>
Pupil: Ich heiße Brent! Ich komme aus Kalifornien. Ich bin gerade am Strand mit meinem Familie. Es ist warm "outside".
Instructor: Super, Brent! Ich freue mich, dich kennenzulernen. Deine Sätze waren größtenteils richtig, aber lass mich ein paar kleine Korrekturen vornehmen:\n\n1. \"Ich bin gerade am Strand mit meiner Familie.\" - Wenn du über deine Familie als Ganzes sprichst, benutzt du \"meine Familie\" (feminines Nomen).\n\n2. \"Es ist warm draußen.\" - Auf Deutsch sagt man \"draußen\" statt \"outside\".\n\nJetzt erzähl mir mehr! Was machst du gerne am Strand? Schwimmst du gerne oder sonnst du dich lieber?
Output: YES
</example>
`;

// B. if yes, make flashcards (can do a different call for each flashcard if better.)
const createSystemPromptB = (language: string) =>
  `<instructions>
You are a ${language} language expert. You are well versed in creating excellent flashcards for language learners using spaced repetition software such as Anki and SuperMemo. You will be given a snippet of conversation between a language instructor and their pupil. Create one or multiple flashcards based on the instructor's feedback. Use <card>, <front>, <back> tags to specify the card.
</instructions>

<example>
Pupil: Was heist "Scheu" auf English?
Instructor: \"Scheu\" bedeutet auf Englisch \"shyness\" oder \"inhibition\".\n\nDer vollständige Satz, den ich gesagt habe, war: \"Keine Scheu, Fehler sind völlig normal am Anfang.\"\n\nDas heißt: \"Don't be shy, making mistakes is totally normal in the beginning.\"\n\nEs ist ganz natürlich, am Anfang beim Lernen einer neuen Sprache Fehler zu machen. Das ist überhaupt kein Problem! Durch Üben und meine Korrekturen wirst du immer besser werden.\n\nLass uns deine letzte Aussage noch einmal zusammen anschauen: \"Was heist 'Scheu' auf English?\" Hier hast du \"heißt\" falsch geschrieben. Die korrekte Schreibweise ist \"heißt\". Ansonsten war der Satz aber prima!
Output: 
<card>
<front>Scheu auf Englisch</front>
<back>"shyness" oder "inhibition"</back>
</card>
</example>
`;

export async function POST(req: Request) {
  try {
    const { pupilMessage, instructorMessage, language } = await req.json();

    const respA = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      system: createSystemPromptA(language),
      messages: [
        {
          role: "user",
          content: `Pupil: ${pupilMessage}
          Instructor: ${instructorMessage}
          Output: `,
        },
      ],
    });

    const yesOrNo = respA.content[0].text;
    console.log("flashcardsFromMessage prompt A resp: \n", yesOrNo);

    if (yesOrNo !== "YES" && yesOrNo !== "NO")
      throw new Error(`yesOrNo was not YES or NO but it was: ${yesOrNo}`);

    if (yesOrNo === "NO") return Response.json({ flashcards: [] });

    const respB = await client.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4096,
      system: createSystemPromptB(language),
      messages: [
        {
          role: "user",
          content: `Pupil: ${pupilMessage}
          Instructor: ${instructorMessage}
          Output: `,
        },
      ],
    });

    const unparsedFlashcards = respB.content[0].text

    console.log(`unparsed flashcards: \n${unparsedFlashcards}`)


    return Response.json({flashcards: unparsedFlashcards})
  } catch (e) {
    throw e;
  }
}
