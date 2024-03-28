"use client";
import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import Bubble, { BubblePair } from '../components/Bubble'
import { useChat, Message, CreateMessage, useCompletion } from 'ai/react';
import useConfiguration from './hooks/useConfiguration';
import { GSP_NO_RETURNED_VALUE } from 'next/dist/lib/constants';
import Div100vh, { measureHeight } from 'react-div-100vh';
import Image from 'next/image'
import bricks from "../public/assets/bricks.svg"
import { useBrickStore } from '../lib/store';
import { ClozeFlashcard, Flashcard } from '../lib/types';
import LoadingBrick from '../components/LoadingBrick';

function isEven(number: number): boolean {
  return number % 2 === 0;
}


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

const LANGUAGE_TO_EXAMPLE_PROMPTS = {
  "German": [
    'Hallo, ich bin ein Anfänger, aber ich bin aufgeregt zu lernen!',
    'Guten Tag! Ich freue mich darauf, mein Deutsch zu verbessern.',
    'Hallo! Ich bin gespannt, wie viel ich heute lernen werde.',
    'Ich bin bereit, mehr über die deutsche Sprache zu lernen.',
  ],
  "French": [
    "Bonjour, je suis débutant, mais je suis impatient d'apprendre !",
    "Bonne journée ! J'ai hâte d'améliorer mon français.",
    "Salut ! Je suis curieux de voir combien je vais apprendre aujourd'hui.",
    "Je suis prêt à en savoir plus sur la langue française.",
  ],
  "Chinese": [
    "你好，我是初学者，但我很兴奋要学习！",
    "好日子！我期待提高我的中文。",
    "你好！我很想知道我今天能学到多少。",
    "我准备好了，想要更多了解中文。",
  ],
  "Spanish": [
    "Hola, soy principiante, pero estoy emocionado de aprender!",
    "¡Buen día! Estoy deseando mejorar mi español.",
    "¡Hola! Estoy ansioso por ver cuánto aprenderé hoy.",
    "Estoy listo para aprender más sobre el idioma español.",
  ],
  "Portuguese": [
    "Olá, eu sou um iniciante, mas estou animado para aprender!",
    "Bom dia! Estou ansioso para melhorar meu português.",
    "Olá! Estou curioso para saber quanto vou aprender hoje.",
    "Estoy pronto para aprender más sobre la língua portuguesa.",
  ]
}
export type MessageData = {
  role: "user" | "assistant"
  didMakeMistakes: boolean | null,
  mistakes?: string,
  correctedMessage?: string,
  explanation?: string
}

export default function Home() {

  const { append, messages, input, handleInputChange, handleSubmit, setMessages, reload, stop: stopChat } = useChat({
    onResponse: () => setIsAssistantStreaming(true),
    // onFinish does not have access to the latest messages[], so we can't do useful operations on the whole [] :( so instead we set streaming to false and do our operations in a useEffect when streaming is false
    onFinish: () => setIsAssistantStreaming(false)
  });

  const zustandMessagesData = useBrickStore(state => state.zustandMessagesData)
  const setZustandMessagesData = useBrickStore(state => state.setZustandMessagesData)
  const [messagesData, setMessagesData] = useState<MessageData[]>([{ role: 'user', didMakeMistakes: null }])
  const zustandMessages = useBrickStore(state => state.zustandMessages)
  const setZustandMessages = useBrickStore(state => state.setZustandMessages)
  const [hasHydrated, setHasHydrated] = useState(false)

  const serializeMessagesData = useCallback(() => {
    console.log('serializing messages data')
    if (!hasHydrated) {
      setMessagesData(zustandMessagesData)
    } else if (messagesData.length >= zustandMessagesData.length && messagesData.length) {
      console.log('setting zustand from local')
      setZustandMessagesData(messagesData)
    } else if (zustandMessagesData.length > messagesData.length) {
      console.log('setting local from zustand')
      setMessagesData(zustandMessagesData)
    }
  }, [messagesData, zustandMessagesData, hasHydrated])

  const serializeMessages = useCallback(() => {
    console.log('serializing messages')
    if (!hasHydrated) {
      setMessages(zustandMessages)
    } else if (messages.length >= zustandMessages.length && messages.length) {
      // console.log('setting zustand messages from messages: ', messages)
      setZustandMessages(messages)
    } else if (zustandMessages.length > messages.length) {
      // console.log('setting messages from zustand messages')
      setMessages(zustandMessages)
    }
  }, [messages, zustandMessages, hasHydrated])

  const { input: correctionInput, setInput: setCorrectionInput, complete: correctionComplete, stop: stopCorrection, completion } = useCompletion({
    api: '/api/getCorrectedMessageAndFeedback', id: 'correction',
    onResponse: () => setIsCorrectionStreaming(true), 
    // onFinish does not have access to the latest data, so we can't do useful operations on the whole [] :( so instead we set streaming to false and do our operations in a useEffect when streaming is false
    onFinish: () => setIsCorrectionStreaming(false)
  })


  useEffect(() => {
    // console.log('messages change')
    // always keep messages data length 1 above messages to prevent undefined errors.
    if (messagesData.length < messages.length + 1) setMessagesData(pMD => [...pMD, { didMakeMistakes: null, role: isEven(pMD.length) ? 'user' : 'assistant' }])
  }, [messages])

  const [isAssistantStreaming, setIsAssistantStreaming] = useState(false)
  const [isCorrectionStreaming, setIsCorrectionStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [targetLanguage, setTargetLanguage] = useState<keyof typeof LANGUAGE_TO_EXAMPLE_PROMPTS>('German')
  const flashcards = useBrickStore(state => state.flashcards)
  const addFlashcards = useBrickStore(state => state.addFlashcards)
  const hasStarted = useBrickStore(state => state.hasStarted)
  const setHasStarted = useBrickStore(state => state.setHasStarted)
  const resetStore = useBrickStore(state => state.resetStore)
  const [indexOfProcessingMessage, setIndexOfProcessingMessage] = useState<number | null>(null)
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


  useEffect(() => {
    if (hasStarted && typeof window !== 'undefined' && window.innerWidth < 600) setIsHeaderOpen(false)
  }, [hasStarted])



  // load messagesData on initial render
  useEffect(() => {
    useBrickStore.persist.onFinishHydration((s) => {
      serializeMessages()
      serializeMessagesData()
      setHasHydrated(true)
    })
    useBrickStore.persist.rehydrate()

  }, [])

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
      if (!isAssistantStreaming) {
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

  }, [messages, isAssistantStreaming]);

  
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  function extractTextFromInsideTags(sourceText: string, tagName: string) {
    const startTag = `<${tagName}>`
    const endTag = `</${tagName}>`
    const startIndex = sourceText.indexOf(startTag) + startTag.length;
    if (sourceText.includes(endTag)) {
      const endIndex = sourceText.indexOf(endTag);
      return sourceText.slice(startIndex, endIndex);
    } else return
  }

  useEffect(() => {
    // prevents running on first render
    if (messages.length < 1) return
    // console.log('completion update: ', completion)

    // correction is streaming in so this gets called a bunch
    const processCorrectionStream = (completionStream: string) => {

      const correctedMessageText = extractTextFromInsideTags(completionStream, 'corrected-message')
      const mistakesText = extractTextFromInsideTags(completionStream, 'mistakes')
      const explanationText = extractTextFromInsideTags(completionStream, 'explanation')
      if(indexOfProcessingMessage === null) throw new Error(`no index of processing message`)
      setMessagesData(pMD => [...pMD.with(indexOfProcessingMessage, { ...pMD[indexOfProcessingMessage], mistakes: mistakesText, correctedMessage: correctedMessageText, explanation: explanationText })])
    }
    processCorrectionStream(completion)
  }, [completion])

  async function createFlashcardsFromXML(XMLFlashcards: string) {
    console.log('createFlashcards from XML hit')
    const createClozeCard = async (clozeCardXml: Element) => {
      console.dir(clozeCardXml)
      let foreignSentenceClozed = ''
      const foreignSentenceBase = clozeCardXml.textContent
      if(!foreignSentenceBase) throw new Error(`couldnt get foreignSentenceBase from xml`)
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

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(XMLFlashcards, "text/xml");
    let flashcardsPromises: (Promise<Flashcard>)[] = []

    xmlDoc.querySelectorAll('cloze').forEach(clozeCardXml => {

      flashcardsPromises.push(createClozeCard(clozeCardXml))
    })

    const flashcards = await Promise.all(flashcardsPromises);

    return flashcards
  }


  useEffect(() => {
    console.log('ics ue')
    if(isCorrectionStreaming || indexOfProcessingMessage === null) return
    // ON FINISH
    serializeMessagesData()
    const makeFlashcards = async () => {
      console.log('processing xml flashcards for ', indexOfProcessingMessage)

      const resp = await fetch(`/api/getXMLFlashcards`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pupilMessage: messages[indexOfProcessingMessage].content,
          correctedMessage: messagesData[indexOfProcessingMessage].correctedMessage,
          mistakes: messagesData[indexOfProcessingMessage].mistakes,
          language: targetLanguage
        })
      }).then(resp => resp.json())
      const XMLFlashcards = resp.XMLFlashcards
      const _flashcards = await createFlashcardsFromXML(XMLFlashcards)
      addFlashcards(_flashcards)
    }
    makeFlashcards()

  }, [isCorrectionStreaming])


  useEffect(() => {
    scrollToBottom();
    if (isAssistantStreaming) return  // process latest message. think of as onFinish()
    // ON FINISH:
    serializeMessages()


    const processMessage = async (message: Message, index: number) => {
      if (message.role !== 'user') return
      console.log('setting index of processing message', index)
      setIndexOfProcessingMessage(index)
      // if no instructor message just make some shit up
      const instructorMessage = messages.at(-2)?.content ?? LANGUAGE_TO_HELLO[targetLanguage]

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

      setMessagesData(pM => {
        const newArr = [...pM]
        newArr[index] = { ...pM[index], didMakeMistakes }
        return newArr
      })

      if (didMakeMistakes) correctionComplete(``, {
        body: {
          language: targetLanguage,
          pupilMessage: message.content,
          instructorMessage
        }
      })

    }
    if (messages.length) processMessage(messages[messages.length - 1], messages.length - 1)
  }, [messages, isAssistantStreaming, targetLanguage]);

  const handleSendOrStop: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    setHasStarted(true)
    if (isAssistantStreaming) {
      console.log("stop form event")
      stopChat()
      setIsAssistantStreaming(false)
      setAudioQueue([])
      audioStopped.current = true
    } else {
      console.log("send form event")
      audioStopped.current = false
      handleSubmit(e)
    }
  }

  const playAudio = async (message: string): Promise<HTMLAudioElement> => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      body: JSON.stringify({
        "input": message
      })
    })
    const blob = await res.blob()
    const blobURL = URL.createObjectURL(blob)
    const a = new Audio(blobURL)
    a.onended = () => setIsAudioPlaying(false);
    a.play()
    setIsAudioPlaying(true)
    return a;
  }

  const pauseAudio = (audio: HTMLAudioElement) => {
    audio.pause()
    setIsAudioPlaying(false)
  }

  return (
    <Div100vh>
      <main className="flex h-full flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col max-w-[1200px] w-full h-full rounded-md p-2 lg:p-6 text-sm lg:text-base'>
          <header className='chatbot-header pb-6'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2'>
                <Image src={bricks} alt='' className='w-10' />
                <h1 className='chatbot-text-primary text-xl lg:text-2xl font-medium'>Brick Bot</h1>
              </div>
              <button
                className='text-sm lg:text-base'
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
                <p className="chatbot-text-secondary-inverse text-sm lg:text-base mt-2 lg:mt-4">
                  Chatting with Brick Bot is awesome! You simply have a conversation in your desired target language, it adjusts to your level, and generates Anki cards for you to study based on your mistakes.
                </p>
                <div className='flex flex-col lg:flex-row justify-between'>
                  <div className='flex flex-col flex-wrap'>
                    {!hasStarted ?
                      <div className="mt-1">
                        <label htmlFor="language-select" className="chatbot-text-primary">Choose a language:</label>
                        <select
                          id="language-select"
                          value={targetLanguage}
                          onChange={(e) => setTargetLanguage(e.target.value as keyof typeof LANGUAGE_TO_EXAMPLE_PROMPTS)}
                          className="chatbot-input ml-2"
                        >
                          <option value="German">German</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="Chinese">Chinese</option>
                          <option value="Portuguese">Portuguese</option>
                        </select>
                      </div>
                      : null}
                  </div>
                  <button className='self-start bg-red-300 rounded-md p-1' onClick={() => {
                    stopChat()
                    setMessages([])
                    setMessagesData([])
                    resetStore()
                  }}>
                    Reset chat
                  </button>

                </div>
              </>
            )}
          </header>
          {hasHydrated ?
            <div className='flex-1 flex-grow relative overflow-y-auto my-4 lg:my-6 flex flex-col justify-stretch'>
              <div id='messages parent' className='w-full overflow-x-hidden flex-grow z-10 relative'>
                {messages.map((message, index, messages) => isEven(index) ? (<BubblePair ref={messagesEndRef} key={`message-pair-${index}`} user={{ content: message, messageData: messagesData[index], playAudio, pauseAudio, isAudioPlaying }} assistant={{ content: messages[index + 1], messageData: messagesData[index + 1], playAudio, pauseAudio, isAudioPlaying }} />) : null)}



                {!hasStarted &&
                  <div id='example prompts container' className='flex flex-col absolute bottom-0 max-w-[60%] p-2'>
                    Quick start by clicking one of these prompts!
                    <div id='example prompts' className='flex flex-row flex-wrap'>
                      {Array(4).fill(null).map((_, index) => (
                        <ExamplePrompt key={index} text={LANGUAGE_TO_EXAMPLE_PROMPTS[targetLanguage][index]} onClick={() => {
                          setHasStarted(true)
                          append({ content: LANGUAGE_TO_EXAMPLE_PROMPTS[targetLanguage][index], role: 'user' })
                        }} />
                      ))}
                    </div>
                  </div>
                }
              </div>
              <div id='blue background' className='border-l-2 border-black absolute right-0 top-0 bottom-0' style={{ width: 'calc(40% - 0.6rem)' }}>
              </div>


              <div id='bottom bar' className='flex flex-row z-10'>

                <form className='flex h-[40px] gap-2 w-[60%] min-w-[60%] mr-2' onSubmit={handleSendOrStop}>
                  <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' onKeyDown={(e) => {
                  }} />
                  {!isAssistantStreaming ? (
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

                <div className='flex justify-evenly flex-grow items-center bg-[var(--text-primary)] border-[var(--text-primary)] border-x-2'>
                  <div className=''>
                    Flashcards created: {flashcards.length}
                  </div>
                  <button className='bg-gray-300 rounded-md p-1' onClick={() => {
                    const url = `http://localhost:10000/export-flashcards?language=${targetLanguage}`
                    // const url = `https://api.brick.bot/export-flashcards?language=${targetLanguage}`
                    // const url = `https://brick-bot-fastapi.onrender.com/export-flashcards?language=${targetLanguage}`
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
              </div>
            </div>
            : <div className='h-full justify-center items-center text-center relative'>
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
                <LoadingBrick />
              </div>
            </div>
          }


        </section>
      </main>
    </Div100vh>
  )
}

function ExamplePrompt(props: { text: string, onClick: () => void }) {
  return (
    <button onClick={props.onClick} className='bg-[var(--background-soft)] text-[var(--text-primary-main)] rounded-md m-2 p-2'>
      {props.text}
    </button>
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
