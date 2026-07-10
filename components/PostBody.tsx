'use client'

import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { slugify, nodeToText } from '@/utils/post'

// Injects stable anchor ids on h2/h3 so the table of contents can link to them.
// The override runs after rehype-sanitize, so the id survives sanitization.
export default function PostBody({ content }: { content: string }) {
    return (
        <div className="prose prose-invert prose-stone max-w-none prose-headings:font-display prose-headings:scroll-mt-24 prose-a:text-green-400 prose-code:text-green-300">
            <ReactMarkdown
                rehypePlugins={[rehypeSanitize]}
                components={{
                    h2: ({ children }) => <h2 id={slugify(nodeToText(children))}>{children}</h2>,
                    h3: ({ children }) => <h3 id={slugify(nodeToText(children))}>{children}</h3>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
