import Link from "next/link";
import { forwardRef, JSXElementConstructor, useMemo, RefObject, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"
import { MessageData } from "../app/page";
import soundOnIcon from "../public/assets/soundOnIcon.svg"
import soundOffIcon from "../public/assets/soundOffIcon.svg"
import Image from 'next/image'
import LoadingBrick from "./LoadingBrick";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi";
import { FaGear } from "react-icons/fa6";
import {Tooltip as ReactTooltip} from 'react-tooltip'
import { useBrickStore } from "../lib/store";
import mixpanel from 'mixpanel-browser';
import { debounce } from "lodash"

interface BubbleProps {
  content: {
    role: string;
    content: string
    [key: string]: any;
  };
  messageData: MessageData;
  handleAudio?: () => void
  isPlaying: boolean
  isLoading: boolean
  language: string
}

const Bubble = forwardRef<HTMLDivElement, BubbleProps>(({ content, messageData, handleAudio, isPlaying, isLoading, language }, ref) => {

  Bubble.displayName = 'Bubble';
  const { role } = content;
  const isUser = role === "user"
  
  const [tokenizedMessage, setTokenizedMessage] = useState<string[]>([])
  const [tokenizedMessageUpdated, setTokenizedMessageUpdated] = useState(false)
  const tokenizeMessage = async (input_str: string, language: string): Promise<string[]> => {
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

  // only call TokenizeMessage every 500 ms to reduce latency
  const debouncedTokenizeMessage = useMemo(() => debounce(async (input_str: string, language: string) => {
    const tokenized = await tokenizeMessage(input_str, language);
    setTokenizedMessage(tokenized);
    setTokenizedMessageUpdated(true);
  }, 500), []);

  useEffect(() => {
    setTokenizedMessageUpdated(false)
    if (!isUser) {
      debouncedTokenizeMessage(content.content, language)
    }
  }, [content.content, isUser, debouncedTokenizeMessage])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const tooltipDisplayCount = useBrickStore(state => state.tooltipDisplayCount)
  const incrementTooltipDisplayCount = useBrickStore(state => state.incrementTooltipDisplayCount)

  const didMakeMistakes = typeof messageData === 'undefined' || messageData === null ? null : messageData.didMakeMistakes

  useEffect(() => console.log('navigator useragent', navigator.userAgent), [])
  return (
    <div ref={ref} className={`pb-[7px] flex mt-4 lg:mt-6 ${isUser ? 'justify-end' : ''}`} data-tooltip-id="translateHint">
{ (!isUser && tooltipDisplayCount < 2) &&  <ReactTooltip id="translateHint" place="top" afterHide={incrementTooltipDisplayCount}>
        Tip: Select any text to see its translation!
      </ReactTooltip>}
      {!isUser && typeof window !== 'undefined' && window.innerWidth > 600 && (
        <button onClick={handleAudio} className='flex-shrink-0 mr-1' disabled={isLoading}>
          {!isLoading ? <Image src={isPlaying ? soundOffIcon : soundOnIcon} alt="Sound Off / On Icon" /> : <LoadingIndicator />}
        </button>
      )}
      <div className='flex flex-row items-center'>
        {
          isUser ? <>

            {/*  */}
            {isModalOpen && didMakeMistakes && (
              <div className="fixed inset-0 z-50 flex justify-center items-center" onClick={() => setIsModalOpen(false)}>
                <div className="bg-gray-100 bg-opacity-90 border border-gray-300 rounded-lg shadow-lg p-6 relative" style={{ width: 'calc(100% - 2rem)', maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-0 right-0 mt-4 mr-4 text-gray-600 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <strong className="text-lg">Corrected Message:</strong>
                  <p className="text-md mt-2">{messageData?.correctedMessage ? <>{messageData.correctedMessage}</> : <LoadingIndicator />}</p>
                  <strong className="text-lg mt-4 inline-block">Mistakes:</strong>
                  {messageData?.mistakes ?
                    <Markdown
                      className="markdown text-md grid grid-cols-1 gap-2 mt-2"
                      remarkPlugins={[remarkGfm]}
                    >
                      {messageData.mistakes}
                    </Markdown> : <LoadingIndicator />}
                </div>
              </div>
            )}




            {/*  */}


            {didMakeMistakes === null ? (
              <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2 animate-spin">
                  <FaGear className="h-5 w-5" />
              </div>
            ) : (
              <button
                disabled={!didMakeMistakes}
                className={`${didMakeMistakes
                  ? 'bg-red-500 hover:opacity-80'
                  : 'bg-green-500'
                  } h-6 w-6 rounded-full focus:outline-none transition duration-200 flex items-center justify-center mr-2`}
                onClick={() => {
                  setIsModalOpen(!isModalOpen)
                  mixpanel.track('modal_button_event', {isModalOpen})
                }}
              >
                {didMakeMistakes ? (
                    <HiOutlineQuestionMarkCircle className="h-6 w-6" />
                ) : null}
              </button>
            )}


          </> : null}
        <div className={`rounded-[10px] ${isUser ? 'rounded-br-none text-right text-[var(--text-primary)] bg-[var(--background-bubble-primary)]' : 'rounded-bl-none text-[var(--text-secondary-inverse)] bg-[var(--background-bubble-secondary)]'} p-2 lg:p-4 leading-[1.65] pr-9 relative self-start`}>
          {/* <Markdown
            className="markdown grid grid-cols-1 gap-3"
            remarkPlugins={[remarkGfm]}
          > {'\u200B' + content.content} </Markdown>
          */}
          {/* make all words in the assistant's message clickable. note: this can not be used with markdown formatting. */}
          {'\u200B'}
          {/* if tokenizedMessage is not ready, just render unclickable content */}
          {isUser || !tokenizedMessageUpdated ? content.content : (
            tokenizedMessage.map((token, index, tokensArray) => {
              const isFirstChunk = index === 0;
              const lastToken = tokensArray[index-1]
              const lastCharOfLastToken = lastToken?.[lastToken.length-1]
              const isPrecededByDashOrApostropheOrParenthese = (lastCharOfLastToken === "(" || lastCharOfLastToken === "-" || lastCharOfLastToken === "'" || token[0] === "-" || token[0] === "'" || token[0] === "(")
              console.log("tokens array: " + tokensArray)
              return (
                // if token is a word, make it clickable
                token.match(/[a-zA-ZÀ-ž]+/) ? 
                  <>
                    {isFirstChunk || isPrecededByDashOrApostropheOrParenthese ? 
                    // add unhighlightable space in front if not first chunk/preceded by dash/apostrophe
                      null : 
                      <span> </span>}
                    <span key={index} onClick={() => console.log(token)} style={{ cursor: 'pointer' }} className="hover:bg-yellow-200">{token}</span> 
                  </> 
                  : <span key={index}>{token}</span>
              )
            })
          )}
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

const LoadingIndicator = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>;
