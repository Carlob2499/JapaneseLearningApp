# Session 3 — Design Proposals

Three game concepts engineered around **disguised repetition** and a six-level progression, per the project brief. No app code in this phase. One concept will be selected before architecture (Session 4).

**Method note.** Every research citation below comes from the **verified citation bank** built in Sessions 1–2 (each reference was checked against a publisher/index page on 2026-07-11; see `docs/curriculum.md` §5/§7 and `docs/research.md`). Market claims reference the Session 1 competitor audit (`research.md`, patterns **P1–P8** in its §6). No new factual research is introduced in this document; anything stated as an engineering judgment (TTS behavior, input methods) is labeled as such and slated for a Session 4 validation spike.

**The six-level progression** used by all three concepts:

| App level | Curriculum anchor | Content gate (from `curriculum.md`) |
|---|---|---|
| L0 | Kana + survival micro-scripts | kana sets; emergency micro-script (M9-N5 core); katakana decoding entry (M1) |
| L1 | ≈ N5 | ~718 vocab / ~79 kanji / ~84–132 grammar points |
| L2 | ≈ N4 | cum. ~1,386 vocab / ~245 kanji |
| L3 | ≈ N3 | cum. ~3,525 vocab / ~612 kanji |
| L4 | ≈ N2 | cum. ~5,273 vocab / ~979 kanji |
| L5 | ≈ N1 | cum. ~7,972+ vocab / ~2,211 kanji (jōyō ceiling 2,136 + common extras) |

Counts are the community-estimate envelope from `curriculum.md` §3 (spread disclosed in-app per D-005). Real-world modules M1–M10 interleave throughout per `curriculum.md` §5 — they are retrieval contexts, not a separate menu.

---

## 0. The shared engine (all three concepts run on this)

The three concepts are different **camouflage** over one engine. This is deliberate: the engine is fixed by the architecture constraints (PWA, packs, SRS, content integrity), and it means the unpicked concepts survive as future *modes* rather than dead ends.

**E1 — One item pool, scheduled by SRS, delivered by scenes.** Items (vocab / kanji / grammar-point / phrase-template) live in JSON packs with provenance (D-002, D-005). A load-smoothed scheduler decides *what* is due; the scene assembler decides *where* it resurfaces. Spacing is the most robust lever available (Cepeda et al. 2006, meta-analysis of 839 assessments — [PubMed](https://pubmed.ncbi.nlm.nih.gov/16719566/); optimal gap grows with retention goal, Cepeda et al. 2008 — [Psychological Science](https://journals.sagepub.com/doi/abs/10.1111/j.1467-9280.2008.02209.x)). Schedule shape is deliberately simple: expanding intervals showed no reliable advantage over equal spacing (Karpicke & Bauernschmidt 2011 — [PubMed](https://pubmed.ncbi.nlm.nih.gov/21574747/); limited L2 advantage only, Nakata 2015 — [SSLA](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/effects-of-expanding-and-equal-spacing-on-second-language-vocabulary-learning/D1D796306985C52F9BE7A1200AC50DB9)). Anti-clumping load-shaping copies the one mechanic Renshuu verifiably got right (research.md P3).

**E2 — Varied retrieval cycling.** Each item cycles **recognition → recall → production → speed → context** as its SRS stage rises:

| Stage | Retrieval mode | Example surfaces |
|---|---|---|
| new | recognition (blocked intro, small sets) | match word↔meaning; spot on sign |
| young | cued recall | type reading; pick into sentence slot |
| maturing | production | construct reply; conjugate into register (keigo/casual transform) |
| mature | speed | timed decoding (announcement, checkout barrage) |
| burned-in | context | infer nuance in scene; notice wrong usage |

Retrieval as the learning event is the best-supported principle in the bank (Karpicke & Roediger 2008, *Science*, foreign-vocabulary paradigm — [PDF](https://web.mit.edu/jbelcher/www/learner/retrieval.pdf)); context variation improves meaning learning (Bolger et al. 2008 — [PDF](https://sites.pitt.edu/~perfetti/PDF/Context%20variation%20Bolger%20et%20al.pdf)); and informative contexts during reading are as good as or better than bare retrieval for contextualized vocabulary (van den Broek et al. 2022 — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9285746/)) — so the *context* stage is inference-rich, not another flashcard.

**E3 — Interleave what confuses, block what's new.** New vocabulary is introduced in small blocked sets; interleaving applies at review and to confusable inventories (kanji lookalikes, similar grammar, counter choice, keigo direction). This follows the evidence precisely: interleaving's strength is discrimination between similar categories (Rohrer 2012 — [USF](https://digitalcommons.usf.edu/psy_facpub/1755/)), while the Brunmair & Richter (2019) meta-analysis found **blocking beat interleaving for word-based materials** (g = −0.39 — [PubMed](https://pubmed.ncbi.nlm.nih.gov/31556629/)). Scenes sit slightly above comfort per desirable-difficulties framing (Bjork & Bjork 2011 — [chapter PDF](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)).

**E4 — Escalating stakes on the same items** (`curriculum.md` §5 P2): register, speed, role, audio quality, and formality-judgment escalate; the item pool does not fork. The concrete trace used throughout: 温める/袋 learned at L1 → recognized in 温めますか／レジ袋はご利用ですか (L1–L2, M2 inventory) → produced customer-side (L3) → decoded and produced **staff-side in keigo**, including native-disputed baito-keigo variants (L4, Bunkachō FY2013 survey items as the "disputed forms" bank).

**E5 — Placement by adaptive probe.** Mid-level entrants take a short CAT-style placement: kanji recognition → vocab → grammar, item difficulty ordered by level tags and KANJIDIC2 grade/frequency, converging on an item-state initialization rather than a single "level." Foundations: adaptive testing classifies accurately with fewer items (Weiss & Kingsbury 1984 — [UMN](https://experts.umn.edu/en/publications/application-of-computerized-adaptive-testing-to-educational-probl/)); IRT overview (Embretson & Reise 2000 — [Google Books](https://books.google.com/books/about/Item_Response_Theory_for_Psychologists.html?id=g19UvgAACAAJ)); a peer-reviewed language-CAT development model exists (Huang et al. 2022 — [ERIC](https://eric.ed.gov/?id=EJ1344545)). Honest scope: our probe is IRT-*informed* (difficulty-ordered adaptive branching over tagged items), not a validated IRT instrument — validation data doesn't exist pre-launch, and the in-app copy must not claim exam-grade placement. Placement seeds items as "provisionally known" (fast-track review, drop on first failure) so a Quartet-I entrant starts at ~L2/L3 boundary with M2/M3/M5 partially unlocked on day one, not at zero.

**E6 — Quartet/textbook hooks.** Our curated grammar list (D-005) carries textbook anchors; a "textbook mode" maps Quartet I/II and Genki I/II chapters to grammar-point IDs + vocab seeds (Quartet ≈ N3 anchor per [Tofugu's review](https://www.tofugu.com/reviews/quartet-vol1/), from the Session 1 bank). Finishing a Quartet chapter in class seeds those items into the SRS as "introduced elsewhere" — the game becomes the textbook's retrieval layer instead of competing with it.

**E7 — Packs and portability.** Content = versioned, Zod-validated JSON packs by level × module, each with license/provenance metadata (D-002/D-005); progress = a single exportable JSON (SRS states, scene history, settings hash) via file download/upload — no backend (brief). Pack import lets a teacher ship a custom scene pack (e.g., a class's vocabulary) that rides the same engine.

**E8 — Honest limitations (all concepts; to be stated in-app).**
- **Browser TTS (ja-JP)**: quality and voice availability vary by OS/browser; pitch-accent and prosody are unreliable — audio-dependent drills (M3 announcements, M5 casual speed) must degrade to text-first modes, and TTS output is labeled as synthetic with a quality caveat (brief requirement; engineering judgment to validate in a Session 4 spike, including which platforms expose usable ja-JP voices).
- **No speech recognition**: production is *typed/constructed* (kana IME, tile-assembly, conjugation pickers), never spoken-and-scored. We say so plainly rather than shipping fake "speaking practice" (Web Speech recognition is unreliable/network-bound across platforms — engineering judgment, same spike).
- **Handwriting**: recognition input is out of scope; M10 is *reading* handwritten/variant forms (rendering via fonts + KanjiVG-derived styles), plus optional self-graded tracing with the user's existing KanjiVG stroke tool as the reference.
- **Level tags are estimates** (D-005 disclosure, shipped in UI and pack metadata).
- **Gamification is a multiplier, not a mechanism**: effects are small-to-moderate and moderated (Sailer & Homner 2020 — [ERIC](https://eric.ed.gov/?id=EJ1245270)); retention rests on E1–E4, and the meta-game must never gate reviews (no Energy-style throttles — research.md, Duolingo backlash).
- **The "intermediate plateau"** is a practitioner construct we design *for* (content past N4 — the market gap), not a measured effect we claim to cure (Richards 2008 — [archive](https://archive.org/details/movingbeyondplat0000rich)).

Per **D-003**, all three concepts assume GSAP-grade motion on the Node.js → GitHub Pages pipeline: motion is part of the disguise budget (mastery-transformation effects, scene transitions), not decoration.

---

## Concept A — 「引っ越し」 *Hikkoshi: A Life in Japan*

**Fantasy.** You just moved to Japan with two suitcases and L0 Japanese. The game is your life, day by day: konbini runs, train commutes, a part-time job, city hall, a doctor's visit, a phone contract, eventually a career. The six levels are **life stages**: Tourist → Resident → Part-timer → Employee → Senior staff → "You handle it for someone else."

**Core loop (one session = one in-game day).** Morning planner shows 2–4 errands (scenes) picked by the scheduler from due items + unlocked modules; each errand is a real-world flow (M1–M10) whose interactions are retrieval events in disguise; the day ends with a diary auto-summary (a *reading* pass over today's items in new sentence contexts — the E2 context stage, van den Broek-style informative re-encounter). No review screen exists anywhere.

**Why repetition is invisible.** Errands recur because *life* recurs — nobody questions buying dinner again. The konbini scene is never the same twice: the scheduler recombines due items into the flow (different products, amounts, clerk questions), so the 40th konbini visit is the 40th unique exchange built from the same item pool (P4 narrative gating + P1 invisible scheduling).

**Escalating stakes (E4 trace).** L1: you point and survive the checkout. L2: you understand 温めますか and answer. L3: you handle a delivery redelivery call. L4: you're *behind* the counter part-time, producing the keigo script under time pressure. L5: you train the new hire — spotting *their* register errors (context-stage retrieval: error-noticing).

**Six-level scaling without redesign.** Scenes are templates with slots; levels change slot inventories, register, speed, and audio degradation — not scene code. New life stages reuse the same scene types with harder roles (customer→staff→trainer).

**Placement (E5).** The probe is diegetic: the "moving-in interview" at city hall (M8 framing). A Quartet-I entrant lands as Resident/Part-timer with konbini/transit/casual modules partially unlocked.

**Quartet hook (E6).** Textbook mode adds a "night class" calendar block: chapter completion seeds items; the next day's errands deliberately resurface them (retrieval within 24h, then per schedule).

**Packs (E7).** Scene-template packs per module; life-stage progression pack; city cosmetics.

**Specific risks / honest limits.** Broadest art/scene surface of the three (many locations) — mitigated by a stylized fixed-perspective look, but still the biggest content-authoring bill; life-sim framing risks feeling like chores if scene variety lags (the Duolingo mid-course "wears thin" failure, research.md P1); diary reading pass needs careful i+1 control. TTS limits hit M3/M5 scenes — text-first fallbacks per E8.

**What it steals:** Wagotabi's narrative gating (P4), Duolingo's invisible queue (P1), So to Speak's environment inference (P8), Renshuu's load smoothing (P3).

---

## Concept B — 「言葉探偵」 *Kotoba Detective*

**Fantasy.** You're the assistant at a tiny detective agency that takes "language cases": a mistranslated sign bankrupting a shop, a lost tourist, a suspicious contract, a poison-pen letter in handwritten kanji, a fraud hidden in keigo-polished emails. Levels are **case ranks** (missing cat → corporate fraud).

**Core loop (one session = one case beat).** Each beat: collect evidence (read signs/menus/notes — recognition), interview witnesses (assemble questions from tiles — production), decode records (announcements, receipts, handwriting — speed/context), then a deduction screen where you *bind* evidence (select which overheard word contradicts which document — pure context-stage discrimination). Cases are chains of beats; the scheduler decides which due items appear as evidence.

**Why repetition is invisible.** Evidence *must* be re-examined — rereading is the genre's native action. An item resurfaces across cases as "the same word in a new witness's mouth," and cross-case callbacks are the fiction's reward for the SRS's spacing.

**Escalating stakes (E4 trace).** 温める at L1 is a konbini receipt line; at L3 it's an alibi detail (何時に温めましたか); at L4 the suspect's keigo 温めさせていただきました is *suspiciously* over-polite — register knowledge becomes deductive evidence (E3 discrimination made diegetic: keigo direction, casual contractions, baito-keigo all become clue types).

**Six-level scaling.** Case generators consume level-gated item pools + module inventories (M3 announcements, M5 contractions, M10 handwriting via 指針 variant pairs as forged-note tells). Rank changes evidence register and speed, not mechanics.

**Placement.** The probe is the agency's "entrance exam" — a cold case whose evidence adaptively branches by difficulty.

**Quartet hook.** Chapter grammar arrives as "field manual" pages; the next case's generator guarantees those points appear as evidence.

**Packs.** Case-template packs (beat grammars + slot constraints) per level; module evidence banks.

**Specific risks / honest limits.** The strongest narrative pull and the best fit for discrimination-based interleaving (E3) — but **hand-authored mystery quality is the retention bottleneck**: procedurally recombined evidence is fine, procedurally *plotted* mysteries are not, so case templates need real writing per level (the Shashingo one-pass risk, P6, if the case supply runs dry). Model-written case framing must stay within D-002 (all language payload dataset-verified). Deduction UI is the hardest interaction design of the three. TTS: witness voices flagged synthetic; announcement evidence degrades to transcripts per E8.

**What it steals:** So to Speak's inference play (P8, 97% positive as a loop), LJRPG's adaptive re-exposure (P5 — world text de-translates as you master items: documents render more Japanese-only as their items mature), WaniKani's typed-recall rigor under the hood (P2's good half).

---

## Concept C — 「いらっしゃい！」 *Irasshai!* — RECOMMENDED

**Fantasy.** You work the counter. The game is a service-life sim where **you are the staff**: konbini night shift (L0–L1) → busy station kiosk (L2) → izakaya floor (L3) → hotel front desk (L4) → running your own place and training staff (L5). Customers come to *you* — an endless, procedurally recombined queue of due items wearing coats and asking questions.

**Core loop (one session = one shift).** Pre-shift prep (blocked intro of the day's few new items as "today's stock/menu" — E3 blocking done diegetically); the shift: customers arrive in waves, each interaction a retrieval event (recognize the request → recall the item → produce the reply in the right register → speed rounds at rush hour); post-shift till-count = a context-stage reading pass (complaints, notes, a handwritten supplier memo — M10). Meta: shop upgrades, regular customers with arcs, a shelf that *fills with mastered stock* (collection as visualization of the SRS, never as the retention mechanism — P6 caveat).

**Why this disguises repetition best.** Service work is culturally *understood* as repetitive-with-variation — the fiction absorbs infinite recurrence without breaking. The customer queue is literally the review queue, rendered as people: no pile anxiety (P2's failure mode), no visible numbers, and rush hour turns the speed stage into the game's excitement peak instead of a stress metric. Renshuu-style anti-clumping (P3) becomes "the manager schedules your shifts."

**Why player-as-staff is the pedagogical win (and unique in the market).** Every audited competitor puts the learner customer-side or observer-side (research.md §3–4). Staff-side flips the register economy: **you produce keigo constantly** (the #1 evidenced pain point — even 46.4% of self-critical natives report keigo trouble, and companies buy new-hire keigo training; curriculum.md M7) **while customers speak at you in casual speech** (M5's input gap) — a two-register loop in every single interaction, which is exactly the production/decoding pairing the JLPT structurally cannot test. Counters (M4) are forced naturally (ビール二杯, お箸二膳); baito-keigo (M2's disputed-forms bank) becomes an explicit "house style vs. textbook style" mechanic at L4; announcements (M3) arrive as the station kiosk's PA environment; bureaucracy (M8) arrives as the shop's paperwork (health permit, bank deposit, phone contract for the shop line); medical/emergency (M9) is the L0 first-aid-shelf micro-script plus the occasional unwell customer.

**Escalating stakes (E4 trace, fully concrete).** L1: customer asks 温めてください — you tap the microwave and echo はい、温めます. L2: you produce 温めますか？ yourself, unprompted, at speed. L3 (izakaya): 温かいのと冷たいの、どちらになさいますか — respectful-form production with counter choice. L4 (hotel): a guest's こちら、温めていただくことは可能でしょうか must be decoded *and* answered in matching register — and the game flags your reply if you produce 温めさせていただきます-style over-polite forms the Bunkachō survey items dispute (formality-judgment stage). L5: your trainee says 温めのほう、よろしかったでしょうか — you must *notice and coach* (error-noticing = burned-in context retrieval).

**Six-level scaling without redesign.** One interaction grammar (request → fulfill → close) at every level; venue tier swaps the item inventories, registers, speeds, and audio degradation. Venues are reskins of the counter loop — the art surface is one room per tier, the tightest scope of the three (matters for GSAP polish depth per D-003: fewer, juicier scenes).

**Placement.** The probe is the job interview + first trial shift — diegetic, short, adaptive (E5), and it naturally demonstrates the two-register loop from minute one. A Quartet-I entrant starts at the station kiosk with izakaya unlocking early.

**Quartet hook.** Chapter completion stocks "new menu items / new services" that guarantee next-shift appearances of the chapter's grammar+vocab (textbook as supplier).

**Packs.** Venue packs (interaction templates + register tables per tier), customer-archetype packs (casual/dialect/speed profiles), module event packs (paperwork days, PA environments, handwritten memos).

**Specific risks / honest limits.** Production-heavy design leans on typed/tile input ergonomics — must be excellent on mobile (no speech recognition, E8, stated in-app); the service fiction constrains story ambition vs. Concept B (regular-customer arcs mitigate); L5 "coach the trainee" needs a curated error bank (derivable from the disputed-forms survey items + rule-inverted transforms, staying within D-002); risk that non-service contexts (medical, bureaucracy) feel bolted on — mitigated by making them shop-life events, not menu items. TTS: customer lines are text-first with optional synthetic voice, PA ambience labeled per E8.

**What it steals:** Wagotabi's embedded SRS + narrative gating (P4), Renshuu's variety/load-smoothing (P3), LJRPG's visible mastery transformation (P5 — your shop's signage/menus render progressively more Japanese-only as items mature), collection-as-visualization done safely (P6), speed-as-excitement instead of speed-as-anxiety (P2 inversion).

---

## Comparison & recommendation

| Criterion | A · Hikkoshi | B · Kotoba Detective | C · Irasshai! |
|---|---|---|---|
| Repetition disguise strength | High (life recurs) | High (rereading is diegetic) | **Highest (service work absorbs infinite recurrence)** |
| Production practice (the JLPT gap) | Medium (customer-side mostly) | Medium (question assembly) | **Highest (keigo production is the core loop)** |
| Real-world module fit (M1–M10) | **Broadest** | Medium (as evidence) | High (all ten land diegetically) |
| Content-authoring bill | Highest (many locations) | High (hand-plotted cases) | **Lowest (one room per tier, procedural queue)** |
| Narrative pull | Medium | **Highest** | Medium (customer arcs) |
| One-pass content risk (P6) | Low | **Highest** | Low |
| Scope fit for GSAP polish (D-003) | Diluted across scenes | Medium | **Concentrated (few juicy scenes)** |
| Six-level scaling mechanism | Life stages (roles) | Case ranks (evidence) | Venue tiers (registers) — cleanest |

**Recommendation: Concept C — Irasshai!** It has the strongest disguise (the review queue *is* the customer queue), uniquely makes keigo **production** the core loop — the single best-evidenced gap in both the JLPT's design and every audited competitor — gets a two-register workout (polite output, casual input) into every interaction, carries the lowest authoring and art bill per unit of retention, and concentrates scope where D-003's motion polish pays most. Concept A's life-sim breadth survives as future "day off" episodes on the same engine (E1–E8 are shared), and Concept B's inference-deduction survives as an L4–L5 mini-mode (fraud-spotting paperwork events). Choosing C forecloses least.

**STOP.** Per the brief and D-004, this session ends here. Next session (4) begins `docs/architecture.md` for whichever concept is selected.

---

*Cross-references: competitor patterns P1–P8 — `research.md` §6; module evidence M1–M10 and interleaving principles — `curriculum.md` §4–5; decisions D-002/D-003/D-005 — `decisions.md`. All external citations above are from the Session 1–2 verified bank (verification passes recorded in each document's method section).*
