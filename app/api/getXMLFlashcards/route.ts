import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge"; // 'nodejs' is the default

// B. if yes, make flashcards (can do a different call for each flashcard if better.)
const createSystemPromptOld = (language: string) =>
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

const createSystemPrompt = (language: string) =>
  `<instructions>
You are a ${language} language expert. You are well versed in creating excellent cloze flashcards for language learners using spaced repetition software such as Anki and SuperMemo. You will be given a snippet of conversation between a language instructor and their pupil. Create one or multiple flashcards based on the instructor's feedback. 
Reply in XML, and only XML.

Create cloze flashcards like this:
<cloze> cards with <deletion> tags to specify what words to cloze delete.
Example: <cloze>Es war <deletion>schön</deltion> mit zu <deletion>reden</deletion>.</cloze>
</instructions>


<example>
<message>Ich weis nicht.</message>
<corrected-message>Ich weiß nicht</message>
<mistakes>Weis sollte weiß sein</mistakes>
<cards>
<cloze>Ich <deletion>weiß</deletion></cloze>
</cards>
<example>

`;

export async function POST(req: Request) {
  console.log("getXMLFlashcards hit");
  try {
    const { pupilMessage, correctedMessage, mistakes, language } =
      await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        { role: "system", content: createSystemPrompt(language) },
        {
          role: "user",
          content: `<message>${pupilMessage}</message>
              <corrected-message>${correctedMessage}</corrected-message>
              <mistakes>${mistakes}</mistakes>
              `,
        },
        { role: "assistant", content: "<cards>" },
      ],
    });

    const resp = response.choices[0].message.content

    const XMLFlashcards = resp?.trimStart().startsWith('<cards>') ? resp : "<cards>" + resp

    console.log(`unparsed flashcards: \n${XMLFlashcards}`);
    // we send unparsed flashcards b/c edge runtime doesn't have DOMParser
    return Response.json({ XMLFlashcards });
  } catch (e) {
    throw e;
  }
}
