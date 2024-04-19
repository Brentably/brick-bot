import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { NextResponse } from "next/server";



export async function POST(req: Request) {
  try {
    const { length } = await req.json();
    // console.log("tts input: " + input)

   
    const wordList = (JSON.parse(fs.readFileSync(process.cwd() + '/app/5009_word_and_scraped_cd.json', 'utf8')) as any[]).map(wordData => wordData.word)

    return Response.json({wordList: length? wordList.slice(0, length) : wordList});
  } catch (e) {
    throw e;
  }
}
