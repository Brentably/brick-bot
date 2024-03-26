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

  const didMakeMistakes = typeof messageData === 'undefined' ? null :  messageData.didMakeMistakes
  return (
    <div className="flex flex-row justify-stretch items-stretch">
      <div ref={ref} className={`block mt-4 md:mt-6 pb-[7px] clear-both ${isUser ? 'float-right' : 'float-left'}`}>
        <div className="flex justify-end">
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
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.730278 0.921112C-3.49587 0.921112 12 0.921112 12 0.921112V5.67376C12 6.8181 9.9396 7.23093 9.31641 6.27116C6.83775 2.45382 3.72507 0.921112 0.730278 0.921112Z" />
            </svg>
          </div>
        </div>

      </div>
      {content.role === 'user' &&
        <div className={`${didMakeMistakes === null ? 'bg-yellow-500' : didMakeMistakes ? 'bg-red-500' : 'bg-green-500'}`}>
          {didMakeMistakes === null ? 'in review' : didMakeMistakes ? 'wrong' : 'right'}
      </div>}
    </div>
  )
})

export default Bubble;