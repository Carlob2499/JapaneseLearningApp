/** A bilingual section header (D-032): a small Japanese eyebrow in the display mincho over the
 *  English heading, on a short kumiko rule — the joinery motif in its designated divider role. */
export function SectionHead({ ja, en }: { ja: string; en: string }) {
  return (
    <div className="section-head">
      <span className="section-ja" aria-hidden="true">
        {ja}
      </span>
      <h2>{en}</h2>
      <span className="section-rule" aria-hidden="true" />
    </div>
  )
}
