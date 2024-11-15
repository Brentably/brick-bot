import OpenAI from "openai";
import { StreamingTextResponse, AnthropicStream } from "ai";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export const runtime = "edge"; // 'nodejs' is the default

// prompt chaining:
// A. is there a flashcard or flashcards to be made. AKA were any mistakes made?
const createSystemPromptA = (language: string) =>
  `<instructions>
You are Brick Bot, a ${language} language expert. You will recieve a snippet of conversation between an instructor and their pupil. Your job is to determine if the pupil made any mistakes, such as a wrong word, incorrect conjugation, or English words. 
If there are mistakes in the pupil's message, you say "YES", otherwise, you say "NO". You don't reply with anything else other than "YES" or "NO".
Don't count grammar, such as a missed period or comma, as a mistake.
The examples are in German, but you should provide the same analysis for ${language}.
Your answer should always be "YES" or "NO" in English, even though you're analyzing ${language}.
Only comment on linguistic / grammar / vocabulary mistakes, not logical consistency with what the pupil might have said.
DO NOT correct capitalization.
</instructions>

<example>
Instructor: Hallo, ich bin Brick Bot. Bitte stell dich vor.
Pupil: Ich heiße Brent! Wie geht's?
Output: NO
</example>

<example>
Instructor: \"Scheu\" bedeutet auf Englisch \"shyness\" oder \"inhibition\".\n\nDer vollständige Satz, den ich gesagt habe, war: \"Keine Scheu, Fehler sind völlig normal am Anfang.\"\n\nDas heißt: \"Don't be shy, making mistakes is totally normal in the beginning.\"\n\nEs ist ganz natürlich, am Anfang beim Lernen einer neuen Sprache Fehler zu machen. Das ist überhaupt kein Problem! Durch Üben und meine Korrekturen wirst du immer besser werden.\n\nLass uns deine letzte Aussage noch einmal zusammen anschauen: \"Was heist 'Scheu' auf English?\" Hier hast du \"heißt\" falsch geschrieben. Die korrekte Schreibweise ist \"heißt\". Ansonsten war der Satz aber prima!
Pupil: Was heist "Scheu" auf English?
Output: NO
</example>

<example>
Instructor: Du machst das gut. Was ist deine Lieblingsfarbe?
Pupil: Danke! Mein lieblingsfarbe ist blue
OUTPUT: YES
<response>

<example> 
Pupil: Danke!
Instructor: Gerne! Ich finde es toll, dass du direkt nachfragst, wenn du etwas nicht verstehst. Das ist der beste Weg zum Lernen. \n\nLass uns nun zurückkommen zu deinen Hobbys und Interessen. Du kannst ruhig ein paar einfache Sätze auf Deutsch bilden, auch wenn sie vielleicht nicht perfekt sind. Ich werde dir dann dabei helfen, sie zu verbessern. Worauf wartest du? Los geht's!
Output: NO
</example>

<example>
Instructor: Super, Brent! Ich freue mich, dich kennenzulernen. Deine Sätze waren größtenteils richtig, aber lass mich ein paar kleine Korrekturen vornehmen:\n\n1. \"Ich bin gerade am Strand mit meiner Familie.\" - Wenn du über deine Familie als Ganzes sprichst, benutzt du \"meine Familie\" (feminines Nomen).\n\n2. \"Es ist warm draußen.\" - Auf Deutsch sagt man \"draußen\" statt \"outside\".\n\nJetzt erzähl mir mehr! Was machst du gerne am Strand? Schwimmst du gerne oder sonnst du dich lieber?
Pupil: Ich heiße Brent! Ich komme aus Kalifornien. Ich bin gerade am Strand mit meinem Familie. Es ist warm "outside".
Output: YES
</example>

<example>
Instructor: Hallo! Schön, dass du so motiviert bist, Deutsch zu lernen. Ich freue mich darauf, dich dabei zu unterstützen.

Erzähl mir doch mal ein bisschen von dir! Woher kommst du und was machst du gerne in deiner Freizeit? Ich bin immer neugierig, mehr über meine Schüler zu erfahren.

Deutsch macht wirklich Spaß zu lernen, finde ich. Es gibt so viele interessante Wörter und Ausdrücke. Hast du schon ein paar deutsche Wörter gelernt? Wenn ja, was sind deine Lieblingswörter bisher?

Lass es uns langsam angehen und Schritt für Schritt vorgehen. Jeder fängt mal klein an. Die Hauptsache ist, dass du dranbleibst und kontinuierlich übst. Mit der Zeit wirst du immer sicherer werden.

Ich bin auf jeden Fall für dich da, wann immer du Fragen hast oder Hilfe brauchst. Gemeinsam machen wir das! Also, erzähl ruhig ein bisschen von dir und deinen Deutschlern-Erfahrungen bisher.
Pupil: Das ist sehr cool
Output: NO
</example>

<example>
Instructor: Hallo! Wie geht's dir heute? Magst du deutsches Essen?
Pupil: Nein, ich liebe Bier!
Output: NO
</example>

<example>
Instructor: Super! Äpfel sind wirklich lecker und gesund. Es gibt so viele verschiedene Sorten. Machst du gerne etwas Besonderes mit Äpfeln? Zum Beispiel Apfelkuchen oder Apfelmus?
Pupil: danke
Output: NO
</example>

<example>
Instructor: Hallo! Schön, dass du da bist. Was magst du gerne essen?
Pupil: danke
Output: NO
</example>

<example>
Instructor: Hallo! Ich freue mich sehr, mit dir über Essen und Küche zu sprechen. Was ist dein Lieblingsessen?
Pupil: Was machst du gerne in deiner Freizeit?
Output: NO
</example>

<example>
Instructor: ​Guten Tag! Wie geht es dir?

Was ist dein Lieblingsessen?
Pupil: ​lass mich etwas testen
Output: NO
</example>
`;

// B. if yes, make flashcards (can do a different call for each flashcard if better.)
const createSystemPromptB = (language: string) =>
  `<instructions>
You are a ${language} language expert. You are well versed in creating excellent cloze flashcards for language learners using spaced repetition software such as Anki and SuperMemo. You will be given a snippet of conversation between a language instructor and their pupil. Create one or multiple flashcards based on the instructor's feedback. 
Reply in XML, and only XML.
There are 2 types of cards you can make.
1. <vocab> cards. These identify a ${language} word or short phrase that the user should know. They specify the vocab word / phrase in ${language}.
Example: <vocab>schön</vocab>
Use a vocab card when it's clear the pupil is being corrected on the correct vocab word or phrase.

2. <cloze> cards which have <deletion> tags to specify what words to cloze delete.
Example: <cloze>Es war <deletion>schön</deltion> mit zu <deletion>reden</deletion>.</cloze>
Use a cloze sentence when the instructor gives a correct sentence to the pupil in order to remedy some mistakes. Do NOT use the instructor's explanation as the cloze sentence, but rather the sentence should be an example sentence around the conversation.
Any cloze sentence / cloze deletion should come directly from the instructor's feedback! It should bridge the gap between the pupil's statement and the instructor's example / explanation.
Let me reiterate, only include cloze deletions which test improvements pointed out by the instructor.
</instructions>

<example>
Pupil: Was heist "Scheu" auf English?
Instructor: \"Scheu\" bedeutet auf Englisch \"shyness\" oder \"inhibition\".\n\nDer vollständige Satz, den ich gesagt habe, war: \"Keine Scheu, Fehler sind völlig normal am Anfang.\"\n\nDas heißt: \"Don't be shy, making mistakes is totally normal in the beginning.\"\n\nEs ist ganz natürlich, am Anfang beim Lernen einer neuen Sprache Fehler zu machen. Das ist überhaupt kein Problem! Durch Üben und meine Korrekturen wirst du immer besser werden.\n\nLass uns deine letzte Aussage noch einmal zusammen anschauen: \"Was heist 'Scheu' auf English?\" Hier hast du \"heißt\" falsch geschrieben. Die korrekte Schreibweise ist \"heißt\". Ansonsten war der Satz aber prima!
Output: 
<cards>
<vocab>Scheu</vocab>
<cloze>Keine <deletion>Scheu</deletion>, Fehler sind völlig normal am Anfang.</cloze>
</cards>
</example>

<example>
Pupil: Hallo, ich bin \"wondering\" ob du sind eine gute Robot
Instructor: Hallo! Ich sehe, dass du einen Satz auf Deutsch schreiben möchtest. Das ist super! Lass uns deinen Satz ein wenig verbessern:\n\nAnstatt \"ich bin wondering\" kannst du sagen \"ich frage mich\". \"Wondering\" ist ein englisches Wort und auf Deutsch sagt man stattdessen \"sich fragen\".\n\nBei \"ob du sind eine gute Robot\" gibt es ein paar kleine Fehler. \"Sind\" benutzt man nur bei \"Sie\" oder in der Mehrzahl. Für \"du\" nimmt man stattdessen \"bist\". Und \"Robot\" ist auch ein englisches Wort. Auf Deutsch sagt man \"Roboter\".\n\nDer verbesserte Satz lautet also:\n\n\"Hallo, ich frage mich, ob du ein guter Roboter bist.\"\n\nIch hoffe, das hilft dir weiter! Und um deine Frage zu beantworten: Ich gebe mein Bestes, um ein guter Roboter und Lehrer zu sein. Lass uns weiter üben und sag mir, wenn du noch Fragen hast!
Output: 
<cards>
<vocab>ich frage mich</vocab>
<vocab>sich fragen</vocab>
<vocab>Roboter</vocab>
<cloze>Hallo, <deletion>ich frage mich</deletion>, ob du ein guter <deletion>Roboter</deletion> <deletion>bist</deletion>.</cloze>
</cards>
</example>

<example>
Pupil: Danke! Mein lieblingsfarbe ist blue
Instructor: Sehr gut! Du hast den Satz fast perfekt gebildet. Nur zwei kleine Korrekturen:\n\n1. \"mein\" sollte hier \"meine\" sein, da \"Lieblingsfarbe\" ein feminines Wort ist.\n2. \"blue\" auf Englisch heißt \"blau\" auf Deutsch.\n\nDer korrekte Satz lautet also: \"Meine Lieblingsfarbe ist blau.\"\n\nBlau ist eine schöne Farbe! Sie erinnert mich an den Himmel und das Meer. Was verbindest du mit der Farbe blau?
Output:
<cards>
<cloze><deletion>Meine</deletion> <deletion>Lieblingsfarbe</deletion> ist <deletion>blau</deletion>.</cloze>
<vocab>blau</vocab>
</cards>
</example>

<example>
Pupil: Ein Herr hat mir in ein Flugstelle erzält: 'Es war schön mit dir zu reden.'
Instructor: Das ist eine nette Phrase, die man am Ende eines Gesprächs verwendet! Lass mich deinen Satz ein wenig korrigieren:\n\n\"Ein Herr hat mir an einem Flughafen gesagt: 'Es war schön, mit dir zu reden.'\"\n\nEin paar Erklärungen:\n- \"Flugstelle\" ist kein deutsches Wort. Stattdessen verwendest du \"Flughafen\".\n- In deinem Satz fehlten ein paar Kommas. Man setzt Kommas vor und nach direkter Rede und vor \"zu\" mit Infinitiv.\n- \"Erzählen\" bedeutet normalerweise, eine längere Geschichte zu erzählen. Für kurze Phrasen passt \"sagen\" besser.\n\nSolche Phrasen sind toll, um eine freundliche Atmosphäre zu schaffen. Hier sind noch ein paar ähnliche Ausdrücke:\n- \"Es hat mich gefreut, dich kennenzulernen.\"\n- \"Ich hoffe, wir sehen uns bald wieder.\"\n- \"Bis zum nächsten Mal!\"\n\nHast du den Herrn am Flughafen nach dem Weg gefragt oder hattet ihr einfach ein nettes Gespräch?
Output: 
<cards>
<vocab>Flughafen</vocab>
<cloze>Ein Herr hat mir <deletion>an einem</deletion> <deletion>Flughafen</deletion> <deletion>gesagt</deletion>: 'Es war schön, mit dir zu reden.'</cloze>
</cards>
</example>

<example>
Pupil: Ich verwende Typescript, um "create" ein Projekt mit Artificial Intelligenz. Es gibt ein Robot, dass das kann mit dir reden und eine Lehrer sein.
Instructor: Das klingt nach einem sehr interessanten Projekt! Lass uns deinen Text ein wenig verbessern:\n\nKorrekt wäre: \"Ich verwende TypeScript, um ein Projekt mit künstlicher Intelligenz zu erstellen. Es gibt einen Roboter, der mit dir reden und ein Lehrer sein kann.\"\n\nEin paar Anmerkungen:\n- \"create\" ist Englisch. Auf Deutsch sagt man \"erstellen\" oder \"entwickeln\".\n- \"dass\" ist ein Relativpronomen und wird verwendet, um Nebensätze einzuleiten, die nicht essenziell sind. Hier wäre \"der\" (oder \"die\"/\"das\", je nach Geschlecht) besser geeignet.\n- \"das kann mit dir reden\" sollte \"der mit dir reden kann\" heißen. Die Reihenfolge von Subjekt und Verb ist in Nebensätzen anders als in Hauptsätzen.\n- \"eine Lehrer\" sollte \"ein Lehrer\" heißen, da \"Lehrer\" maskulin ist.\n\nTypeScript ist eine gute Wahl für so ein Projekt. Wie weit bist du schon gekommen? Und was für eine Art von künstlicher Intelligenz planst du zu verwenden? Ich bin sehr gespannt, mehr darüber zu erfahren!
Output: 
<cards>
<vocab>erstellen</vocab>
<vocab>künstliche Intelligenz</vocab>
<cloze>Ich verwende TypeScript, um ein Projekt mit <deletion>künstlicher Intelligenz</deletion> zu <deletion>erstellen</deletion>.</cloze>
<cloze>Es gibt <deletion>einen Roboter<deletion/>, <deletion>der</deletion> mit dir reden und <deletion>ein</deletion> Lehrer <deletion>sein kann</deletion>.</cloze>
</cards>
</example>
`;

export async function POST(req: Request) {
  console.log('didMakeMistakes hit')
  try {
    const { pupilMessage, instructorMessage, language } = await req.json();


    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: createSystemPromptA(language) },
        {
          role: "user",
          content: `
          Instructor: ${instructorMessage}
          Pupil: ${pupilMessage}
          Output: `,
        },
      ],
    });


    const yesOrNoText = response.choices[0].message.content ?? ''
    const yesOrNo = yesOrNoText.includes("YES") ? 'YES' : yesOrNoText.includes("NO") ? "NO" : yesOrNoText
    console.log("was it concluded that mistakes were made?", yesOrNo)

    if (yesOrNo !== "YES" && yesOrNo !== "NO")
      throw new Error(`yesOrNo did not include yes or not but YES or NO but it was: ${yesOrNo}`);

    return Response.json({didMakeMistakes: yesOrNo})

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
// we send unparsed flashcards b/c edge runtime doesn't have DOMParser
    return Response.json({unparsedFlashcards: unparsedFlashcards})
  } catch (e) {
    throw e;
  }
}
