"use client";
import { FormEvent, FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import Bubble, { BubblePair } from '../components/Bubble'
import { useChat, Message, CreateMessage, useCompletion } from 'ai/react';
import useConfiguration from './hooks/useConfiguration';
import { GSP_NO_RETURNED_VALUE } from 'next/dist/lib/constants';
import Div100vh, { measureHeight } from 'react-div-100vh';
import Image from 'next/image'
import bricks from "../public/assets/bricks.svg"
import { useBrickStore } from '../lib/store';
import { BasicFlashcard, ClozeFlashcard, Flashcard } from '../lib/types';
import LoadingBrick from '../components/LoadingBrick';
import { debounce } from "lodash"
import { Tooltip as ReactTooltip } from "react-tooltip";
import { toast } from 'react-toastify'
import { createChatSystemPrompt } from '../lib/prompts';

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
  ],
  "Italian": [
    "Ciao, sono un principiante, ma sono entusiasta di imparare!",
    "Buongiorno! Non vedo l'ora di migliorare il mio italiano.",
    "Ciao! Sono curioso di scoprire quanto imparerò oggi.",
    "Sono pronto per saperne di più sulla lingua italiana.",
  ],
  "Russian": [
    "Привет, я начинающий, но очень рад учиться!",
    "Добрый день! С нетерпением жду, когда смогу улучшить свой русский.",
    "Привет! Интересно, сколько я сегодня узнаю.",
    "Я готов узнать больше о русском языке.",
  ]
}

const EXAMPLE_TOPICS = ['Food and Cuisine', 'Travel and Adventure', 'Music and Entertainment', 'Sports and Fitness']


export type MessageData = {
  role: "user" | "assistant"
  didMakeMistakes: boolean | null,
  mistakes?: string,
  correctedMessage?: string,
  explanation?: string
}

export default function Home() {

  const { append, messages, input, handleInputChange, setMessages, reload, stop: stopChat, setInput } = useChat({
    onResponse: () => setIsAssistantStreaming(true),
    // onFinish does not have access to the latest messages[], so we can't do useful operations on the whole [] :( so instead we set streaming to false and do our operations in a useEffect when streaming is false
    onFinish: () => setIsAssistantStreaming(false)
  });

  const messagesData = useBrickStore(state => state.messagesData)
  const setMessagesData = useBrickStore(state => state.setMessagesData)
  const zustandMessages = useBrickStore(state => state.zustandMessages)
  const setZustandMessages = useBrickStore(state => state.setZustandMessages)
  const flashcardsGoal = useBrickStore(state => state.flashcardsGoal)
  const setFlashcardsGoal = useBrickStore(state => state.setFlashcardsGoal)

  const [hasHydrated, setHasHydrated] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaContainerRef = useRef<HTMLDivElement | null>(null);


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
  const [topic, setTopic] = useState('')
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


  const selectionBoxRef = useRef<HTMLDivElement>(null)
  const [selectionBoxActive, setSelectionBoxActive] = useState(false)
  const [isSelectionTranslationLoading, setIsSelectionTranslationLoading] = useState(false)
  const [selectionTranslation, setSelectionTranslation] = useState('')

  const repositionSelectionBox = () => {
    console.log('reposition selection Box')
    const selection = document.getSelection()
    if (selection && selection.rangeCount > 0) {
      const selectionBox = selectionBoxRef.current
      if (!selectionBox) return
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Get the coordinates of the selected text
      const x = rect.left + window.scrollX;
      const y = rect.top + window.scrollY;
      selectionBox.style.top = `${y}px`
      selectionBox.style.left = `${x}px`
    }
  }

  useEffect(() => console.log('has Started', hasStarted), [hasStarted])


  const handleSelectionChange = async () => {
    console.log('handle selection change')
    // Your logic here
    // console.log('Selection changed');
    const selection = document.getSelection()
    const selectionString = selection?.toString()
    console.log(selection, selectionString)
    console.log(!Boolean(selectionString))
    const _hasStarted = useBrickStore.getState().hasStarted // bc normally getting it doesnt work and i tried a callback and it didnt work
    if (!Boolean(selectionString) || !_hasStarted) {
      setSelectionBoxActive(false)
      setSelectionTranslation('')
      return
    }


    setSelectionBoxActive(true)
    repositionSelectionBox()
    setIsSelectionTranslationLoading(true)
    const resp = await fetch(`/api/getEnglishTranslation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: targetLanguage,
        sentence: selectionString
      })
    }).then(resp => resp.json())
    const english = resp.englishTranslation
    setSelectionTranslation(english)
    setIsSelectionTranslationLoading(false)
  }

  const addSelectionFlashcard = () => {
    const flashcard: BasicFlashcard = {
      front: document.getSelection()?.toString() ?? '',
      back: selectionTranslation
    }
    addFlashcards([flashcard])
    toast(`Flashcard added!`, { position: "top-right", type: "success" });
  }


  // load messagesData on initial render
  useEffect(() => {
    useBrickStore.persist.onFinishHydration((s) => {
      serializeMessages()
      setHasHydrated(true)
    })
    useBrickStore.persist.rehydrate()

    const debouncedSelectionChange = debounce(handleSelectionChange, 300)

    if (typeof window !== 'undefined') {
        document.addEventListener("selectionchange", debouncedSelectionChange);
        window.addEventListener("resize", repositionSelectionBox);
    }

    return () => {
        document.removeEventListener('selectionchange', debouncedSelectionChange);
        window.removeEventListener("resize", repositionSelectionBox);
    }
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
      if (indexOfProcessingMessage === null) throw new Error(`no index of processing message`)
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
      if (!foreignSentenceBase) throw new Error(`couldnt get foreignSentenceBase from xml`)
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

      const resp = await fetch(`/api/getEnglishTranslation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: targetLanguage,
          sentence: foreignSentenceBase
        })
      }).then(resp => resp.json())

      const englishTranslation = resp.englishTranslation
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
    if (isCorrectionStreaming || indexOfProcessingMessage === null) return
    // ON FINISH
    const makeFlashcards = async () => {
      // FIXME TODO! this is called multiple times for the same indexOfProcessingMessage, even when the body data is not ready, causing errors on both frontend and backend, which expects that data to be ready
      console.log('processing xml flashcards for ', indexOfProcessingMessage)
      const body = {
        pupilMessage: messages[indexOfProcessingMessage].content,
        correctedMessage: messagesData[indexOfProcessingMessage].correctedMessage,
        mistakes: messagesData[indexOfProcessingMessage].mistakes,
        language: targetLanguage
      }
      console.log('full body: ', body)
      const resp = await fetch(`/api/getXMLFlashcards`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }).then(resp => resp.json())
      const XMLFlashcards = resp.XMLFlashcards
      const _flashcards = await createFlashcardsFromXML(XMLFlashcards)
      addFlashcards(_flashcards)
    }
    if (messagesData[indexOfProcessingMessage]?.didMakeMistakes) makeFlashcards()

  }, [isCorrectionStreaming, completion])

  useEffect(() => {
    // console.log('messages / messagesData')
    // console.log(messages)
    // console.log(messagesData)
  }, [messages, messagesData])


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

      const didMakeMistakes = resp?.didMakeMistakes === 'YES' ? true : false

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

  const handleSendOrStop = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      append({ content: input, role: 'user' }, { options: { body: { language: targetLanguage, topic } } })
      setInput('')
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
    // if audio is streaming in, stop it
    if (audioStopped.current === false) {
      setAudioQueue([])
      audioStopped.current = true
    } else {
      audio.pause()
      setIsAudioPlaying(false)
    }
  }
  useEffect(() => {
    if (textareaRef.current == null) return
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [input])


  const beginChat = (_topic: string) => {
    setHasStarted(true)
    if (window.innerWidth < 600) setIsHeaderOpen(false);

    append({ role: 'system', content: createChatSystemPrompt(targetLanguage, _topic) }, { options: { body: { language: targetLanguage, topic: _topic } } })
    setTopic(_topic)
  }

  const handleDownloadFlashcards = () => {
    setIsDownloading(true);
    // const url = `http://localhost:10000/export-flashcards?language=${targetLanguage}`
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
        setIsDownloading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        setIsDownloading(false);
      });
  }
  const [showResetConfirmationModal, setShowResetConfirmationModal] = useState(false)

  return (
    <Div100vh>
      <main className="flex h-full flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col max-w-[800px] w-full h-full rounded-md p-2 lg:p-6 text-sm lg:text-base'>
          {hasHydrated ? <>
            <header className='chatbot-header'>
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
                  )}
                </button>
              </div>
              {isHeaderOpen && (
                <>
                  <p className="chatbot-text-secondary-inverse text-sm lg:text-base mt-2 lg:mt-4">
                    Chatting with Brick Bot is awesome! You simply have a conversation in your desired target language, it adjusts to your level, and generates Anki cards for you to study based on your mistakes.
                  </p>
                  <div className='flex flex-col lg:flex-row justify-between'>

                    {hasStarted && (
                      <button className='mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded' onClick={() => {
                        setShowResetConfirmationModal(true)
                      }}>
                        Reset Chat
                      </button>
                    )}

                    <button
                      className={`mt-4 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform ${flashcards.length === 0 || isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                      onClick={handleDownloadFlashcards}
                      disabled={flashcards.length === 0 || isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <LoadingBrick className='w-6 h-6 animate-spin' />
                          <span>Preparing...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Download Flashcards!</span>
                        </>
                      )}
                    </button>

 
                  </div>
                </>
              )}
              <div className="relative w-full bg-gray-200 h-6 mt-4 flex items-center">
                <div className="bg-blue-600 h-6" style={{ width: `${(flashcards.length / flashcardsGoal) * 100}%` }}></div>
                <p className="absolute w-full text-center text-sm">{`Flashcards generated: ${flashcards.length}/${flashcardsGoal}`}</p>
              </div>
              {showResetConfirmationModal && (
                <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                  <div className=" rounded-lg z-50 bg-gray-50 bg-opacity-90 border border-gray-300 shadow-lg p-6 relative">
                    <p>Are you sure you want to reset the chat?</p>
                    <div className="flex space-x-2 mt-4">
                      <button className="flex-grow bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded" onClick={() => setShowResetConfirmationModal(false)}>Cancel</button>
                      <button className="flex-grow bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={() => {
                        stopChat()
                        setMessages([])
                        resetStore()
                        setShowResetConfirmationModal(false)
                      }}>Reset</button>
                    </div>
                  </div>
                </div>
              )}
            </header>
            {hasStarted ?
            
              <div className='flex-1 flex-grow relative flex flex-col justify-stretch overflow-y-auto'>
                <div id='messages parent' className='w-full overflow-x-hidden flex-grow z-10 relative' onScroll={repositionSelectionBox}>
                  {messages.map((message, index) => (index > 0) ?
                    <Bubble
                      ref={messagesEndRef}
                      key={`message-${index}`}
                      content={message}
                      messageData={messagesData[index]}
                      playAudio={playAudio}
                      pauseAudio={pauseAudio}
                      isAudioPlaying={isAudioPlaying}
                      setIsAudioPlaying={setIsAudioPlaying}
                    /> : null
                  )}
                </div>



                <div id='bottom bar' className='flex flex-row z-10 relative w-full'>

                  <form className='flex items-end relative gap-2 w-full' onSubmit={(e) => e.preventDefault()}>
                    <div ref={textareaContainerRef} className='relative flex flex-grow items-end'>
                      <textarea ref={textareaRef}
                        onChange={(e) => {
                          if (textareaRef.current === null || textareaContainerRef.current === null) return
                          textareaRef.current.style.height = "auto";
                          textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
                          handleInputChange(e)
                        }}
                        value={input}
                        rows={1}
                        className='chatbot-input flex-1 outline-none rounded-md p-2 resize-none m-0 w-full overflow-hidden bg-[var(--text-primary)]'
                        placeholder='Send a message...'
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && input.trim() !== '') {
                            handleSendOrStop(e)
                          }
                        }}
                        style={{ height: '2.5rem' }}
                      />
                    </div>

                    <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 h-10'>
                      {!isAssistantStreaming ? <SendIcon /> : <StopIcon />}
                      <span className='hidden font-semibold text-sm ml-2'>{!isAssistantStreaming ? "Send" : "Stop"}</span>
                    </button>

                  </form>


                </div>
              </div>
              :
              <div id='start screen' className='flex-1 flex-grow flex flex-col items-center justify-center'>
                <div className='rounded-lg shadow-md p-4 bg-gray-100 max-w-md'>
                  <div className="flex flex-row justify-between items-center mt-3">
                    <label htmlFor="language-select" className="block text-lg font-medium text-gray-700">Choose a language:</label>
                    <select
                      id="language-select"
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value as keyof typeof LANGUAGE_TO_EXAMPLE_PROMPTS)}
                      className=" pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="German">German</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Italian">Italian</option>
                      <option value="Russian">Russian</option>
                    </select>
                  </div>

                  <div className="flex flex-row justify-between items-center mt-3">
                    <label htmlFor="number-select" className="block text-lg font-medium text-gray-700"># of flashcards</label>
                    <input id='number-select' type='number' value={flashcardsGoal} onChange={(e) => setFlashcardsGoal(e.target.valueAsNumber)} className='px-3 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md max-w-[147px]' />
                  </div>



                  <div className='flex flex-row flex-wrap justify-between items-center mt-3'>
                    <label htmlFor="topic-select" className="text-lg font-medium text-gray-700">Select a topic or enter your own!</label>


                    <div id='example prompts' className='flex flex-row flex-wrap justify-around'>
                      {Array(4).fill(null).map((_, index) => (
                        <ExamplePrompt key={index} text={EXAMPLE_TOPICS[index]} onClick={() => beginChat(EXAMPLE_TOPICS[index])} />
                      ))}
                    </div>
                    <div className="flex flex-row justify-between items-center mt-3 w-full">
                      <input id='custom-topic-input' type='text' placeholder='Enter your own topic' className='px-3 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md flex-grow' />
                      <button onClick={() => {
                        const inputElement = document.getElementById('custom-topic-input') as HTMLInputElement;
                        if (inputElement && inputElement.value) {
                          beginChat(inputElement.value)
                          inputElement.value = ''; // Clear the input after sending
                        }
                      }} className='ml-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md'>
                        <SendIcon color='#374151' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </> :
            <div className='h-full justify-center items-center text-center relative'>
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
                <LoadingBrick />
              </div>
            </div>
          }

        </section>
      </main>
      <div ref={selectionBoxRef} className={`bg-[var(--background-soft)] text-[var(--text-primary-inverse)] max-w-[50%] absolute z-10 p-3 mb-1 -translate-y-[calc(100%+8px)] rounded-md ${selectionBoxActive ? '' : 'invisible'}`}>
        {!isSelectionTranslationLoading ?
          <div className='select-none flex justify-between items-center'>
            {selectionTranslation}
            <button onClick={addSelectionFlashcard} data-tooltip-id="add-flashcard" className='hover:bg-gray-300 text-[var(--text-primary-main)] rounded-full ml-2 p-1.5 transition duration-300 ease-in-out transform hover:scale-110 hover:shadow-xl'>
              <svg className={`w-5 h-5`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>
          : <LoadingBrick className='w-10 h-10 animate-spin' />}
      </div>
      <ReactTooltip
        id="add-flashcard"
        place="top"
        content="create flashcard"
        className='z-50'
      />
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



function SendIcon({ color = "#000" }) { // A better default color (blue)
  return <svg width="20" height="20" viewBox="0 0 20 20" fill={color}>
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
function PlusIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
  );
}
