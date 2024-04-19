import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { NextResponse } from "next/server";



export async function POST(req: Request) {
  try {
    const { length, allowedWordList } = await req.json();

    const allWords = (JSON.parse(fs.readFileSync(process.cwd() + '/app/5009_word_and_scraped_cd.json', 'utf8')) as any[]).map(wordData => wordData.word);
    const filteredWords = allWords.filter(word => !allowedWordList.includes(word));



    return Response.json({wordList: filteredWords.length > length ? filteredWords.slice(0, length) : filteredWords});
  } catch (e) {
    throw e;
  }
}
