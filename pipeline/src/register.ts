import type { Register } from '@hikkoshi/schemas'

/**
 * Estimate the politeness register of a verbatim Japanese sentence from its grammatical
 * ending and lexical keigo markers. D-002-safe: it *classifies* the dataset text, never
 * edits or generates it. This is a morphology-free heuristic — precise on です/ます (polite)
 * and clear keigo verbs; the plain-vs-casual split is best-effort (bare noun fragments may
 * be mislabelled, but the selector's "prefer complete sentences" sort de-prioritises those).
 * Order matters: keigo → polite → casual → plain (most specific first).
 */
export function classifyRegister(ja: string): Register {
  const s = ja.trim()

  // Humble keigo (謙譲語) — lexical humble verbs/expressions.
  if (
    /参りま|参ります|申します|申し上げ|伺いま|伺って|いたします|いたしま|拝見|拝借|拝聴|存じま|存じ上げ|承りま|お目にかか|させていただ|いただきます|頂きます/.test(
      s,
    )
  ) {
    return 'keigo_humble'
  }

  // Respectful keigo (尊敬語) — lexical respectful verbs (excludes ごめんなさい / 〜てください below).
  if (
    /いらっしゃ|おっしゃ|召し上が|ご覧|ご存じ|なさいます|なさいませ|なさる|くださいます|くださる|お[ぁ-んァ-ヶ一-龥ー]+になり|お[ぁ-んァ-ヶ一-龥ー]+になる/.test(
      s,
    )
  ) {
    return 'keigo_respectful'
  }

  // Service / very-formal copula. (Bare ございます — e.g. ありがとうございます — is common polite,
  // so require でございます or a service greeting; plain ございます falls through to polite.)
  if (/でございま|くださいませ|いらっしゃいませ|ませ。$/.test(s)) {
    return 'service_script'
  }

  // Polite (teineigo): です/ます family at the sentence end (+ optional single particle/punct),
  // or a 〜てください request.
  if (
    /(です|ます|ました|ません|ませんでした|ましょう|でしょう|でした|でして)(か|ね|よ|わ|な|さ)?[。、！？!?…]*$/.test(s) ||
    /(ください|下さい)[。、！？!?…]*$/.test(s)
  ) {
    return 'polite'
  }

  // Casual: spoken sentence-final particles, imperatives, slang, contractions.
  if (
    /(よ|ね|な|わ|ぞ|ぜ|さ|かい|だい|かな|っけ|じゃん|だろ|でしょ|じゃない|んだ)[。！？!?〜ー…]*$/.test(s) ||
    /[ぁ-ん一-龥][ろ][。！]?$/.test(s) || // imperative 〜ろ
    /(まじ|なんで|うそ|やば|すげ|きも|ちゃう|なきゃ|きゃ[ーあ]|くそ|ばか|えっと|ええと|うん[。！、]|ううん|やだ|だめ)/.test(s)
  ) {
    return 'casual'
  }

  // Neutral plain (dictionary / plain-past declarative with no politeness or casual marker).
  return 'plain'
}
