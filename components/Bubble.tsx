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
  playAudio?: (message: string) => Promise<HTMLAudioElement>;
  pauseAudio?: (audio: HTMLAudioElement) => void;
  isAudioPlaying?: boolean
  setIsAudioPlaying?: (bool: boolean) => void;
}

const Bubble = forwardRef<HTMLDivElement, BubbleProps>(({ content, messageData, playAudio, pauseAudio, isAudioPlaying, setIsAudioPlaying }, ref) => {
  Bubble.displayName = 'Bubble';
  const { role } = content;
  const isUser = role === "user"
  const bubbleAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!isUser) return
    // console.log('messageData update on ')
    // console.log(messageData)
  }, [messageData])

  const handleAudio = async () => {
    if (isAudioPlaying) {
      // need to make sure audio has been set
      if (bubbleAudio.current) pauseAudio?.(bubbleAudio.current);
    } else {
      setIsAudioPlaying?.(true)
      bubbleAudio.current = await playAudio?.(content.content) ?? null;
    }
  };

  const didMakeMistakes = typeof messageData === 'undefined' || messageData === null ? null : messageData.didMakeMistakes


  return (
    <div ref={ref} className={`pb-[7px] flex mt-4 lg:mt-6 ${isUser ? 'justify-end' : ''}`}>
      {!isUser ?
        <button onClick={handleAudio} className='flex-shrink-0'>
          <Image src={isAudioPlaying ? soundOffIcon : soundOnIcon} alt="Sound Off Icon" />
        </button>
        : null}
        <div className='flex flex-row'>
        {
          isUser ? <>
            <div className="p-2 lg:p-4">
              <div className="inline-block relative w-4 mr-1">
                <span>&nbsp;</span>
                <div className={`${didMakeMistakes === null ? 'bg-yellow-500' : didMakeMistakes ? 'bg-red-500' : 'bg-green-500'} h-4 w-4 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
              </div>
              <strong>{messageData?.correctedMessage}</strong>
            </div>
            <div>
              <Markdown
                className="markdown grid grid-cols-1 gap-3"
                remarkPlugins={[remarkGfm]}
              >
                {messageData?.correctedMessage && messageData.mistakes}
              </Markdown>
            </div> 
            </> : null}
      <div className={`rounded-[10px] ${isUser ? 'rounded-br-none text-right text-[var(--text-primary)] bg-[var(--background-bubble-primary)]' : 'rounded-bl-none text-[var(--text-secondary-inverse)] bg-[var(--background-bubble-secondary)]'} p-2 lg:p-4 leading-[1.65] pr-9 relative self-start`}>
        <Markdown
          className="markdown grid grid-cols-1 gap-3"
          remarkPlugins={[remarkGfm]}
        >
          {content.content}
        </Markdown>
      </div>
      </div>
    </div>
  )

})

export default Bubble;

export const BubblePair = forwardRef<HTMLDivElement, { user: BubbleProps, assistant: BubbleProps | undefined }>(({ user, assistant }, ref) => {
  BubblePair.displayName = 'BubblePair';
  const didMakeMistakes = typeof user.messageData === 'undefined' || user.messageData === null ? null : user.messageData.didMakeMistakes

  useEffect(() => {
    // console.log('user updated: ')
    // console.log(user.messageData)

    // console.log('rendering bubble pair with user', user)
    // console.log('and assistant', assistant)
  }, [user])



  return (<div className="flex flex-row">
    <div className="flex flex-col max-w-[60%] w-[60%] min-w-[60%] mr-2">
      <Bubble ref={ref} {...user} />
      {assistant?.content && <Bubble ref={ref} {...assistant} />}
    </div>

    <div className="flex-grow flex">
      <div className={`mt-4 lg:mt-6 p-1`}>

        <div className="p-2 lg:p-4">
          <div className="inline-block relative w-4 mr-1">
            <span>&nbsp;</span>
            <div className={`${didMakeMistakes === null ? 'bg-yellow-500' : didMakeMistakes ? 'bg-red-500' : 'bg-green-500'} h-4 w-4 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
          </div>
          <strong>{user.messageData?.correctedMessage}</strong>
        </div>
        <div>
          <Markdown
            className="markdown grid grid-cols-1 gap-3"
            remarkPlugins={[remarkGfm]}
          >
            {user.messageData?.correctedMessage && user.messageData.mistakes}
          </Markdown>
        </div>


      </div>

    </div>
  </div>)
})