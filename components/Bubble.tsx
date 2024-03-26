import Link from "next/link";
import { forwardRef, JSXElementConstructor, useMemo, RefObject, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"
import { MessageData } from "../app/page";
import soundIcon from "../public/assets/soundIcon.svg"
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

  // useEffect(() => {
  //   if(content.content) console.log(JSON.stringify(content.content))
  // }, [content])

  const didMakeMistakes = typeof messageData === 'undefined' || messageData === null ? null : messageData.didMakeMistakes

  return (
    <div className={`flex flex-row `}>
      <div ref={ref} className={` pb-[7px] w-[60%] min-w-[60%] flex items-start mt-4 md:mt-6 ${isUser ? 'justify-end' : ''} mr-2`}>
        {isUser ? null : (
          <button className='flex-shrink-0'>
            <Image src={soundIcon} alt="Sound Icon" className="" />
          </button>
        )}
        <div className={`rounded-[10px] ${isUser ? 'rounded-br-none text-right text-white bg-[#611C9B]' : 'rounded-bl-none text-[#494A4D] bg-[#F7F7F7]'} p-2 md:p-4 leading-[1.65] pr-9 relative`}>
          <Markdown
            className="markdown grid grid-cols-1 gap-3"
            remarkPlugins={[remarkGfm]}
          >
            {content.content}
          </Markdown>
        </div>


      </div>
      <div className="flex-grow flex border-l-2 border-black">
        {content.role === 'user' ?
          <div className={`mt-4 md:mt-6 p-1`}>

            {didMakeMistakes && (
              <>
                <div>
                  <div className="inline-block relative w-4 mr-1">
                    <span>&nbsp;</span>
                    <div className={`${didMakeMistakes === null ? 'bg-yellow-500' : didMakeMistakes ? 'bg-red-500' : 'bg-green-500'} h-4 w-4 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
                  </div>
                  <strong>{messageData.correctedResponse}</strong>
                </div>
                <div>
                  <Markdown
                    className="markdown grid grid-cols-1 gap-3"
                    remarkPlugins={[remarkGfm]}
                  >
                    {messageData.mistakes}
                  </Markdown>
                </div>
              </>
            )}
          </div>
          : null}
      </div>
    </div>
  )
})

// async function playAudio(message: Message) {
//   const res = await fetch('/api/tts', {
//     method: 'POST',
//     body: JSON.stringify({
//       "input": message.content
//     })
//   })
//   const blob = await res.blob()
//   const blobURL = URL.createObjectURL(blob)
//   await new Audio(blobURL).play()
// }

export default Bubble;