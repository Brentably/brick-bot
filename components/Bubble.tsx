import Link from "next/link";
import { forwardRef, JSXElementConstructor, useMemo, RefObject, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"
import { MessageData } from "../app/page";

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

  const didMakeMistakes = typeof messageData === 'undefined' || messageData === null ? null :  messageData.didMakeMistakes
  return (
    <div className={`flex flex-row`}>
      <div ref={ref} className={` mt-4 md:mt-6 pb-[7px] w-[60%] flex ${isUser ? 'justify-end' : ''} mr-2`}>
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
            {isUser ? (<div/>) : ( 
              <button><SoundIcon /></button>
            )}
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.730278 0.921112C-3.49587 0.921112 12 0.921112 12 0.921112V5.67376C12 6.8181 9.9396 7.23093 9.31641 6.27116C6.83775 2.45382 3.72507 0.921112 0.730278 0.921112Z" />
            </svg>
          </div>


      </div>
      <div className="flex-grow border-l-2 border-black flex items-center">
      {content.role === 'user' &&
        <div className={`${didMakeMistakes === null ? 'bg-yellow-500' : didMakeMistakes ? 'bg-red-500' : 'bg-green-500'}`}>
          {didMakeMistakes === null ? 'in review' : didMakeMistakes ? 'wrong' : 'right'}
      </div>}
      </div>
    </div>
  )
})

function SoundIcon() {
  return (
    <svg width="20px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_15_174)">
        <rect width="24" height="24" fill="white"/>
        <path d="M3 16V8H6L11 4V20L6 16H3Z" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13 9C13 9 15 9.5 15 12C15 14.5 13 15 13 15" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 7C15 7 18 7.83333 18 12C18 16.1667 15 17 15 17" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 5C17 5 21 6.16667 21 12C21 17.8333 17 19 17 19" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <defs>
        <clipPath id="clip0_15_174">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

export default Bubble;