import Link from "next/link";
import { forwardRef, JSXElementConstructor, useMemo, RefObject, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"
import { MessageData } from "../app/page";
import soundOnIcon from "../public/assets/soundOnIcon.svg"
import soundOffIcon from "../public/assets/soundOffIcon.svg"
import Image from 'next/image'
interface BubbleProps {
  content: {
    role: string;
    content: string
    [key: string]: any;
  };
  messageData: MessageData;
}

const Bubble = forwardRef<HTMLDivElement, BubbleProps>(({ content, messageData }, ref) => {
  Bubble.displayName = 'Bubble';
  const { role } = content;
  const isUser = role === "user"
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const audio = useRef(null)

  useEffect(() => {
    if (!isUser) return
    console.log('messageData update on ')
    console.log(messageData)
  }, [messageData])

  // useEffect(() => {
  //   if(content.content) console.log(JSON.stringify(content.content))
  // }, [content])

  // play audio for this message's content
  const playAudio = async () => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      body: JSON.stringify({
        "input": content.content
      })
    })
    const blob = await res.blob()
    const blobURL = URL.createObjectURL(blob)
    const a = new Audio(blobURL)
    audio.current = new Audio(blobURL)
    audio.current.onended = () => setIsAudioPlaying(false);
    audio.current.play()
    setIsAudioPlaying(true)
  }

  const pauseAudio = () => {
    audio.current.pause()
    setIsAudioPlaying(false)
  }

  return (
    <div ref={ref} className={`pb-[7px] flex mt-4 lg:mt-6 ${isUser ? 'justify-end' : ''}`}>
      {!isUser ?
        <button onClick={isAudioPlaying ? pauseAudio : playAudio} className='flex-shrink-0'>
          <Image src={isAudioPlaying ? soundOffIcon : soundOnIcon} alt="Sound Off Icon" />
        </button>
        : null}
      <div className={`rounded-[10px] ${isUser ? 'rounded-br-none text-right text-[var(--text-primary)] bg-[var(--background-bubble-primary)]' : 'rounded-bl-none text-[var(--text-secondary-inverse)] bg-[var(--background-bubble-secondary)]'} p-2 lg:p-4 leading-[1.65] pr-9 relative self-start`}>
        <Markdown
          className="markdown grid grid-cols-1 gap-3"
          remarkPlugins={[remarkGfm]}
        >
          {content.content}
        </Markdown>
      </div>
    </div>
  )

})

export default Bubble;

export const BubblePair = forwardRef<HTMLDivElement, { user: BubbleProps, assistant: BubbleProps | undefined }>(({ user, assistant }, ref) => {
  BubblePair.displayName = 'BubblePair';
  const didMakeMistakes = typeof user.messageData === 'undefined' || user.messageData === null ? null : user.messageData.didMakeMistakes

  useEffect(() => {
    console.log('user updated: ')
    console.log(user.messageData)
    // console.log('rendering bubble pair with user', user)
    // console.log('and assistant', assistant)
  }, [user])

  

  return (<div className="flex flex-row">
    <div className="flex flex-col max-w-[60%] w-[60%] min-w-[60%] mr-2">
      <Bubble ref={ref} {...user}/>
      {assistant?.content && <Bubble ref={ref} {...assistant}/>}
    </div>

    <div className="flex-grow flex">
      <div className={`mt-4 lg:mt-6 p-1`}>

        <div className="p-2 lg:p-4">
          <div className="inline-block relative w-4 mr-1">
            <span>&nbsp;</span>
            <div className={`${didMakeMistakes === null ? 'bg-yellow-500' : didMakeMistakes ? 'bg-red-500' : 'bg-green-500'} h-4 w-4 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
          </div>
          <strong>{user.messageData.correctedResponse}</strong>
        </div>
        <div>
          <Markdown
            className="markdown grid grid-cols-1 gap-3"
            remarkPlugins={[remarkGfm]}
          >
            {user.messageData.correctedResponse && user.messageData.mistakes}
          </Markdown>
        </div>


      </div>

    </div>
  </div>)
})