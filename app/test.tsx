import { useState } from "react"

// maps a word in a message with a unique word id to its lemma(s) and any references (svps)
interface WordToLemmasMapping {
    id: number | null, 
    word: string,
    lemmas: string[],
    clicked: boolean
}

const [wordsToLemmasMappings, setWordsToLemmasMappings] = useState<WordToLemmasMapping[]>([])
const [targetLanguage, setTargetLanguage] = useState<string>('German')

const tokenizeMessage = async (input_str: string, language: string): Promise<[string, number | null, string[]][]> => {
    // TODO update to fastapi url 
    const url = 'http://localhost:8000/tokenizer'
    const response = await fetch(url, {
        method: 'POST', 
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        input_str: input_str,
        language: language
        })
    })
    const tokenArray = response.json()
    return tokenArray
}


// TODO better name
// as the message content comes in, we need to populate the display message and word to lemmas mappings
const handleMessageInput = async (messageContent: string): void => {
    // call process_message on messageContent to receive [word, id, [lemmas]][]
    const tokenizedMessage: [string, number | null, string[]][] = await tokenizeMessage(messageContent, targetLanguage)
        for (const mapping of tokenizedMessage) {
            const newMapping: WordToLemmasMapping = {
                id: mapping[1],
                word: mapping[0],
                lemmas: mapping[2],
                // clicked defaults to false until updated
                clicked: false
            };
        setWordsToLemmasMappings(prevMappings => [...prevMappings, newMapping]);
    }
}