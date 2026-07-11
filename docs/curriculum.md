# Session 2 — Curriculum Map & Real-World Scope

**Purpose.** (a) Map the N5→N1 progression — vocabulary, kanji, and grammar counts per level — from open datasets, documenting honestly that **no official JLPT lists exist** and every level tag is a community estimate. (b) Define the real-world modules the JLPT structurally ignores, each justified with cited learner-pain evidence, and specify how they interleave with the JLPT track instead of sitting in a silo.

**Status:** Session 2 deliverable. Builds on `docs/research.md` (Session 1); feeds Session 3 (design proposals) and the Session 4+ content pipeline.

---

## 1. Method & source standards

- Web research performed with live fetches on **2026-07-11**; unless noted, "accessed 2026-07-11" applies to every URL. Primary sources (jlpt.jp, government agencies, dataset maintainers, publishers) for facts and policy; secondary (teacher blogs, forums, prep sites) for learner-pain evidence, labeled as such.
- Dataset counts marked **[counted]** were computed directly from files downloaded on 2026-07-11 (KANJIDIC2 from edrdg.org; per-level vocab CSVs from the tanos-derived `elzup/jlpt-word-list` GitHub mirror; N-level kanji tags from `davidluzgouveia/kanji-data`; JMdict entry count from the official `JMdict_e.gz` build) — method: stream-parse and count elements/rows; scripts run in-session, results reproducible in the Session 4 pipeline.
- Learning-science claims cite **verified publications only** (each checked against a publisher/index page this pass); honest caveats are stated where the evidence is mixed — including where it cuts *against* fashionable design choices.
- Claims that could not be confirmed from a fetched page are flagged **UNVERIFIED**. Conflicting sources are shown as conflicts — for level estimates, the spread *is* a finding.

---

## 2. The JLPT list problem — why every level tag is an estimate

**Official lists existed before 2010 and were deliberately discontinued.** The pre-2010 JLPT (Levels 1–4) published *Test Content Specifications* (出題基準) with vocabulary/kanji/grammar lists. The official *New JLPT Guidebook* (Japan Foundation & JEES, 2009) announced the 5-level revision — N3 "positioned at a level bridging the current Level 2 and Level 3 tests" — and answered FAQ Q7 directly: **"The 'Test Content Specifications' which includes the lists of vocabulary, kanji, and grammar are not going to be published for the new test"** ([official guidebook PDF, p. 9](https://www.jlpt.jp/e/reference/pdf/guidebook_s_e.pdf)). The current official FAQ maintains this position, offering can-do summaries and sample questions instead ([jlpt.jp FAQ](https://www.jlpt.jp/e/faq/index.html)). KANJIDIC2's documentation states the consequence flatly: "No official kanji lists are available for the new levels" ([EDRDG](https://www.edrdg.org/kanjidic/kanjidic2_dtdh.html)). Academic corroboration: Ishikawa (2025) notes empirical JLPT research is thin precisely because items and vocabulary criteria are undisclosed ([Kobe University](https://doi.org/10.24546/0100493764)); Matsushita observes the field *still* references the old-JLPT leveled lists as its de-facto standard ([J-Stage](https://www.jstage.jst.go.jp/article/jtje/19/0/19_19/_pdf/-char/ja)).

**The provenance chain behind "JLPT tags" in the wild.** Nearly every dataset traces to one source: Jonathan Waller's JLPT Resources (tanos.co.uk), licensed **CC BY** ("use anything here however you like (commercial or non-commercial), but credit my site" — [tanos.co.uk/jlpt/sharing/](http://www.tanos.co.uk/jlpt/sharing/)). jisho.org states its JLPT tags "come from Jonathan Waller's JLPT Resources page" ([jisho.org/about](https://jisho.org/about)); the best-documented open dataset, [stephenmk/yomitan-jlpt-vocab](https://github.com/stephenmk/yomitan-jlpt-vocab), sources Waller under CC BY and carries the honest caveat: **"Official vocabulary lists do not exist for the JLPT, so these lists are essentially an educated guess"** — with documented misses (Waller-N1 words appearing on the Dec 2021 N2 exam).

**The estimate spread is real and must be shown, not hidden.** N1 kanji: ~1,232 (Waller-derived tags [counted]) vs 1,504 (JLPT Sensei) vs ~2,000-cumulative (tanos site figures). N5 kanji: 79–~100. Grammar inventories differ by both count and level placement (§3.3).

**In-app disclosure (draft copy, to ship with the settings/about screen and pack metadata):**

> JLPT level tags in this app are community estimates. The JLPT has published no official vocabulary, kanji, or grammar lists since its 2010 revision. Our tags derive from cited open sources (primarily Jonathan Waller's JLPT Resources, CC BY), and reputable sources disagree — N1 kanji estimates range from about 1,200 to 2,500. Treat levels as guidance for sequencing, not as a guarantee of exam content.

Every pack carries `levelTagSource`, `levelTagLicense`, and `verification` fields (Session 4 schema) so the disclosure is data, not just prose.

---

## 3. The N5→N1 progression map

### 3.1 Vocabulary per level

| Level | tanos site (cumulative "need to know") | tanos-derived list files, per level **[counted]** | Bunpro vocab decks (per level) |
|---|---|---|---|
| N5 | ~800 | 718 | 1,100 |
| N4 | ~1,500 | 668 (cum. 1,386) | 1,095 |
| N3 | ~3,750 | 2,139 (cum. 3,525) | 1,998 |
| N2 | ~6,000 | 1,748 (cum. 5,273) | 1,998 |
| N1 | ~10,000 | 2,699 (cum. 7,972) | 2,974 |

Sources: tanos level pages ([N5](http://www.tanos.co.uk/jlpt/jlpt5/) … [N1](http://www.tanos.co.uk/jlpt/jlpt1/)); counted files from [elzup/jlpt-word-list](https://github.com/elzup/jlpt-word-list) (tanos-derived via chyyran/jamsinclair, per its README); [Bunpro decks](https://bunpro.jp/decks/bunpro). Availability note: tanos.co.uk returned HTTP 500 to one client and HTTP 200 to another on the same day — treat as flaky; GitHub mirrors hedge this. The tanos↔counted-file gap at N1 (10,000 cumulative claimed vs 7,972 counted) is part of the estimate spread; Bunpro's totals (9,165) land between them.

**Working envelope for our packs: ~8,000–10,000 tagged vocabulary items N5→N1**, resolved against JMdict entries (matching by expression + reading; unmatched items flagged for review rather than dropped).

### 3.2 Kanji per level

| Level | Waller-derived N-tags, per level **[counted]** | JLPT Sensei (per level) | tanos site (cumulative) |
|---|---|---|---|
| N5 | 79 | 80 | ~100 |
| N4 | 166 (cum. 245) | 167 (cum. 247) | ~300 |
| N3 | 367 (cum. 612) | 370 (cum. 617) | ~650 |
| N2 | 367 (cum. 979) | 374 (cum. 991) | ~1,000 |
| N1 | 1,232 (cum. 2,211) | 1,504 (cum. 2,495) | ~2,000 |

Sources: [kanji-data](https://github.com/davidluzgouveia/kanji-data) (`jlpt_new` field, credited to Waller) [counted]; [JLPT Sensei kanji lists](https://jlptsensei.com/jlpt-n5-kanji-list/) (N5–N1 pages); tanos level pages. The sources agree closely through N2 and diverge sharply at N1 — exactly what the in-app disclosure should surface.

**Cross-validation [counted]:** KANJIDIC2 (2026-07-11 build, 13,108 characters) carries a `jlpt` field for the **pre-2010 levels only** — L4=103, L3=181, L2=739, L1=1,207 (2,230 tagged) — matching `kanji-data`'s `jlpt_old` field exactly. Old Level 2 straddles N2/N3, so KANJIDIC2 alone cannot produce N-levels ([field documentation](https://www.edrdg.org/kanjidic/kanjidic2_dtdh.html)); community N-tags must be layered on top. Anchors: kyōiku grades 1–6 = 1,026 kanji; **jōyō total = 2,136** [counted, grades 1–6 + 8] — the natural ceiling for the N1 kanji pool.

### 3.3 Grammar per level

No importable open inventory exists — the citable inventories are proprietary editorial content. Their **counts** (facts) for sizing:

| Level | JLPT Sensei | Bunpro (official decks) |
|---|---|---|
| N5 | 84 | 132 |
| N4 | 132 | 185 |
| N3 | 182 | 220 |
| N2 | 197 | 221 |
| N1 | 253 | 187 |
| **Total** | **848** | **945** |

Sources: [JLPT Sensei grammar lists](https://jlptsensei.com/jlpt-n5-grammar-list/) (N5–N1 pages); [Bunpro decks](https://bunpro.jp/decks/bunpro). The inventories disagree in shape, not just size — Bunpro's N1 deck (187) is smaller than its N2 (221), while JLPT Sensei's N1 is its largest (253); Bunpro's own grammar-library page gives different per-level totals than its decks — proof that grammar itemization is editorial. **Pipeline decision (recorded as D-005): we curate our own grammar-point list, ~850–950 points N5→N1, each point carrying level placement cross-referenced against ≥2 public inventories plus a textbook anchor (Genki I/II ≈ N5–N4, Quartet I/II ≈ N3 — [Tofugu's Quartet review](https://www.tofugu.com/reviews/quartet-vol1/) — Tobira/Shin Kanzen for N2–N1), and original descriptions written against cited references.** Copying Bunpro's or JLPT Sensei's lists wholesale is a license violation; citing their counts and cross-checking placements is not.

### 3.4 The source datasets (licenses verified from primary pages)

| Dataset | Role | Size (2026-07-11) | License | Attribution requirement |
|---|---|---|---|---|
| **JMdict** ([EDRDG](https://www.edrdg.org/jmdict/j_jmdict.html)) | vocabulary: readings, senses, POS | **217,824 entries** [counted from official build] | [CC BY-SA 4.0](https://www.edrdg.org/edrdg/licence.html) | acknowledge in docs *and* on-screen (About screen acceptable per EDRDG) |
| **KANJIDIC2** ([EDRDG](https://www.edrdg.org/kanjidic/kanjd2index_legacy.html)) | kanji: readings, meanings, grades, freq | **13,108 characters** [counted] | CC BY-SA 4.0 (same page) | same as JMdict |
| **KanjiVG** ([kanjivg.tagaini.net](http://kanjivg.tagaini.net/)) | stroke-order SVGs | character count not stated on homepage (UNVERIFIED) | **CC BY-SA 3.0**, © Ulrich Apel | credit Apel/KanjiVG; share-alike on derivatives |
| **Tatoeba** ([terms](https://tatoeba.org/en/terms_of_use)) | example sentences | **249,077 Japanese sentences** ([stats](https://tatoeba.org/en/stats/sentences_by_language)) | **CC BY 2.0 FR** (default; some CC0) | per-sentence author attribution |
| **Waller JLPT lists** ([sharing](http://www.tanos.co.uk/jlpt/sharing/)) | N5–N1 level tags | §3.1–3.2 | **CC BY** (version unspecified) | credit tanos.co.uk (hyperlink preferred) |
| JEV / 日本語教育語彙表 ([jhlee.sakura.ne.jp/JEV](https://jhlee.sakura.ne.jp/JEV/)) | calibration reference only | 17,908 headwords, 6 bands + old-JLPT levels | **no redistribution** (「二次配布はご遠慮ください」) | cite in publications; **cannot be imported** |
| VDRJ (Matsushita) | calibration reference (candidate) | ~141,950 words (UNVERIFIED — canonical page returned HTTP 503 this pass; figures from search-indexed copies) | UNVERIFIED | re-check when site is reachable |

**License consequence:** JMdict/KANJIDIC2/KanjiVG are copyleft — derived pack files must remain share-alike with on-screen attribution; Waller tags and Tatoeba sentences need attribution only; JEV/VDRJ inform calibration decisions but never enter the repo.

### 3.5 What each level *means* (official can-do anchors)

The official level summaries ([jlpt.jp](https://www.jlpt.jp/e/about/levelsummary.html)) define levels by reading/listening can-dos only — N5 "basic Japanese," N3 "Japanese used in everyday situations to a certain degree," N1 "Japanese used in a broad range of circumstances," with N1 listening at "natural speed" in "a broad range of settings." Two structural facts drive our design: **the JLPT tests no speaking or writing** ("the JLPT does not include sections to measure speaking or writing proficiency directly" — [jlpt.jp](https://www.jlpt.jp/e/about/points.html)), and register (casual vs. formal vs. service) is never a defined test dimension. That is the gap the real-world modules fill.

---

## 4. Real-world modules — the curriculum the JLPT skips

Ten modules, each with: the gap, cited pain evidence, content sources for the pipeline, and level mapping (entry level → escalation). Common structural justification: no speaking/writing section (above) and no register/domain dimension in the test design. Government survey data below is from the Immigration Services Agency's FY2024 Basic Survey on Foreign Residents (7,621 valid responses; [official English summary PDF](https://www.moj.go.jp/isa/content/001450859.pdf); [survey hub](https://www.moj.go.jp/isa/support/coexistence/04_00017.html)).

### M1. Katakana loanword decoding — entry N5
**Gap/pain:** Gairaigo grew from 9.8% of distinct words (1956 magazine corpus) to **33.8%** (1994 NINJAL survey) ([summary with figures](https://user.keio.ac.jp/~rhotta/hellog/2013-10-28-1.html)); Sanseido's katakana dictionary records **~58,500 entries** ([publisher](https://www.sanseido-publ.co.jp/np/detail/11064/)). Meaning-shifted false friends (マンション=condo, バイキング=buffet) are documented miscommunication sources ([Tofugu](https://www.tofugu.com/japanese/wasei-eigo/); [empirical study](https://www.hpu.edu/research-publications/tesol-working-papers/spring-2022/8michaloski_waseieigo.pdf)). Government concern is real: NINJAL's 外来語言い換え提案 issued four rounds of loanword-replacement proposals 2003–2006, grounded in national comprehension surveys (n=4,500) ([official archive](https://www2.ninjal.ac.jp/gairaigo/); [surveys](https://www.ninjal.ac.jp/archives/genzai/ishiki/)).
**Sources for pipeline:** NINJAL proposal lists (loanword → plain gloss + measured comprehension rate = a ready-made graded item bank); JMdict gairaigo entries; wasei-eigo false-friend inventories ([list](https://en.wikipedia.org/wiki/List_of_gairaigo_and_wasei-eigo_terms)).
**Escalation:** N5 speed-decoding of transparent loans → N4 store/menu katakana → N3 wasei-eigo false friends → N2 alphabetic abbreviations and compressed compounds.

### M2. Konbini & restaurant flows — entry N5
**Gap/pain:** The checkout script barrage (温めますか, レジ袋はご利用ですか, ポイントカードはお持ちですか) is such a documented shock that a whole genre of survival guides exists ([Coto Academy](https://cotoacademy.com/convenience-store-japanese/); [LIVE JAPAN](https://livejapan.com/en/article-a0001719/); [Go! Go! Nihon](https://gogonihon.com/en/blog/japanese-for-the-convenience-store/); even [Duolingo's blog](https://blog.duolingo.com/japanese-convenience-store-vocabulary/)). The register is contested among natives themselves — in the Bunkachō FY2013 survey, 63.5% found 「お会計の方、1万円になります」 bothersome and 55.0% 「千円からお預かりします」 ([report PDF](https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/kokugo_yoronchosa/pdf/h25_chosa_kekka.pdf)) — so textbook keigo alone underpredicts real comprehension ("baito keigo").
**Sources:** the phrase-guide inventories above (greeting → age check → warming → bag → points → payment → change formula); Bunkachō survey items as the canonical disputed-forms list.
**Escalation:** N5 recognize the six core questions + minimal replies → N4 full flow with variations → N3 restaurant ordering with counters and requests → N2 decoding baito-keigo vs. standard keigo and *playing the clerk*.

### M3. Train/station announcements & signage — entry N5
**Gap/pain:** Announcements use humble/formal formulas (まもなく…参ります) at natural speed over degraded audio; guides exist because "even if you already know some basic conversational Japanese, these phrases can still catch you off guard" ([My Nihongo Sensei](https://mynihongosensei.com/how-to-understand-japanese-announcements-in-trains-stations/)); travelers post asking others to decode memorized announcements ([japan-guide forum](https://www.japan-guide.com/forum/quereadisplay.html?0+114324=)).
**Sources:** the register is formulaic and fully documented — fixed scripts with slots ([Coto Academy's inventory](https://cotoacademy.com/japanese-train-announcements-meaning-%E3%81%A7%E3%82%93%E3%81%97%E3%82%83-%E3%82%A2%E3%83%8A%E3%82%A6%E3%83%B3%E3%82%B9/); [ling-app](https://ling-app.com/blog/japanese-train-announcements/)). Phrase templates + station-name slots = cheap procedural content.
**Escalation:** N5 signage kanji (出口/改札/各駅停車) → N4 standard announcement templates → N3 delay/exception announcements → N2 rapid-fire transfers and in-car apologies (humble register decoding at speed).

### M4. Counters as actually used — entry N5
**Gap/pain:** ~600 counters are documented (飯田朝子『数え方の辞典』, "~600 助数詞や助数詞と同じ働きをする名詞" — [JapanKnowledge](https://japanknowledge.com/contents/kazoekata/)), but real usage concentrates in a tiered core: Tofugu's field survey — 2 "absolutely must-know," 17 "must-know," 47 "common" ([tiered list](https://www.tofugu.com/japanese/japanese-counters-list/)). Learners are overwhelmed by the long tail and retreat to つ/個 ([WaniKani thread](https://community.wanikani.com/t/question-regarding-japanese-counters/44292)); classifier semantics are late-acquired even in L1 ([Journal of Child Language](https://www.cambridge.org/core/journals/journal-of-child-language/article/acquisition-of-the-semantics-of-japanese-numeral-classifiers-the-methodological-value-of-8F0D389E4FEA365374BAC00CD21264F2), abstract-level). The JLPT never requires *producing* the right counter under time pressure — exactly what ordering does.
**Sources:** Tofugu's tiering (2/19/66 syllabus shape); counter usage embedded in the M2 flow inventories.
**Escalation:** N5 core (つ・個・人・枚・本・杯) in ordering contexts → N4 time/frequency counters → N3 production under time pressure → N2 formal counting (名様) and irregular readings.

### M5. Casual speech & contractions — entry N4
**Gap/pain:** Official level descriptors never specify register ([level summary](https://www.jlpt.jp/e/about/levelsummary.html)); casual speech surfaces only passively near N1 in listening ([prep-guide observation](https://migaku.com/blog/japanese/jlpt-listening-section)). A Nagoya University study of contracted forms (縮約形) found statistically significant native–learner gaps in *use* even where knowledge exists (JSL t(29)=3.810, p<.01; JFL t(29)=14.538, p<.001) ([symposium PDF](https://www.lang.nagoya-u.ac.jp/nichigen/menu7_folder/symposium/pdf/4/06.pdf); extraction partial — percentages UNVERIFIED). The N1-but-can't-converse phenomenon is industry lore ([renshuu thread quoting Waseda teachers](https://www.renshuu.org/forums/topics/1429/JLPT+versus+fluency); [language-school director, Jan 2026](https://nihongo-career.com/tips/2026/01/11/why-jlpt-scores-dont-guarantee-you-can-speak-japanese/)).
**Sources:** documented contraction inventories with mappings (てしまう→ちゃう, ておく→とく, なければ→なきゃ, い-drop) — [jn1et.com teacher catalog](https://jn1et.com/shukuyaku-tannshuku/), [sci.lang.japan FAQ](https://www.sljfaq.org/afaq/colloquial-contractions.html). Contractions are *rule-mapped to standard forms*, so items can be generated as transforms of already-verified dataset items.
**Escalation:** N4 core contractions of known grammar (ちゃう/てる/とく) → N3 broad inventory + じゃん/かも → N2 っす-register and speed parsing → N1 overlapping, natural-speed casual conversation.

### M6. Onomatopoeia in daily use — entry N4
**Gap/pain:** Dictionary-scale category — 『擬音語・擬態語4500 日本語オノマトペ辞典』 carries 4,500 entries in its title ([publisher](https://www.shogakukan.co.jp/books/09504174)); mimetics are "among the most difficult challenges for those learning Japanese" ([Inose, translation-studies paper](https://www.intercultural.urv.cat/media/upload/domain_317/arxius/TP1/InoseOnomatopoeia.pdf)); learners: "there's really no easy way except to abuse the hell out of them" ([renshuu thread](https://www.renshuu.org/forums/topics/5358/Memorising+onomatopoeia)). Coursebooks under-serve the category enough that pedagogy papers propose manga as the delivery channel ([Idrus 2024](https://journal.unhas.ac.id/index.php/nawa/article/download/36712/11974/121005)).
**Sources:** NINJAL's public categorized onomatopoeia resource (4 semantic families — [www2.ninjal.ac.jp/Onomatope](https://www2.ninjal.ac.jp/Onomatope/category.html)); JMdict on-mim-tagged entries as the importable base.
**Escalation:** N4 physical daily set (ぺこぺこ, ばたばた) → N3 texture/manner in descriptions → N2 emotional nuance → N1 register-appropriate use in narrative.

### M7. Keigo in service & workplace — entry N4 (recognition), N3+ (production)
**Gap/pain:** The JLPT tests keigo morphology as recognition grammar (~N4: いらっしゃる, でございます — [JLPT Sensei N4 list](https://jlptsensei.com/jlpt-n4-grammar-list/)) but can never test situational production (no speaking section). Learner fear is concrete: "It's one of the things stopping me from using Japanese at work… I'm always terrified of not being polite enough" ([WaniKani thread](https://community.wanikani.com/t/how-to-learn-keigo/37545)); a 2025 study of advanced learners found persistent respectful/humble selection errors driven by lack of authentic practice and feedback ([Khasanah & Andari 2025](https://journal.lifescifi.com/index.php/RH/article/view/787)). The clincher: **even natives struggle** — in the Bunkachō FY2021 survey, of respondents seeing problems in their own usage, 46.4% cited 「敬語を適切に使えない」 ([MEXT summary PDF](https://www.mext.go.jp/content/20221221-mxt_syoto01-000026652_3.pdf)) — and companies buy new-hire keigo training as a product ([Recurrent](https://www.recurrent.jp/listings/freshers-follow-communication-honorific); [Insource](https://www.insource.co.jp/shinjin/bsm_mancom2.html)).
**Sources:** keigo transforms are rule-mapped (行く→いらっしゃる/参る), so drills derive from verified base verbs; service scripts from M2/M3 inventories; corporate-training curricula as situation lists (interview, phone, reception, apology).
**Escalation:** N4 recognition of the core system → N3 customer-side production (requests, replies) → N2 staff-side scripts, interviews, phone Japanese → N1 judgment calls (when *not* to use keigo; baito-keigo vs. standard; degrees of humility).

### M8. Bureaucracy navigation — entry N4
**Gap/pain:** Government survey data (FY2024, n=7,621): at public institutions, 16.2% "didn't know where to consult," 8.4% found "no interpreters available or too few"; 17.0% cite "limited multilingual information," 9.1% "limited information available in easy Japanese"; discrimination reported "when opening bank accounts" (10.4%), "applying for credit cards" (10.0%), "during procedures at public institutions" (6.6%), "contracting mobile phone services" (6.3%) ([FY2024 summary PDF](https://www.moj.go.jp/isa/content/001450859.pdf)). The state's own remedy — the ISA/Bunkachō やさしい日本語 guidelines ([portal](https://www.moj.go.jp/isa/support/portal/plainjapanese_guideline.html); [PDF](https://www.bunka.go.jp/seisaku/kokugo_nihongo/kyoiku/pdf/92484001_01.pdf)) — doubles as evidence (it exists because counters are impenetrable) and as a content source: it reports ~63% of foreign residents manage daily life in Japanese and 76% prefer easy Japanese for official information (vs 68% English).
**Sources:** やさしい日本語 rewrite pairs (bureaucratic Japanese ↔ plain Japanese = graded reading material); form vocabulary (住民票, 印鑑, 記入, 押印) from JMdict; municipal plain-Japanese guides ([Kawasaki example](https://www.city.kawasaki.jp/250/page/0000127357.html)).
**Escalation:** N4 form-field literacy (氏名/住所/生年月日) → N3 city-hall/post-office dialogues → N2 banking and phone-contract terms, consent clauses → N1 official notices in full bureaucratic register, and their やさしい日本語 equivalents as parallel texts.

### M9. Medical & emergency language — entry N5 (safety-critical core), N4+ (full)
**Gap/pain:** FY2024 survey: 10.2% "couldn't accurately communicate symptoms at hospital," 8.7% couldn't find language-accessible hospitals, 6.5% "couldn't read or write hospital documents"; in disasters 7.0% "didn't know where to get reliable information" (11.8% didn't know evacuation sites in quake-hit Hokuriku) ([same PDF](https://www.moj.go.jp/isa/content/001450859.pdf)). Peer-reviewed: Vietnamese migrants reporting healthcare-access difficulty had markedly worse self-rated health (OR 2.35/2.75), with Japanese proficiency cited among barriers ([PMC11659696](https://pmc.ncbi.nlm.nih.gov/articles/PMC11659696/)).
**Sources:** the official 多言語医療問診票 (free, 23 languages, by specialty — [kifjp.org/medical](https://kifjp.org/medical/)) is a ready-made bilingual item bank; FDMA's multilingual ambulance guide and 119 resources ([FDMA](https://www.fdma.go.jp/publication/portal/post1.html); [measures incl. Net119](https://www.fdma.go.jp/mission/enrichment/gaikokujin_syougaisya_torikumi/torikumi.html)); Tokyo's official ambulance-call script ([Tokyo Metro. Gov.](https://www.hokeniryo.metro.tokyo.lg.jp/iryo/iryo_hoken/medical_info/emergency_call)).
**Escalation:** **N5 emergency micro-script (119, address, 助けてください) taught early regardless of level** → N4 body/symptom vocabulary → N3 problem descriptions + questionnaire filling → N2 understanding diagnoses/pharmacy instructions → N1 consent forms and insurance paperwork (bridges into M8).

### M10. Handwritten & stylized text — entry N4
**Gap/pain:** Print-trained learners demonstrably fail on handwriting ([WaniKani: "One does not simply read handwritten kanji"](https://community.wanikani.com/t/one-does-not-simply-read-handwritten-kanji/55527); [handwriting thread](https://community.wanikani.com/t/japanese-handwriting/71247)). The government certifies the problem for *natives*: the Bunkachō's 2016 指針 (guide on printed vs. handwritten kanji shapes) exists because shape differences "become a problem at counters" — its press release uses 令 as the flagship print-vs-handwritten example and reports a survey of 68 municipal counters on glyph-shape disputes ([press release PDF](https://www.bunka.go.jp/koho_hodo_oshirase/hodohappyo/pdf/2016022902.pdf); [main page](https://www.bunka.go.jp/seisaku/kokugo_nihongo/kokugo_shisaku/94336801.html)). UNVERIFIED: no large-scale quantitative study of *learner* handwriting-reading failure was found — evidence is forum/teacher testimony plus the native-facing government record; module priority is therefore slightly lower and it should be framed as "documented variation + anecdotal learner pain."
**Sources:** the 指針's character-by-character variant index ([index](https://www.bunka.go.jp/seisaku/kokugo_nihongo/kokugo_shisaku/joyokanjihyo_sakuin/index.html)) = authoritative variant-pair inventory; KanjiVG strokes for handwriting-style rendering; same-string-multiple-fonts rendering (明朝/ゴシック/教科書体/handwriting fonts) is procedurally cheap.
**Escalation:** N4 kana + high-frequency kanji across three print fonts → N3 教科書体/handwriting-style forms of known kanji (指針 pairs as distractors) → N2 menu/signboard stylization → N1 rapid mixed-style reading (izakaya menus, memos).

**Module priority by evidence strength:** government-survey-backed (M8, M9) and government-documented-register (M2, M7, M10) modules carry the strongest justification; M1, M4, M5 rest on solid inventories + academic studies; M3, M6 on documented formulaic registers and dictionary scale with practitioner evidence. All ten stay in scope; evidence strength should drive build order in Session 4+.

---

## 5. Interleaving architecture — no silo

The failure mode to avoid is the "culture corner": a separate real-world menu that competes with the JLPT track for session time and dies. The architecture instead makes real-world modules **retrieval contexts for the same items the JLPT track teaches**.

**Principle 1 — one item pool, many contexts.** Real-world scenes are built *from* the learner's JLPT-track item state: a konbini scene pulls 温める, 袋, 弁当 (all N5-tagged JMdict items) into a new register. Re-encountering known words in varied contexts is evidence-backed: varied-context exposure produced better learning of word meanings than repeated single-context exposure (Bolger, Balass, Landen & Perfetti 2008, *Discourse Processes* — [verified](https://sites.pitt.edu/~perfetti/PDF/Context%20variation%20Bolger%20et%20al.pdf)); and informative contexts during reading match or beat pure retrieval opportunities for contextualized vocabulary (van den Broek et al. 2022, *Cognitive Science* — [verified](https://pmc.ncbi.nlm.nih.gov/articles/PMC9285746/)). Design consequence: module scenes should be **majority known-item** (new items are the minority), making them consolidation events that *feel* like content.

**Principle 2 — escalating stakes on the same items** (the brief's own example, now concretized from cited inventories): 袋/温める learned as N5 vocabulary → recognized inside レジ袋はご利用ですか／温めますか at the konbini (M2, N5–N4) → produced customer-side (M2/M7, N3) → decoded and produced staff-side in full keigo, including baito-keigo variants natives themselves dispute (M2+M7, N2). Same lexical items; register, speed, and role escalate. This is how one loop scales N5→N1 without content redesign — the escalation dimensions (register, speed, role, audio quality, formality judgment) are orthogonal to the item pool.

**Principle 3 — schedule by SRS, deliver by scene.** The SRS decides *what* is due; the scene assembler decides *where* it resurfaces (drill, konbini, station PA, form-filling). Spacing is the strongest lever we have — distributed practice is among the most robust effects in learning science (Cepeda et al. 2006 meta-analysis of 839 assessments — [verified](https://pubmed.ncbi.nlm.nih.gov/16719566/); optimal gaps scale with retention goals, Cepeda et al. 2008 — [verified](https://journals.sagepub.com/doi/abs/10.1111/j.1467-9280.2008.02209.x)), and retrieval beats restudy for vocabulary specifically (Karpicke & Roediger 2008, *Science* — [verified](https://web.mit.edu/jbelcher/www/learner/retrieval.pdf)). **Honest caveat, recorded now for Session 3–4:** the schedule *shape* matters less than its existence — expanding intervals showed no reliable advantage over equal spacing in lab studies (Karpicke & Bauernschmidt 2011 — [verified](https://pubmed.ncbi.nlm.nih.gov/21574747/)) and only a limited advantage in an L2 study (Nakata 2015 — [verified](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/effects-of-expanding-and-equal-spacing-on-second-language-vocabulary-learning/D1D796306985C52F9BE7A1200AC50DB9)). So: a simple, load-smoothed scheduler over a fancy one.

**Principle 4 — interleave what confuses, block what's new.** The interleaving evidence is strong for *discriminating similar categories* (Rohrer 2012 — [verified](https://digitalcommons.usf.edu/psy_facpub/1755/)) — but the Brunmair & Richter (2019) meta-analysis found that for **word-based materials, blocking outperformed interleaving** ([verified, PMID 31556629](https://pubmed.ncbi.nlm.nih.gov/31556629/)). Design consequence: introduce new vocabulary in small blocked sets; interleave at the *review* layer and for confusable inventories — kanji lookalikes, similar grammar points, counter choices, keigo direction (respectful vs. humble) — where discrimination is the actual skill. This nuance is a differentiator: naive "interleave everything" designs fight the evidence.

**Principle 5 — modules unlock by item-state, not by menu.** A module scene becomes available when the learner's known-item coverage for that scene crosses a threshold (e.g., the N4 announcement template unlocks when its slot vocabulary is Guru-equivalent). Mid-level entrants (placement-tested — Session 3 covers this, grounded in CAT/IRT: Weiss & Kingsbury 1984 — [verified](https://experts.umn.edu/en/publications/application-of-computerized-adaptive-testing-to-educational-probl/)) start with the modules their item state already supports. Desirable-difficulty framing (Bjork & Bjork 2011 — [verified chapter PDF](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)) applies: scenes should sit slightly above comfort, never entirely novel.

**Content-integrity note (per D-002).** Every scene's language payload decomposes into dataset-verified items (JMdict/KANJIDIC2/Tatoeba, Waller tags) plus rule-derived transforms (keigo forms, contractions — each transform rule carrying a grammar-point citation). Model-written text is limited to connective scenario framing *around* those verified items and never supplies readings, meanings, or usage claims. Scene templates from documented inventories (announcement scripts, konbini flows, 問診票 fields) are facts about registers, cited per module above.

---

## 6. Notes for Session 3 (non-binding)

- The three design concepts must each show how **scenes-as-retrieval-contexts** (P4/P5 from `research.md` §6 + §5 here) implement disguised repetition with one item pool and orthogonal escalation dimensions.
- Placement testing: item-state initialization via a short adaptive probe (kanji recognition → vocab → grammar), CAT-style; a Quartet-I entrant (the project owner's case) should land ~N4/N3 boundary with M2/M3/M5 partially unlocked on day one.
- Quartet integration hook: map Quartet I/II lesson indices to grammar-point IDs (our curated list anchors textbook chapters — §3.3), so textbook progress seeds the SRS.
- Honest-limitations carry-over: browser TTS (ja-JP) quality varies by platform — module M3 (announcements) and M5 (casual speed) are where TTS limits bite hardest; Session 3 designs must degrade gracefully (recorded-audio-optional architecture, text-first drills).
- Per D-003: GSAP-grade motion is part of the disguise budget — scene transitions and mastery-transformation effects (world text de-translating) are where it pays.

---

## 7. Source index

All accessed 2026-07-11. Grouped; one line on what each supports. (Sources also cited inline above.)

**JLPT officialdom & the list problem**
- https://www.jlpt.jp/e/reference/pdf/guidebook_s_e.pdf — 2009 guidebook: 4→5 levels; FAQ Q7: specifications not to be published
- https://www.jlpt.jp/e/faq/index.html — current FAQ: no lists; official substitutes
- https://www.jlpt.jp/e/about/points.html — no speaking/writing sections
- https://www.jlpt.jp/e/about/levelsummary.html — official can-do level definitions
- https://doi.org/10.24546/0100493764 — Ishikawa 2025: research gap from undisclosed criteria
- https://www.jstage.jst.go.jp/article/jtje/19/0/19_19/_pdf/-char/ja — Matsushita: field still uses old-JLPT lists
- https://www.edrdg.org/kanjidic/kanjidic2_dtdh.html — jlpt field = former levels; "no official kanji lists… for the new levels"

**Lists, counts, licenses**
- http://www.tanos.co.uk/jlpt/sharing/ — Waller CC BY license
- http://www.tanos.co.uk/jlpt/jlpt5/ …jlpt4/ …jlpt3/ …jlpt2/ …jlpt1/ — per-level cumulative figures
- https://github.com/elzup/jlpt-word-list — counted vocab CSVs (tanos-derived)
- https://github.com/davidluzgouveia/kanji-data — counted N-level kanji tags (Waller-credited)
- https://github.com/stephenmk/yomitan-jlpt-vocab — best-documented tanos-derived dataset; "educated guess" caveat
- https://jisho.org/about — jisho tags from Waller
- https://jlptsensei.com/jlpt-n5-grammar-list/ (…n4/n3/n2/n1) — grammar counts 84/132/182/197/253
- https://jlptsensei.com/jlpt-n5-kanji-list/ (…n4/n3/n2/n1) — kanji counts 80/167/370/374/1504
- https://bunpro.jp/decks/bunpro — Bunpro grammar/vocab deck counts
- https://www.edrdg.org/edrdg/licence.html — EDRDG CC BY-SA 4.0 + attribution rules
- https://www.edrdg.org/jmdict/j_jmdict.html — JMdict project page
- https://www.edrdg.org/kanjidic/kanjd2index_legacy.html — KANJIDIC2 coverage
- http://kanjivg.tagaini.net/ — KanjiVG CC BY-SA 3.0
- https://tatoeba.org/en/terms_of_use — CC BY 2.0 FR
- https://tatoeba.org/en/stats/sentences_by_language — 249,077 Japanese sentences
- https://jhlee.sakura.ne.jp/JEV/ — JEV 17,908 headwords; no redistribution
- http://www17408ui.sakura.ne.jp/tatsum/database.html — VDRJ canonical page (HTTP 503 this pass)
- https://www.tofugu.com/reviews/quartet-vol1/ — Quartet ≈ N3 textbook anchor

**Real-world module evidence** (per module, §4)
- https://www.moj.go.jp/isa/content/001450859.pdf — FY2024 Basic Survey English summary (M8/M9 percentages)
- https://www.moj.go.jp/isa/support/coexistence/04_00017.html — survey hub
- https://www.moj.go.jp/isa/support/portal/plainjapanese_guideline.html + https://www.bunka.go.jp/seisaku/kokugo_nihongo/kyoiku/pdf/92484001_01.pdf — やさしい日本語 guidelines (+63%/76% stats)
- https://www.city.kawasaki.jp/250/page/0000127357.html — municipal plain-Japanese example
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11659696/ — healthcare-access study (OR 2.35/2.75)
- https://kifjp.org/medical/ — 多言語医療問診票 (23 languages)
- https://www.fdma.go.jp/publication/portal/post1.html + https://www.fdma.go.jp/mission/enrichment/gaikokujin_syougaisya_torikumi/torikumi.html — FDMA 119 resources
- https://www.hokeniryo.metro.tokyo.lg.jp/iryo/iryo_hoken/medical_info/emergency_call — Tokyo ambulance-call script
- https://cotoacademy.com/japanese-train-announcements-meaning-%E3%81%A7%E3%82%93%E3%81%97%E3%82%83-%E3%82%A2%E3%83%8A%E3%82%A6%E3%83%B3%E3%82%B9/ — announcement script inventory
- https://mynihongosensei.com/how-to-understand-japanese-announcements-in-trains-stations/ — announcements as failure point
- https://ling-app.com/blog/japanese-train-announcements/ — announcement phrases
- https://www.japan-guide.com/forum/quereadisplay.html?0+114324= — traveler decoding thread
- https://cotoacademy.com/convenience-store-japanese/ — konbini scripts
- https://livejapan.com/en/article-a0001719/ — clerk phrases (keigo forms)
- https://gogonihon.com/en/blog/japanese-for-the-convenience-store/ — konbini phrases
- https://blog.duolingo.com/japanese-convenience-store-vocabulary/ — konbini register (mainstream acknowledgment)
- https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/kokugo_yoronchosa/pdf/h25_chosa_kekka.pdf — FY2013 baito-keigo survey (63.5%/55.0%/66.3%/54.5%)
- https://www.nikkei.com/article/DGXMZO82543200Z20C15A1000000/ — よろしかったでしょうか controversy
- https://www.mext.go.jp/content/20221221-mxt_syoto01-000026652_3.pdf — FY2021 survey: 46.4% of self-critical natives can't use keigo
- https://journal.lifescifi.com/index.php/RH/article/view/787 — Khasanah & Andari 2025 keigo acquisition
- https://community.wanikani.com/t/how-to-learn-keigo/37545 — keigo fear thread
- https://www.recurrent.jp/listings/freshers-follow-communication-honorific + https://www.insource.co.jp/shinjin/bsm_mancom2.html — corporate keigo training
- https://www.lang.nagoya-u.ac.jp/nichigen/menu7_folder/symposium/pdf/4/06.pdf — contraction knowledge-use gap study
- https://www.renshuu.org/forums/topics/1429/JLPT+versus+fluency — N1-can't-speak thread
- https://nihongo-career.com/tips/2026/01/11/why-jlpt-scores-dont-guarantee-you-can-speak-japanese/ — school director on the gap
- https://jn1et.com/shukuyaku-tannshuku/ + https://www.sljfaq.org/afaq/colloquial-contractions.html — contraction inventories
- https://migaku.com/blog/japanese/jlpt-listening-section — casual speech passive at N3–N1
- https://www.shogakukan.co.jp/books/09504174 + https://www.kinokuniya.co.jp/f/dsg-01-9784095041742 — 4,500-entry onomatopoeia dictionary
- https://www2.ninjal.ac.jp/Onomatope/category.html — NINJAL onomatopoeia resource
- https://www.intercultural.urv.cat/media/upload/domain_317/arxius/TP1/InoseOnomatopoeia.pdf — mimetics difficulty
- https://www.renshuu.org/forums/topics/5358/Memorising+onomatopoeia — learner pain thread
- https://journal.unhas.ac.id/index.php/nawa/article/download/36712/11974/121005 — Idrus 2024 (coursebooks under-serve onomatopoeia)
- https://japanknowledge.com/contents/kazoekata/ — 数え方の辞典: ~600 counters
- https://www.tofugu.com/japanese/japanese-counters-list/ — counter tiering 2/19/66, ~500 exist
- https://community.wanikani.com/t/question-regarding-japanese-counters/44292 — counter overwhelm thread
- https://www.cambridge.org/core/journals/journal-of-child-language/article/acquisition-of-the-semantics-of-japanese-numeral-classifiers-the-methodological-value-of-8F0D389E4FEA365374BAC00CD21264F2 — L1 classifier acquisition (abstract-level)
- http://www.lingref.com/bucld/44/BUCLD44-35.pdf — L2 numeral-quantifier acquisition
- https://www.bunka.go.jp/koho_hodo_oshirase/hodohappyo/pdf/2016022902.pdf + https://www.bunka.go.jp/seisaku/kokugo_nihongo/kokugo_shisaku/94336801.html — 2016 指針: handwritten-vs-print problem, 令 example
- https://www.bunka.go.jp/seisaku/kokugo_nihongo/kokugo_shisaku/joyokanjihyo_sakuin/index.html — 指針 variant index
- https://community.wanikani.com/t/one-does-not-simply-read-handwritten-kanji/55527 + https://community.wanikani.com/t/japanese-handwriting/71247 — handwriting pain threads
- https://user.keio.ac.jp/~rhotta/hellog/2013-10-28-1.html — gairaigo 9.8%→33.8% (NINJAL surveys)
- https://www.sanseido-publ.co.jp/np/detail/11064/ + https://dictionary.sanseido-publ.co.jp/dict/ssd11064 — katakana dictionary ~58,500 entries
- https://www2.ninjal.ac.jp/gairaigo/ + https://www.ninjal.ac.jp/archives/genzai/ishiki/ — NINJAL loanword replacement proposals + surveys
- https://www.cambridge.org/core/journals/english-today/article/reflection-on-japans-language-policy-for-english-loanwords/B3721D2D53850EDF40A66DACC86F2EF4 — loanword policy analysis
- https://en.wikipedia.org/wiki/List_of_gairaigo_and_wasei-eigo_terms + https://www.tofugu.com/japanese/wasei-eigo/ — false-friend inventories
- https://www.hpu.edu/research-publications/tesol-working-papers/spring-2022/8michaloski_waseieigo.pdf — wasei-eigo comprehension study

**Learning science (all verified against publisher/index pages)**
- https://pubmed.ncbi.nlm.nih.gov/16719566/ — Cepeda et al. 2006 (spacing meta-analysis)
- https://journals.sagepub.com/doi/abs/10.1111/j.1467-9280.2008.02209.x — Cepeda et al. 2008 (temporal ridgeline)
- https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x — Roediger & Karpicke 2006 (testing effect)
- https://web.mit.edu/jbelcher/www/learner/retrieval.pdf — Karpicke & Roediger 2008 (retrieval, vocabulary)
- https://pubmed.ncbi.nlm.nih.gov/31556629/ — Brunmair & Richter 2019 (interleaving meta-analysis; blocking wins for words)
- https://digitalcommons.usf.edu/psy_facpub/1755/ — Rohrer 2012 (interleaving for discrimination)
- https://eric.ed.gov/?id=EJ786797 — Rohrer & Taylor 2007 (shuffled practice)
- https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf — Bjork & Bjork 2011 (desirable difficulties)
- https://sites.pitt.edu/~perfetti/PDF/Context%20variation%20Bolger%20et%20al.pdf — Bolger et al. 2008 (context variation)
- https://pmc.ncbi.nlm.nih.gov/articles/PMC9285746/ — van den Broek et al. 2022 (informative context vs retrieval)
- https://pubmed.ncbi.nlm.nih.gov/17576148/ — Karpicke & Roediger 2007 (expanding vs equal, short/long term)
- https://pubmed.ncbi.nlm.nih.gov/21574747/ — Karpicke & Bauernschmidt 2011 (absolute spacing, schedule shape null)
- https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/effects-of-expanding-and-equal-spacing-on-second-language-vocabulary-learning/D1D796306985C52F9BE7A1200AC50DB9 — Nakata 2015 (L2 spacing schedules)
- https://eric.ed.gov/?id=EJ912810 — Nakata 2011 (flashcard software criteria)
- https://andymatuschak.org/files/papers/Seibert%20Hanson%20and%20Brown%20-%202020%20-%20Enhancing%20L2%20learning%20through%20a%20mobile%20assisted%20sp.pdf — Seibert Hanson & Brown 2019/2020 (Anki adherence, "bitter pill")
- https://eric.ed.gov/?id=EJ1226279 — Loewen et al. 2019 (Duolingo case study)
- https://experts.umn.edu/en/publications/application-of-computerized-adaptive-testing-to-educational-probl/ — Weiss & Kingsbury 1984 (CAT)
- https://books.google.com/books/about/Item_Response_Theory_for_Psychologists.html?id=g19UvgAACAAJ — Embretson & Reise 2000 (IRT)
- https://eric.ed.gov/?id=EJ1344545 — Huang et al. 2022 (language CAT validation)
- https://eric.ed.gov/?id=EJ1245270 — Sailer & Homner 2020 (gamification meta-analysis, caveats)
- https://archive.org/details/movingbeyondplat0000rich — Richards 2008 (intermediate plateau; practitioner reference)

---

*End of Session 2. Next: Session 3 — three design concepts engineered around disguised repetition and the 6-level progression; STOP for concept selection.*
