"use client";
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble'
import { useChat, Message, CreateMessage, useCompletion } from 'ai/react';
import useConfiguration from './hooks/useConfiguration';
import { GSP_NO_RETURNED_VALUE } from 'next/dist/lib/constants';
import Div100vh, { measureHeight } from 'react-div-100vh';
import Image from 'next/image'
import bricks from "../public/assets/bricks.svg"
import { useBrickStore } from '../lib/store';
import { ClozeFlashcard, Flashcard } from '../lib/types';



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
  "Italian": "Ciao!",
  "Dutch": "Hallo!",
  "Greek": "Γειά σου!",
  "Hebrew": "שלום!",
  "Korean": "안녕하세요!",
  "Swedish": "Hej!",
  "Turkish": "Merhaba!"
}

const LANGUAGE_TO_INTRO = {
  "German": "Hallo! Ich bin Brick Bot, ein persönlicher Sprachlehrer! Ich werde mit dir auf Deutsch sprechen und deine Fehler korrigieren.  Wie viel Deutsch kannst du?",
  "French": "Bonjour ! Je suis Brick Bot, un professeur de langue personnel ! Je te parlerai en français et je corrigerai tes erreurs.  Quel est ton niveau de français ?",
  "Chinese": "大家好，我是 Brick Bot，一名私人语言导师！我会用中文和你交流，纠正你的错误。 你会多少中文？",
  "Spanish": "¡Hola! Soy Brick Bot, un tutor personal de idiomas. Hablaré contigo en español y corregiré tus errores. ¿Cuánto español sabes?",
  "Russian": "Привет! Я Brick Bot, твой личный языковой наставник! Я буду говорить с тобой по-русски и исправлять твои ошибки. Сколько русского ты знаешь?",
  "Arabic": "مرحبا! أنا Brick Bot، مدرس اللغة الشخصي الخاص بك! سأتحدث معك بالعربية وأصحح أخطاءك. كم تعرف من العربية؟",
  "Portuguese": "Olá! Eu sou o Brick Bot, um tutor de idiomas pessoal! Eu vou falar contigo em português e corrigir os teus erros. Quanto português sabes?",
  "Japanese": "こんにちは！私はBrick Bot、個人の言語教師です！日本語で話し、間違いを修正します。 どのくらい日本語が話せますか？",
  "Hindi": "नमस्ते! मैं ब्रिक बॉट हूँ, आपका निजी भाषा शिक्षक! मैं आपसे हिंदी में बात करूँगा और आपकी गलतियों को सुधारूँगा। आपको हिंदी कितनी आती है?",
  "Bengali": "হ্যালো! আমি ব্রিক বট, আপনার ব্যক্তিগত ভাষা শিক্ষক! আমি আপনার সাথে বাংলায় কথা বলব এবং আপনার ভুল শুধরে দেব। আপনি কতটুকু বাংলা জানেন?",
  "Italian": "Ciao! Sono Brick Bot, il tuo insegnante di lingua personale! Parlerò con te in italiano e correggerò i tuoi errori. Quanto italiano conosci?",
  "Dutch": "Hallo! Ik ben Brick Bot, jouw persoonlijke taalleraar! Ik zal met je in het Nederlands spreken en je fouten corrigeren. Hoeveel Nederlands ken je?",
  "Greek": "Γειά σου! Είμαι ο Brick Bot, ο προσωπικός σου δάσκαλος γλώσσας! Θα μιλήσω μαζί σου στα Ελληνικά και θα διορθώσω τα λάθη σου. Πόσα Ελληνικά ξέρεις;",
  "Hebrew": "שלום! אני Brick Bot, המורה האישי שלך לשפות! אני אדבר איתך בעברית ואתקן את הטעויות שלך. כמה עברית אתה יודע?",
  "Korean": "안녕하세요! 저는 Brick Bot, 개인 언어 교사입니다! 한국어로 대화하며 실수를 고쳐 드릴게요. 한국어를 얼마나 할 수 있나요?",
  "Swedish": "Hej! Jag är Brick Bot, din personliga språklärare! Jag kommer att prata med dig på svenska och rätta dina fel. Hur mycket svenska kan du?",
  "Turkish": "Merhaba! Ben Brick Bot, kişisel dil öğretmeniniz! Türkçe konuşacak ve hatalarınızı düzelteceğim. Türkçeniz ne kadar iyi?"
}

export type MessageData = {
  didMakeMistakes: boolean | null,
  mistakes?: string,
  correctedResponse?: string,
  explanation?: string
}
export default function Home() {
  const { append, messages, input, handleInputChange, handleSubmit, setMessages, reload, stop: stopChat } = useChat({
    onResponse: () => setIsTextStreaming(true),
    onFinish: () => setIsTextStreaming(false)
  });
  
  const { input: completionInput, setInput: setCompletionInput, complete, stop: stopCompletion, completion } = useCompletion({ api: '/api/getCorrectedSentenceAndFeedback', id: 'correction' })
  
  const [messagesData, setMessagesData] = useState<MessageData[]>([{didMakeMistakes: null}, {didMakeMistakes: null}])
  const [isTextStreaming, setIsTextStreaming] = useState(false)
  const messagesEndRef = useRef(null);
  const [targetLanguage, setTargetLanguage] = useState<keyof typeof LANGUAGE_TO_HELLO>('German')
  const flashcards = useBrickStore(state => state.flashcards)
  const addFlashcards = useBrickStore(state => state.addFlashcards)
  const hasStarted = useBrickStore(state => state.hasStarted)
  const setHasStarted = useBrickStore(state => state.setHasStarted)
  const zustandMessages = useBrickStore(state => state.zustandMessages)
  const setZustandMessages = useBrickStore(state => state.setZustandMessages)
  const resetStore = useBrickStore(state => state.resetStore)
  // boolean is whether it is the last message
  const [audioQueue, setAudioQueue] = useState<[Promise<Blob>, boolean][]>([]);
  // lock to make sure only one audio plays at a time
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  // # sentences that have been processed and put in queue
  const processedSentenceCount = useRef(0)
  const [isHeaderOpen, setIsHeaderOpen] = useState(true)
  // lock for when audio execution is stopped using the stop button
  // useRef so this doesn't change during execution of async func
  const audioStopped = useRef(false)

  const getInitMessages: () => Message[] = () => [
    { id: crypto.randomUUID(), content: LANGUAGE_TO_HELLO[targetLanguage], role: 'user' },
    { id: crypto.randomUUID(), content: LANGUAGE_TO_INTRO[targetLanguage], role: 'assistant' }
  ]

  useEffect(() => {
    // normally just want to be serializing to localstorage/zustand, 
    // BUT, if they refresh and messages is set back to 0, then want to make sure it's up to date with the messages that have been saved
    // whichever is longer should update the other!
    if(isTextStreaming) return
    console.log('serialize messages')
    // console.log('messages length: ', messages.length)
    // console.log('zustand messages length: ', zustandMessages.length)

    if (messages.length > zustandMessages.length && messages.length) {
      // console.log('setting zustand messages from messages: ', messages)
      setZustandMessages(messages)
    }
    else if (zustandMessages.length > messages.length) {
      // console.log('setting messages from zustand messages')
      setMessages(zustandMessages)
    }
  }, [messages, zustandMessages, isTextStreaming]) // becareful with deps here to avoid infinite loop.

  useEffect(() => {
    if (isAudioPlaying) return;

    const playNextAudio = async () => {
      if (audioQueue.length === 0) return
      if (audioStopped.current) {
        console.log("audio stopped.")
        setAudioQueue([])
        return
      }
      setIsAudioPlaying(true);

      const currentTuple = audioQueue[0]
      const currentBlob = await currentTuple[0]
      const currentBlobURL = URL.createObjectURL(currentBlob)
      const audio = new Audio(currentBlobURL);
      
      // rm from audio queue
      setAudioQueue(pq => pq.slice(1))

      audio.onended = () => setIsAudioPlaying(false)
      audio.play();
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
      const sentencesChunks = messageStr.split(/(?<=[.!?])(?=(?:[^"]*"[^"]*")*[^"]*$)\s+/);
      // number of full sentences i.e. does not include sentence still streaming in
      const currSentenceCount = sentencesChunks.length - 1;

      // as new chunks stream in, we add the second to last chunk, so we only add completed chunks.
      // skip over first chunk because we don't want to add array[-1] chunk
      if (currSentenceCount < 1) return

      // iterate until we have added all new sentences to queue
      while (currSentenceCount > processedSentenceCount.current) {
        // we need to get the first sentence that hasn't been added to the queue yet
        // we have missed (newSentenceCount - sentenceCount.current) sentences since the last time we added to queue
        const numMissedSentences = (currSentenceCount - processedSentenceCount.current)

        processedSentenceCount.current += 1;
        const chunkIndex = (sentencesChunks.length - 1) - numMissedSentences

        // get promise of audio blob from sentence
        const blob = fetch('/api/tts', {
          method: 'POST',
          body: JSON.stringify({
            "input": sentencesChunks[chunkIndex]
          })
        }).then(res => res.blob())

        setAudioQueue(pq => [...pq, [blob, false]])
      }
      // once text streaming has ended, add last chunk
      if (!isTextStreaming) {
        // get promise of audio blob from sentence
        const blob = fetch('/api/tts', {
          method: 'POST',
          body: JSON.stringify({
            "input": sentencesChunks[sentencesChunks.length - 1]
          })
        }).then(res => res.blob())

        setAudioQueue(pq => [...pq, [blob, true]])

        processedSentenceCount.current = 0
      }
    }
    addToAudioQueue();

  }, [messages, isTextStreaming]);

  const beginChat = () => {
    setHasStarted(true)
    setMessages(getInitMessages())
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

  function extractTextFromInsideTags(sourceText: string, tagName: string) {
    const startTag = `<${tagName}>`
    const endTag = `</${tagName}>`
    if (!sourceText.includes(endTag)) return null
    const startIndex = sourceText.indexOf(startTag) + startTag.length;
    const endIndex = sourceText.indexOf(endTag);
    return sourceText.slice(startIndex, endIndex);
  }

  useEffect(() => {
    // console.log('completion update: ', completion)
    const processLatestCompletionFromStream = (completionStream: string) => {

      const mistakesText = extractTextFromInsideTags(completionStream, 'mistakes')
      const correctedResponseText = extractTextFromInsideTags(completionStream, 'corrected-response')
      const explanationText = extractTextFromInsideTags(completionStream, 'explanation')
      setMessagesData(pMD => [...pMD.slice(0, -1), {...pMD.at(-1), mistakes: mistakesText, correctedResponse: correctedResponseText, explanation: explanationText}])
    }
    processLatestCompletionFromStream(completion)
  }, [completion])


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

    async function createFlashcardsFromXML(unparsedFlashcards: string) {
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

    const processLatestMessage = async (message: Message, index: number) => {
      if (message.role !== 'user') return
      if (messages.length < 3) return // dont process first lil bit

      const instructorMessage = messages.at(-2).content

      const resp = await fetch(`/api/didMakeMistakes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: targetLanguage,
          instructorMessage,
          pupilMessage: message.content,
        })
      }).then(resp => resp.json())

      const didMakeMistakes = resp.didMakeMistakes === 'YES' ? true : false
      console.log('')
      setMessagesData(pM => {
        const newArr = [...pM]
        newArr[index] = { didMakeMistakes }
        return newArr
      })

      // if (didMakeMistakes) await fetch(`/api/getCorrectedSentenceAndFeedback`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     language: targetLanguage,
      //     pupilMessage,
      //     instructorMessage: message.content
      //   })
      // })

      if (didMakeMistakes) complete(``, {
        body: {
          language: targetLanguage,
          pupilMessage: message.content,
          instructorMessage
        }
      })


      // .then(resp => createFlashcardsFromXML(resp.unparsedFlashcards))
      // .then(_flashcards => {
      //   console.log('flashcards: ')
      //   console.log(_flashcards)
      //   addFlashcards(_flashcards)
      // })
    }

    if (messages.length) processLatestMessage(messages[messages.length - 1], messages.length - 1)
  }, [messages, isTextStreaming, targetLanguage]);

  const handleSend: FormEventHandler<HTMLFormElement> = (e) => {
    if (isTextStreaming) {
      console.log("stop form event")
      e.preventDefault()
      stopChat()
      setIsTextStreaming(false)
      setAudioQueue([])
      audioStopped.current = true
    } else {
      console.log("send form event")
      audioStopped.current = false
      handleSubmit(e)
    }
  }


  return (
    <Div100vh>
      <main className="flex h-full flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col max-w-[1200px] w-full h-full rounded-md p-2 md:p-6'>
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
                <div className='flex flex-col md:flex-row justify-between'>
                  <div className='flex flex-col flex-wrap'>
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
                        <option value="Russian">Russian</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Dutch">Dutch</option>
                        <option value="Greek">Greek</option>
                        <option value="Hebrew">Hebrew</option>
                        <option value="Korean">Korean</option>
                        <option value="Swedish">Swedish</option>
                        <option value="Turkish">Turkish</option>
                      </select>
                    </div>
                    <div className=''>
                      Flashcards created: {flashcards.length}
                    </div>
                    <button className='self-start bg-gray-300 rounded-md p-1' onClick={() => {
                      // const url = `http://localhost:8000/export-flashcards?language=${targetLanguage}`
                      // const url = `https://api.brick.bot/export-flashcards?language=${targetLanguage}`
                      const url = `https://brick-bot-fastapi.onrender.com/export-flashcards?language=${targetLanguage}`
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
                          console.log('handling blob')
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
                  </div>
                  <button className='self-start bg-red-300 rounded-md p-1' onClick={() => {
                    stopChat()
                    setMessages([])
                    resetStore()
                  }}>
                    Reset chat
                  </button>

                </div>
                <button onClick={playAudio}>play audio</button>
              </>
            )}
          </header>

          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            <div className='absolute w-full overflow-x-hidden'>
              {messages.slice(0).map((message, index) => index > 0 && <Bubble ref={messagesEndRef} key={`message-${index}`} content={message} messageData={messagesData[index]} />)}
            </div>
          </div>
          {hasStarted ?
            <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
              <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
              {!isTextStreaming ? (
                <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
                  <SendIcon />
                  <span className='hidden origin:block font-semibold text-sm ml-2'>Send</span>
                </button>
              ) : (
                <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
                  <StopIcon />
                  <span className='hidden origin:block font-semibold text-sm ml-2'>Stop</span>
                </button>
              )}
            </form>
            : <button onClick={beginChat} className='rounded-md p-2.5 justify-center items-center text-white bg-black'>Begin</button>
          }
        </section>
      </main>
    </Div100vh>
  )
}

function SendIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20">
    <path d="M2.925 5.025L9.18333 7.70833L2.91667 6.875L2.925 5.025ZM9.175 12.2917L2.91667 14.975V13.125L9.175 12.2917ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z" />
  </svg>
}

function StopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <rect x="5" y="5" width="10" height="10" />
    </svg>
  );
}