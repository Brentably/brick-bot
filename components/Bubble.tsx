import Link from "next/link";
import { forwardRef, JSXElementConstructor, useMemo, RefObject, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"
import { MessageData } from "../app/page";
import soundIcon from "../public/assets/soundIcon.svg"

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

  const didMakeMistakes = typeof messageData === 'undefined' || messageData === null ? null : messageData.didMakeMistakes
  return (
    <div className={`flex flex-row `}>
      <div ref={ref} className={` pb-[7px] w-[60%] flex  mt-4 md:mt-6 ${isUser ? 'justify-end' : ''} mr-2`}>
          {isUser ? (<div />) : (
            isAudioPlaying ? (
              <button onClick={pauseAudio}>
                <img src={soundIcon} alt="Sound Off Icon" />
              </button> ) : (
              <button onClick={playAudio}>
                <img src={soundIcon} alt="Sound On Icon"/>
              </button>
            )
          )}
        <div className={`talk-bubble${isUser ? ' user' : ''} p-2 md:p-4 leading-[1.65] pr-9 grid grid-cols-1 gap-3 relative`}>
          {content.processing ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="dot-flashing" />
            </div>
          ) : (
            <Markdown
              className="contents"
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, children, ...props }) {
                  return (
                    <code {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content.content}
            </Markdown>
          )}

        </div>


      </div>
      <div className="flex-grow flex border-l-2 border-black">
        {content.role === 'user' ?
          <div className={`mt-4 md:mt-6 p-1`}>
            <div className={`${didMakeMistakes === null ? 'bg-yellow-500' : didMakeMistakes ? 'bg-red-500' : 'bg-green-500'} h-4 w-4 rounded-full`} />
            {didMakeMistakes && (
              <>
                Corrected Response: {messageData.correctedResponse}
                Mistakes: {messageData.mistakes}
              </>
            )}
          </div>
          : null}
      </div>
    </div>
  )

})

export default Bubble;