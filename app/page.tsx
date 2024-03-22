"use client";
import { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble'
import { useChat, Message, CreateMessage, useCompletion } from 'ai/react';
import useConfiguration from './hooks/useConfiguration';
import { GSP_NO_RETURNED_VALUE } from 'next/dist/lib/constants';
import Div100vh, { measureHeight } from 'react-div-100vh';
import Image from 'next/image'
import bricks from "../public/assets/bricks.svg"

const LANGUAGE_TO_HELLO = {
  "German": "Hallo!",
  "French": "Bonjour!",
  "Spanish": "¡Hola!",
  "Chinese": "你好！",
  "Russian": "Привет!",
  "Arabic": "مرحبا!",
  "Portuguese": "Olá!",
  "Japanese": "こんにちは！",
  "Hindi": "नमस्ते!",
  "Bengali": "হ্যালো!",
  "Italian": "Ciao!"
}

// TODO: will add the rest later b/c want to make sure this is a good prompt now.
const LANGUAGE_TO_INTRO = {
  "German": "Hallo! Ich bin Brick Bot, ein persönlicher Sprachlehrer! Ich werde mit dir auf Deutsch sprechen und deine Fehler korrigieren.  Wie viel Deutsch kannst du?",
  "French": "Bonjour ! Je suis Brick Bot, un professeur de langue personnel ! Je te parlerai en français et je corrigerai tes erreurs.  Quel est ton niveau de français ?"
}

type BasicFlashcard = {
  front: string
  back: string
}
type ClozeFlashcard = {
  text: string,
  back_extra: string,
  foreign_sentence_base: string
}

type Flashcard = BasicFlashcard | ClozeFlashcard

export default function Home() {
  const { append, messages, input, handleInputChange, handleSubmit, setMessages, reload } = useChat({
    onResponse: () => setIsTextStreaming(true),
    onFinish: () => setIsTextStreaming(false)
  });

  const [isTextStreaming, setIsTextStreaming] = useState(false)
  const messagesEndRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<keyof typeof LANGUAGE_TO_HELLO>('German')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  // index indicates order blobs should be played in
  const [audioQueue, setAudioQueue] = useState<[number, Blob][]>([]);
  // lock to make sure only one audio plays at a time
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const processedSentenceCount = useRef(0)
  const [isHeaderOpen, setIsHeaderOpen] = useState(true)
  const SENTENCE_ENDS = [".", "!", "?", ":", ")", "(", "[", "]"]

  useEffect(() => {
    const playNextAudio = async (): Promise<void> => {

      // make sure not to call it if audio is currently playing
      if (isAudioPlaying) return;
      const audioQueueLength = Object.keys(audioQueue).length;
      if (audioQueueLength === 0) {
        setIsAudioPlaying(false);
        return Promise.resolve();
      }
      // do not run if we don't have a fully updated queue
      if (audioQueueLength < processedSentenceCount.current) return;

      setIsAudioPlaying(true);

      // sort audio queue based on index
      const sortedAudioQueue = audioQueue.sort((a, b) => a[0] - b[0]);
      console.log("audio queue: " + audioQueue);
      console.log("sorted audio queue: " + sortedAudioQueue);
      console.log("processing sentence #" + sortedAudioQueue[0][0]);

      // get the blob of the first index in the queue
      const blobURL = URL.createObjectURL(sortedAudioQueue[0][1]);

      // we want to remove the index that we just used to get the blob URL (sortedAudioQueue[0][0])
      const indexToRemove = audioQueue.findIndex(i => i[0] === sortedAudioQueue[0][0])
      setAudioQueue((queue) => queue.splice(indexToRemove, 1));

      const audio = new Audio(blobURL);
      await audio.play();

      return new Promise<void>((resolve) => {
        audio.onended = async () => {
          resolve();
          setIsAudioPlaying(false);
        };
      })
    }
    playNextAudio();

  }, [audioQueue, isAudioPlaying]);

  useEffect(() => {

    const addToAudioQueue = async () => {
      // build the queue of sentences as they come in. 
      // no duplication.
      if (messages.length < 1) return
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role !== 'assistant') return

      const messageStr = lastMessage.content;
      // const sentenceChunks = messageStr.split(/(?<=[.!?])\s+/);
      // const sentenceChunks = messageStr.split(/(?<=[.!?]|--?|\u2014|\u2013)\s+/);
      const sentencesChunks = messageStr.split(/(?<=[.!?])(?=(?:[^"]*"[^"]*")*[^"]*$)\s+/);
      // number of full sentences i.e. does not include sentence still streaming in
      const currSentenceCount = sentencesChunks.length - 1;

      // as new chunks stream in, we add the second to last chunk, so we only add completed chunks.
      // skip over first chunk because we don't want to add array[-1] chunk
      if(currSentenceCount < 1) return

      // iterate until we have added all new sentences to queue
      while (currSentenceCount > processedSentenceCount.current) {
        // we need to get the first sentence that hasn't been added to the queue yet
        // we have missed (newSentenceCount - sentenceCount.current) sentences since the last time we added to queue
        const numMissedSentences = (currSentenceCount - processedSentenceCount.current)
        
        processedSentenceCount.current += 1;
        const chunkIndex = (sentencesChunks.length - 1) - numMissedSentences

        console.log("adding sentence #" + chunkIndex + " to queue: " + sentencesChunks[chunkIndex])

        // get audio blob from sentence
        const res = await fetch('/api/tts', {
          method: 'POST',
          body: JSON.stringify({
            "input": sentencesChunks[chunkIndex]
          })
        });
        const blob = await res.blob();
        setAudioQueue(pq => [...pq, [chunkIndex, blob]]);
      }

      // const isFinal = !isTextStreaming
      // console.log("final: " + isFinal)

      // once text streaming has ended, add last chunk
      if (!isTextStreaming) {
        // get audio blob from sentence
        const res = await fetch('/api/tts', {
          method: 'POST',
          body: JSON.stringify({
            "input": sentencesChunks[sentencesChunks.length - 1]
          })
        });
        const blob = await res.blob();
        console.log("adding sentence #" + (sentencesChunks.length - 1) + " to queue: " + sentencesChunks[sentencesChunks.length - 1])
        setAudioQueue(pq => [...pq, [sentencesChunks.length - 1, blob]]);
        processedSentenceCount.current = 0
        console.log("done with this message. resetting sentence count.")
      }
    }

    addToAudioQueue();

  }, [messages, isTextStreaming]);

  const beginChat = () => {
    setHasStarted(true)
    setMessages([
      { id: crypto.randomUUID(), content: LANGUAGE_TO_HELLO[targetLanguage], role: 'user' },
      { id: crypto.randomUUID(), content: LANGUAGE_TO_INTRO[targetLanguage], role: 'assistant' }
    ])
    if (typeof window !== 'undefined' && window.innerWidth < 600) setIsHeaderOpen(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };



  const playAudio = async () => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      body: JSON.stringify({
        "input": messages[messages.length - 1].content
      })
    })
    const blob = await res.blob()
    const blobURL = URL.createObjectURL(blob)
    await new Audio(blobURL).play()
  }



  useEffect(() => {
    const createClozeCard = async (clozeCardXml: Element) => {
      console.dir(clozeCardXml)
      let foreignSentenceClozed = ''
      const foreignSentenceBase = clozeCardXml.textContent
      let counter = 1
      Array.from(clozeCardXml.childNodes).forEach((node, i) => {
        if (node.nodeType === 3) {
          foreignSentenceClozed += node.textContent
        } else if (node instanceof Element && node.tagName === 'deletion') {
          const clozeDeletion = `{{c${counter}::${node.textContent}}}`
          counter++
          foreignSentenceClozed += clozeDeletion
        }
        else throw new Error(`uncovered type of node: ${node.nodeName}`)
      })

      const resp = await fetch(`/api/getClozeEnglishTranslation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: targetLanguage,
          sentence: foreignSentenceBase
        })
      })
      const englishTranslationJSON = await resp.json()
      const englishTranslation = englishTranslationJSON.englishTranslation
      const formattedCardText =
        `${foreignSentenceClozed}
      <br/><br/>
    ${englishTranslation}`
      const clozeFlashcard: ClozeFlashcard = {
        text: formattedCardText,
        back_extra: '',
        foreign_sentence_base: foreignSentenceBase
      }
      return clozeFlashcard
    }

    async function createFlashcards(unparsedFlashcards: string) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(unparsedFlashcards, "text/xml");
      let flashcardsPromises: (Promise<Flashcard>)[] = []

      xmlDoc.querySelectorAll('cloze').forEach(clozeCardXml => {

        flashcardsPromises.push(createClozeCard(clozeCardXml))
      })

      const flashcards = await Promise.all(flashcardsPromises);

      return flashcards
    }

    scrollToBottom();
    if (isTextStreaming) return
    const processLatestMessage = async (message: Message) => {
      if (message.role !== 'assistant') return
      if (messages.length < 3) return // dont process first lil bit

      const pupilMessage = messages.at(-2).content

      fetch(`/api/unparsedFlashcardsFromMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: targetLanguage,
          pupilMessage,
          instructorMessage: message.content
        })
      }).then(resp => resp.json())
        .then(resp => createFlashcards(resp.unparsedFlashcards))
        .then(flashcards => setFlashcards(flashcards))
    }

    if (messages.length) processLatestMessage(messages[messages.length - 1])
  }, [messages, isTextStreaming, targetLanguage]);

  const handleSend = (e) => {
    handleSubmit(e);
  }

  const handlePrompt = (promptText) => {
    const msg: Message = { id: crypto.randomUUID(), content: promptText, role: 'user' };
    append(msg);
  };



  return (
    <Div100vh>
      <main className="flex h-full flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col origin:w-[800px] w-full h-full rounded-md p-2 md:p-6'>
          <header className='chatbot-header pb-6'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2'>
                <Image src={bricks} alt='' className='w-10' />
                <h1 className='chatbot-text-primary text-xl md:text-2xl font-medium'>Brick Bot</h1>
              </div>
              <button
                className='text-sm md:text-base'
                onClick={() => setIsHeaderOpen(!isHeaderOpen)}
              >
                {isHeaderOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}              </button>
            </div>
            {isHeaderOpen && (
              <>
                <p className="chatbot-text-secondary-inverse text-sm md:text-base mt-2 md:mt-4">
                  Chatting with Brick Bot is awesome! You simply have a conversation in your desired target language, it adjusts to your level, and generates Anki cards for you to study based on your mistakes.
                </p>
                <div className='flex flex-col justify-between'>
                  <div className="mt-1">
                    <label htmlFor="language-select" className="chatbot-text-primary">Choose a language:</label>
                    <select
                      id="language-select"
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value as keyof typeof LANGUAGE_TO_HELLO)}
                      className="chatbot-input ml-2"
                    >
                      <option value="German">German</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Italian">Italian</option>
                    </select>
                  </div>
                  <div className=''>
                    Flashcards created: {flashcards.length}
                  </div>
                  <button className='self-start bg-gray-300 rounded-md p-1' onClick={() => {
                    // const url = `http://localhost:8000/export-flashcards?language=${targetLanguage}`
                    const url = `https://api.brick.bot/export-flashcards?language=${targetLanguage}`
                    fetch(url, {
                      method: "POST",
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        jsonFlashcards: flashcards
                      })
                    })
                      .then(response => response.blob())
                      .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = 'brick-bot-flashcards.apkg';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                      })
                      .catch((error) => {
                        console.error('Error:', error);
                      });
                  }}>
                    Download flashcards!
                  </button>
                  <button onClick={playAudio}>play audio</button>
                </div>
              </>
            )}
          </header>

          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            <div className='absolute w-full overflow-x-hidden'>
              {messages.slice(1).map((message, index) => <Bubble ref={messagesEndRef} key={`message-${index}`} content={message} />)}
            </div>
          </div>
          {hasStarted ?
            <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
              <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
              <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
                <SendIcon />
                <span className='hidden origin:block font-semibold text-sm ml-2'>Send</span>
              </button>
            </form>
            : <button onClick={beginChat} className='rounded-md p-2.5 justify-center items-center text-white bg-black'>Begin</button>
          }
        </section>
      </main>
    </Div100vh>
  )
}
function RobotIcon() {
  return <svg width="24" height="25" viewBox="0 0 24 25">
    <path d="M20 9.96057V7.96057C20 6.86057 19.1 5.96057 18 5.96057H15C15 4.30057 13.66 2.96057 12 2.96057C10.34 2.96057 9 4.30057 9 5.96057H6C4.9 5.96057 4 6.86057 4 7.96057V9.96057C2.34 9.96057 1 11.3006 1 12.9606C1 14.6206 2.34 15.9606 4 15.9606V19.9606C4 21.0606 4.9 21.9606 6 21.9606H18C19.1 21.9606 20 21.0606 20 19.9606V15.9606C21.66 15.9606 23 14.6206 23 12.9606C23 11.3006 21.66 9.96057 20 9.96057ZM7.5 12.4606C7.5 11.6306 8.17 10.9606 9 10.9606C9.83 10.9606 10.5 11.6306 10.5 12.4606C10.5 13.2906 9.83 13.9606 9 13.9606C8.17 13.9606 7.5 13.2906 7.5 12.4606ZM16 17.9606H8V15.9606H16V17.9606ZM15 13.9606C14.17 13.9606 13.5 13.2906 13.5 12.4606C13.5 11.6306 14.17 10.9606 15 10.9606C15.83 10.9606 16.5 11.6306 16.5 12.4606C16.5 13.2906 15.83 13.9606 15 13.9606Z" />
  </svg>
}

function SendIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20">
    <path d="M2.925 5.025L9.18333 7.70833L2.91667 6.875L2.925 5.025ZM9.175 12.2917L2.91667 14.975V13.125L9.175 12.2917ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z" />
  </svg>
}