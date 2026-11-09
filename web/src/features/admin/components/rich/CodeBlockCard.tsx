'use client'

import { type CodeBlockEditorProps, useCodeBlockEditorContext } from '@mdxeditor/editor'

/** A fenced code block: its language, the rest of its fence line (`title="Server.kt"`), its code. */
export function CodeBlockCard({ code, language, meta }: CodeBlockEditorProps) {
  const { setCode, setLanguage, setMeta } = useCodeBlockEditorContext()
  return (
    <div className="rcode">
      <div className="rcode__head">
        <input
          className="rcode__lang"
          aria-label="언어"
          defaultValue={language}
          spellCheck={false}
          onChange={(event) => setLanguage(event.target.value)}
        />
        <input
          className="rcode__meta"
          aria-label="파일 이름"
          defaultValue={meta}
          spellCheck={false}
          onChange={(event) => setMeta(event.target.value)}
        />
      </div>
      <textarea
        className="rcode__body"
        aria-label="코드"
        defaultValue={code}
        spellCheck={false}
        onChange={(event) => setCode(event.target.value)}
      />
    </div>
  )
}
