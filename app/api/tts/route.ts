import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI();

export async function POST(req: Request) {
    try {
        console.log("post to tts api");
        const { input } = await req.json()
        console.log(input)

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: await input,
        });

        const buffer = await mp3.arrayBuffer();
        
        return new Response(buffer)
    } catch (e) {
        throw e;
    }
}