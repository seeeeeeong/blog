import type { KeyboardEvent, Ref } from 'react'
import { CmdIcon } from '@/features/cmd/components/CmdIcon'
import { type CmdItem, type CmdMode, groupsOf } from '@/features/cmd/utils/items'

type Props = {
  mode: CmdMode
  query: string
  items: CmdItem[]
  active: number
  inputRef?: Ref<HTMLInputElement>
  onType: (query: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onHover: (index: number) => void
  onRun: (item: CmdItem) => void
  onClose: () => void
}

const LIST_ID = 'cmd-list'

export const optionId = (index: number) => `cmd-option-${index}`

/**
 * The palette as drawn: a combobox over a listbox of grouped options. Focus stays in the input,
 * which names the active option, so pointing at an option or pressing it never takes focus.
 */
export function CmdMenu({
  mode,
  query,
  items,
  active,
  inputRef,
  onType,
  onKeyDown,
  onHover,
  onRun,
  onClose,
}: Props) {
  return (
    <div className="cmd">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Esc closes it from the keyboard */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Esc closes it from the keyboard */}
      <div className="cmd__backdrop" onClick={onClose} />
      <div className="cmd__panel" role="dialog" aria-modal="true" aria-label="명령 메뉴">
        <input
          ref={inputRef}
          className="cmd__input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={LIST_ID}
          aria-autocomplete="list"
          aria-activedescendant={items.length > 0 ? optionId(active) : undefined}
          aria-label="명령 검색"
          placeholder={mode === 'posts' ? 'Search posts...' : 'Type a command...'}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => onType(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <div
          className="cmd__list"
          id={LIST_ID}
          role="listbox"
          aria-label="명령"
          onMouseDown={(event) => event.preventDefault()}
        >
          {groupsOf(items).map((group) => (
            // biome-ignore lint/a11y/useSemanticElements: a listbox groups options, a fieldset groups form controls
            <div key={group.name} role="group" aria-label={group.name}>
              <div className="cmd__group" aria-hidden="true">
                {group.name}
              </div>
              {group.entries.map(({ item, index }) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: the combobox handles the keys
                // biome-ignore lint/a11y/useFocusableInteractive: focus stays in the combobox
                <div
                  key={item.id}
                  className="cmd__item"
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  onPointerMove={() => onHover(index)}
                  onClick={() => onRun(item)}
                >
                  <CmdIcon name={item.icon} />
                  <span className="cmd__label">{item.label}</span>
                  {item.hint && (
                    <span className={item.group === 'Posts' ? 'cmd__hint mono' : 'cmd__hint'}>
                      {item.hint}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        {items.length === 0 && <p className="cmd__empty">No results</p>}
      </div>
    </div>
  )
}
