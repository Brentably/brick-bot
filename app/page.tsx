"use client";
import { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble'
import { useChat, Message, CreateMessage, useCompletion } from 'ai/react';
import useConfiguration from './hooks/useConfiguration';
import { GSP_NO_RETURNED_VALUE } from 'next/dist/lib/constants';
import Div100vh from 'react-div-100vh';


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
  back_extra: string
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
  const [sentenceQueue, setSentenceQueue] = useState<string[]>([]);
  const sentenceCount = useRef(0)
  const SENTENCE_ENDS = [".", "!", "?", ":", ")", "(", "[", "]"]


  // useEffect(() => {
  //   if(isStreaming) return

  // }, [isStreaming])

  const playNextAudio = async (): Promise<void> => {
    if (sentenceQueue.length === 0) return Promise.resolve();
    const sentence = sentenceQueue[0]
    setSentenceQueue((queue) => queue.slice(1));

    const res = await fetch('/api/tts', {
      method: 'POST',
      body: JSON.stringify({
        "input": sentence
      })
    });
    const blob = await res.blob();
    const blobURL = URL.createObjectURL(blob);
    const audio = new Audio(blobURL);
    await audio.play();

    return new Promise<void>((resolve) => {
      audio.onended = () => {
        resolve();
      };
    })
  }

  useEffect(() => {
    console.log('sentenceQueue update', sentenceQueue)

    // const playNextAudio = async () => {
    //   console.log("HELLO????")
    //   if (sentenceQueue.length === 0) return;

    //   const res = await fetch('/api/tts', {
    //     method: 'POST',
    //     body: JSON.stringify({
    //       "input": sentenceQueue[0]
    //     })
    //   });
    //   const blob = await res.blob();
    //   const blobURL = URL.createObjectURL(blob);
    //   const audio = new Audio(blobURL);
    //   audio.onended = () => {
    //     setSentenceQueue((queue) => queue.slice(1));
    //   };
    //   await audio.play();
    // }
    // playNextAudio();
  }, [sentenceQueue]);

  useEffect(() => {
    // build the queue of sentences as they come in. 
    // no duplication.
    if (messages.length < 1) return
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant') return

    const messageStr = lastMessage.content;

    // const sentenceChunks = messageStr.split(/(?<=[.!?])\s+/);
    // const sentenceChunks = messageStr.split(/(?<=[.!?]|--?|\u2014|\u2013)\s+/);
    const sentenceChunks = messageStr.split(/(?<=[.!?])(?=(?:[^"]*"[^"]*")*[^"]*$)\s+/);

    const newSentenceCount = sentenceChunks.length - 1;

    
    const isFinal = !isTextStreaming

    console.log("sentence chunks: " + sentenceChunks)
    
    // as new chunks stream in, we add the second to last chunk, so we only add completed chunks.
    // skip over first chunk because we don't want to add array[-1] chunk
    if (newSentenceCount > sentenceCount.current && sentenceChunks.length >= 2) {
      console.log("new sentence count: " + newSentenceCount + "\ncurr sentence count: " + sentenceCount.current);
      console.log('adding chunk to queue: ', sentenceChunks[sentenceChunks.length - 2])
      setSentenceQueue(pq => [...pq, sentenceChunks[sentenceChunks.length - 2]])
      sentenceCount.current += 1;
      console.log("update sentence count to: " + newSentenceCount)
    }

    // on final chunk, we add the last chunk though.
    if (isFinal) {
      setSentenceQueue(pq => [...pq, sentenceChunks[sentenceChunks.length - 1]])
      sentenceCount.current = 0
    }


  }, [messages, isTextStreaming]);

  const beginChat = () => {
    setHasStarted(true)
    setMessages([
      { id: crypto.randomUUID(), content: LANGUAGE_TO_HELLO[targetLanguage], role: 'user' },
      { id: crypto.randomUUID(), content: LANGUAGE_TO_INTRO[targetLanguage], role: 'assistant' }
    ])
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
    console.log('messages; ', messages)
    const createClozeCard = async (clozeCardXml: Element) => {
      console.log('createClozeCard called')
      console.log('cloze card xml: ')
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
      console.log(`resp: `, resp)
      const englishTranslationJSON = await resp.json()
      console.log('englishTranlsationJSON: ', englishTranslationJSON)
      const englishTranslation = englishTranslationJSON.englishTranslation
      const formattedCardText =
        `${foreignSentenceClozed}
      <br/><br/>
    ${englishTranslation}`
      console.log('clozeText =', foreignSentenceClozed)
      const clozeFlashcard: ClozeFlashcard = {
        text: formattedCardText,
        back_extra: ''
      }
      return clozeFlashcard
    }

    async function createFlashcards(unparsedFlashcards: string) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(unparsedFlashcards, "text/xml");
      console.log('xmlDoc')
      console.log(xmlDoc)
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

      console.log('pLM on message: ', message.content)
      console.log(messages)
      const pupilMessage = messages.at(-2).content
      console.log(`pupilMessage: ${pupilMessage}`)

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

    console.log('processing latest message at index', messages.length - 1)
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
          <div className='chatbot-header pb-6'>
            <div className='flex justify-between'>
              <div className='flex items-center gap-2'>
                <RobotIcon />
                <h1 className='chatbot-text-primary text-xl md:text-2xl font-medium'>Nick Rosenksi is a bitch</h1>
              </div>
            </div>
            <p className="chatbot-text-secondary-inverse text-sm md:text-base mt-2 md:mt-4">Chatting with Brick Bot is awesome! You simply have a conversation in your desired target language, it adjusts to your level, and generates Anki cards for you to study based on your mistakes.</p>
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

          </div>

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