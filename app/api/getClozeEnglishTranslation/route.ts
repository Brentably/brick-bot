import * as deepl from "deepl-node";

const translator = new deepl.Translator(process.env.DEEPL_API_KEY!);

// (async () => {
//   const result = await translator.translateText("Hello, world!", null, "fr");
//   console.log(result.text); // Bonjour, le monde !
// })();

// export const runtime = "edge"; // 'nodejs' is the default

export async function POST(req: Request) {
  try {
    const { sentence, language } = await req.json();

    console.log('translating ', sentence, ' to english')

    const result = await translator.translateText(sentence, null, 'en-US')

    console.log('result:')
    console.log(result)

    return Response.json({ englishTranslation: Array.isArray(result) ? result[0].text : result.text });
  } catch (e) {
    throw e;
  }
}
