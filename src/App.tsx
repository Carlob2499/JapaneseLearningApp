import { APP_NAME, APP_NAME_JA, isStandalone, railChecklist } from './lib/appMeta'
import './App.css'

const DOCS = [
  { file: 'research.md', label: 'Competitor research' },
  { file: 'curriculum.md', label: 'Curriculum & real-world scope' },
  { file: 'design-options.md', label: 'Design proposals' },
  { file: 'architecture.md', label: 'Architecture' },
] as const

const REPO_URL = 'https://github.com/Carlob2499/JapaneseLearningApp'

export default function App() {
  const checklist = railChecklist(typeof navigator !== 'undefined' && 'serviceWorker' in navigator)

  return (
    <main className="shell">
      <header className="masthead">
        <span className="mark" aria-hidden="true">
          {APP_NAME_JA}
        </span>
        <h1>{APP_NAME}</h1>
        <p className="tagline">
          A life in Japan, one day at a time — JLPT N5–N1 plus the Japanese the exam skips.
        </p>
      </header>

      <section className="card" aria-labelledby="rail-h">
        <h2 id="rail-h">Build rail</h2>
        <ul className="rail">
          {checklist.map((s) => (
            <li key={s.label} className={s.done ? 'done' : 'todo'}>
              <span className="dot" aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
        <p className="fineprint">
          Scaffold milestone (session 4, task 1). Running {isStandalone() ? 'installed' : 'in browser'} · v
          {__APP_VERSION__}
        </p>
      </section>

      <section className="card" aria-labelledby="docs-h">
        <h2 id="docs-h">Project documents</h2>
        <ul className="docs">
          {DOCS.map((d) => (
            <li key={d.file}>
              <a href={`${REPO_URL}/blob/claude/jlpt-game-research-7a5aoe/docs/${d.file}`}>{d.label}</a>
            </li>
          ))}
        </ul>
        <p className="fineprint">
          Language data will come exclusively from licensed open datasets (JMdict, KANJIDIC2, KanjiVG,
          Tatoeba — attribution will ship in-app). JLPT level tags are community estimates; the JLPT has
          published no official lists since 2010.
        </p>
      </section>
    </main>
  )
}
