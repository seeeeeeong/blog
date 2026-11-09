const PATHS = {
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  link: (
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  ),
  folder: (
    <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  ),
  order: <path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4" />,
  summary: <path d="M4 6h16M4 11h16M4 16h10" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  grip: (
    <path d="M9 6.5h.01M15 6.5h.01M9 12h.01M15 12h.01M9 17.5h.01M15 17.5h.01" strokeWidth="2.6" />
  ),
  heading: <path d="M6 5v14M17 5v14M6 12h11" />,
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  olist: (
    <path d="M10 6h10M10 12h10M10 18h10M4 4.5h1.5V9M4 9h3M4 15.2a1.5 1.5 0 0 1 3 .2c0 1.4-3 1.7-3 3.6h3" />
  ),
  table: (
    <path d="M5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11A1.5 1.5 0 0 1 5.5 5zM4 10h16M4 15h16M10 5v14" />
  ),
  code: (
    <path d="M5.5 5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9.5 10l-2 2 2 2M14.5 10l2 2-2 2" />
  ),
  callout: <path d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 11v5M12 8h.01" />,
  quiz: (
    <path d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.4v.4M12 16.8h.01" />
  ),
  idea: (
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />
  ),
  widget: (
    <path d="M5.5 4.5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM10 8l4 2.5-4 2.5zM8 20h8" />
  ),
  hidden: (
    <path d="M4 4l16 16M10.6 6A9.5 9.5 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.4 7.5A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.4-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  ),
  spark: (
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M6.5 17.5 9 15M15 9l2.5-2.5" />
  ),
  github: (
    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  ),
}

/** A line icon in the dock's stroke; it takes the text color. */
export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <span className="ico">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {PATHS[name]}
      </svg>
    </span>
  )
}
