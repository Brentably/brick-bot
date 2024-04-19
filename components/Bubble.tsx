import Link from "next/link";
import { forwardRef, JSXElementConstructor, useMemo, RefObject, useEffect, useRef, useState, createRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"
import { MessageData } from "../lib/types";
import soundOnIcon from "../public/assets/soundOnIcon.svg"
import soundOffIcon from "../public/assets/soundOffIcon.svg"
import Image from 'next/image'
import LoadingBrick from "./LoadingBrick";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi";
import { FaGear } from "react-icons/fa6";
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { useBrickStore } from "../lib/store";
import mixpanel from 'mixpanel-browser';
import { debounce } from "lodash"


interface BubbleProps {
  messageData: MessageData;
  handleAudio?: () => void
  isPlaying: boolean
  isLoading: boolean
  handleTokenClick: (word: string, element: React.RefObject<HTMLSpanElement>) => void
  // getTokenPositionValues: (token: string) => [number, number]
}

export const getTokenPositionValues = (token: string) => {
  const [x, y] = [0, 0]
  return [x, y]
}

const Bubble = forwardRef<HTMLDivElement, BubbleProps>(({ messageData, handleAudio, isPlaying, isLoading, handleTokenClick }, ref) => {

  Bubble.displayName = 'Bubble';
  const { role } = messageData;
  const isUser = role === "user"

  const [isModalOpen, setIsModalOpen] = useState(false)
  const tooltipDisplayCount = useBrickStore(state => state.tooltipDisplayCount)
  const incrementTooltipDisplayCount = useBrickStore(state => state.incrementTooltipDisplayCount)

  // const didMakeMistakes = typeof messageData === 'undefined' || messageData === null ? null : messageData.didMakeMistakes

  // useEffect(() => console.log('navigator useragent', navigator.userAgent), [])
  // useEffect(() => {
  //   if (messageData) console.log(messageData)
  //   if (isUser && !messageData) console.log("HELLO")
  // }, [messageData])
  const elementRef = useRef<HTMLSpanElement>(null)

  const [hoveredTokenId, setHoveredTokenId] = useState<number | null>(null)
  return (
    <div ref={ref} className={`pb-[7px] flex mt-4 lg:mt-6 ${isUser ? 'justify-end' : ''}`} data-tooltip-id="translateHint">
      {(!isUser && tooltipDisplayCount < 2) && <ReactTooltip id="translateHint" place="top" afterHide={incrementTooltipDisplayCount}>
        Tip: Select any text to see its translation!
      </ReactTooltip>}
      {!isUser && typeof window !== 'undefined' && window.innerWidth > 600 && (
        <button onClick={handleAudio} className='flex-shrink-0 mr-1' disabled={isLoading}>
          {!isLoading ? <Image src={isPlaying ? soundOffIcon : soundOnIcon} alt="Sound Off / On Icon" /> : <LoadingIndicator />}
        </button>
      )}
      <div className='flex flex-row items-center'>
        <div className={`rounded-[10px] ${isUser ? 'rounded-br-none text-right text-[var(--text-primary)] bg-[var(--background-bubble-primary)]' : 'rounded-bl-none text-[var(--text-secondary-inverse)] bg-[var(--background-bubble-secondary)]'} p-2 lg:p-4 leading-[1.65] pr-9 relative self-start`}>
          {/* <Markdown
            className="markdown grid grid-cols-1 gap-3"
            remarkPlugins={[remarkGfm]}
          > {'\u200B' + content.content} </Markdown>
          */}
          {/* {'\u200B'} */}
          {isUser ?
            messageData.content
            :
            messageData.tokenDataArr ?
              (
                messageData.tokenDataArr.map((tokenData, index, tokenDataArr) => {
                  const token = tokenData.token
                  const token_ws = tokenData['token_ws']

                  return (
                    // if token is a word, make it clickable
                    token.match(/[a-zA-ZÀ-ž]+/) ?
                      <span key={messageData.id + index + 'p'} >
                        <span ref={tokenData.id == hoveredTokenId ? elementRef : null} onClick={(element) => {
                          // console.log(element)
                          handleTokenClick(token, elementRef)}} style={{ cursor: 'pointer' }} className={tokenData.id == hoveredTokenId ? `bg-yellow-200` : ``} onMouseOver={() => setHoveredTokenId(tokenData.id)} onMouseLeave={() => setHoveredTokenId(null)}>{token}</span>
                        <span>{token_ws}</span>
                      </span>

                      : <span key={messageData.id + index + 'p'}>{token}{['-', '(', '\''].includes(token) ? '' : ' '}</span>
                  )
                })
              ) : <LoadingIndicator />}
        </div>
      </div>
    </div>
  )

})

export default Bubble;

export const BubblePair = forwardRef<HTMLDivElement, { user: BubbleProps, assistant: BubbleProps | undefined }>(({ user, assistant }, ref) => {
  BubblePair.displayName = 'BubblePair';
  // const didMakeMistakes = typeof user.messageData === 'undefined' || user.messageData === null ? null : user.messageData.didMakeMistakes

  useEffect(() => {
    // console.log('user updated: ')
    // console.log(user.messageData)

    // console.log('rendering bubble pair with user', user)
    // console.log('and assistant', assistant)
  }, [user])

  return (<div className="flex flex-row">
    <div className="flex flex-col max-w-[60%] w-[60%] min-w-[60%] mr-2">
      <Bubble ref={ref} {...user} />
      {assistant?.messageData && <Bubble ref={ref} {...assistant} />}
    </div>

    <div className="flex-grow flex">
      <div className={`mt-4 lg:mt-6 p-1`}>

        <div className="p-2 lg:p-4">
          <div className="inline-block relative w-4 mr-1">
            {/* <span>&nbsp;</span> */}
            {/* <div className={`${didMakeMistakes === null ? 'bg-yellow-500' : didMakeMistakes ? 'bg-red-500' : 'bg-green-500'} h-4 w-4 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} /> */}
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
