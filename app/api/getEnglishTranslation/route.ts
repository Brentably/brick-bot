import * as deepl from "deepl-node";




const translator = new deepl.Translator(process.env.DEEPL_API_KEY!);

// (async () => {
//   const result = await translator.translateText("Hello, world!", null, "fr");
//   console.log(result.text); // Bonjour, le monde !
// })();

// export const runtime = "edge"; // 'nodejs' is the default

export async function POST(req: Request) {
  try {
    console.log('getEnglish translation hit')
    console.log(process.env.DEEPL_API_KEY)
    const { sentence, language, context } = await req.json();

    const languageCode = language === "German" ? "de" : null

    console.log('translating ', sentence, ' from ', languageCode, ' to english')

    const result = await translator.translateText(sentence, languageCode, 'en-US', context)

    console.log('result:')
    console.log(result)

    return Response.json({ englishTranslation: Array.isArray(result) ? result[0].text : result.text });
  } catch (e) {
    throw e;
  }
}
