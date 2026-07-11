# Session 1 — Competitor Research & Coverage Audit

**Purpose.** Ground the design of a JLPT N5–N1 learning game (installable PWA) in verified competitor analysis, focused on the project's core design constraint — *maximum repetition without perceived repetition* — and on the market's known abandonment zone at N4–N3.

**Status:** Session 1 deliverable. Feeds Session 2 (curriculum & real-world scope) and Session 3 (design proposals).

---

## 1. Method & source standards

- All research was performed with live web fetches on **2026-07-11**; unless noted otherwise, "accessed 2026-07-11" applies to every URL in this document. Review scores and counts are **point-in-time snapshots** of that date.
- **Primary sources** (official sites, store listings, help docs, developer forum posts) are used for features, pricing, and content claims; **secondary sources** (press reviews, community forums, aggregators) for reception.
- "Review consensus" sections **characterize sentiment found in cited, fetched sources**. Direct quotes are verbatim copies from fetched pages. No quotes, statistics, or features are invented.
- Claims that could not be confirmed from a fetched page are marked **UNVERIFIED** inline. Conflicting sources are reported as conflicts, not silently resolved.
- Known collection limits of this pass: reddit.com blocks direct fetching (Reddit sentiment is represented via aggregating articles and via the WaniKani/Bunpro community forums, where the same learner population congregates); kickstarter.com and web.archive.org were unfetchable (affects Koe history); some Google Play listings truncated. Several reception sources (JLPT Samurai, Wanilog, JLPTLord) are independent enthusiast blogs, not academic references — they are used for analysis and endpoint estimates, labeled as such.

### Corrections to the project brief's assumptions (found during research)

| Brief assumed | Verified reality |
|---|---|
| Nihongo Quest N5 is a released visual novel | **Unreleased** turn-based JRPG, in private beta; release slipped to "late this year or early next" per dev (Jun 18, 2026) ([Steam](https://store.steampowered.com/app/1556070/Nihongo_Quest/), [dev thread](https://steamcommunity.com/app/1556070/discussions/0/688619018316277782/)) |
| Koe is 2014 Kickstarter vaporware | **Part 1 shipped Apr 18, 2024** — ten years late, story incomplete, Part 2 unreleased, dev silent since Feb 2025 ([Steam](https://store.steampowered.com/app/672430/Koe__Part_1/), [status thread](https://steamcommunity.com/app/672430/discussions/0/601895828709202331/)) |
| Shashingo published by Ratalaika | Self-published by **Autumn Pioneer** on Steam and Switch; no Ratalaika involvement in any fetched source ([Steam](https://store.steampowered.com/app/1632490/Shashingo_Learn_Japanese_with_Photography/), [Nintendo Life](https://www.nintendolife.com/news/2024/08/shashingo-learn-japanese-with-photography-snaps-up-september-release-date-on-switch)) |
| Learn Japanese RPG dev uncertain | **Study Bunny Games LLC** ([Steam](https://store.steampowered.com/app/1114950/Learn_Japanese_RPG_Hiragana_Forbidden_Speech/), [official site](https://www.learnjapaneserpg.com/)) |

---

## 2. Executive summary

1. **The market splits into two failure poles.** SRS-first apps (WaniKani, Anki-likes) expose repetition as a naked review queue and burn users out — the "review-pile spiral" is the documented central failure mode. Game-first titles hide repetition inside play but then **under-supply** it (Shashingo: all content collectable in ~2 hours, no scheduling) or cap content at beginner level (every verified game ≤ N5/partial-N4 except one unproven $60 outlier).

2. **Nobody delivers N5→N1 in one loop with disguised repetition.** The only products whose *content* spans N5–N1 are queue/quiz apps (Renshuu, MaruMori) or kanji-only (WaniKani). The only *game* claiming N5–N1 (Shujinkou, Feb 2025, $59.99) has 24 Steam reviews — critically praised, commercially dead. The niche this project targets is verifiably empty.

3. **The N4–N3 cliff is real and now well-evidenced.** Hard endpoints: Duolingo's course ≈ N4 by independent analysis; Genki ends ~N4; every 2025–26 game release except Shujinkou tops out at beginner level. Official JLPT 2025 statistics show **N3 is the single largest applicant pool (253,758 of 904,472, ~28%)** — demand peaks exactly where product supply stops. Community forums document a years-long "intermediate plateau" with no guided product continuation.

4. **The best disguise mechanics are already proven piecemeal, never combined at scale:** invisible scheduling (Duolingo's half-life regression — no visible review debt), narrative gating with embedded SRS (Wagotabi — 98% positive, 1,384 reviews), adaptive dialogue re-exposure (Learn Japanese RPG — dialogue swaps English→Japanese as items are learned), variety + anti-clumping + metagame skin (Renshuu). Session 3 should engineer one loop combining these, scaled N5→N1.

5. **Reception economics favor real pedagogy in game clothing at low price.** Wagotabi ($9.99, 98% of 1,384), Learn Japanese RPG ($19.99, 98% of 250), So to Speak ($17.99, 97% of 113) — versus Shujinkou ($59.99, 24 reviews) and WonderLang ($24.99, Mixed 45% of 11). Small, sincere, mechanically-sound titles win their niche; price and bloat kill.

---

## 3. Competitor profiles

### 3.1 Duolingo — Japanese course

**Core loop.** Short bite-size lessons on a linear path of themed units; exercises are word-bank translation, listening, matching, plus Japanese-specific hiragana/katakana/kanji tabs with tracing, spelling, and puzzle exercises ([Tofugu review](https://www.tofugu.com/japanese-learning-resources-database/duolingo-japanese/); [Duolingo blog, Sep 2023](https://blog.duolingo.com/learning-to-read-japanese-characters/)). Wrapper content: Stories, DuoRadio podcast episodes, Video Call ([Duolingo updates](https://blog.duolingo.com/duolingo-updates/)). Since July 2025, lessons consume **Energy** for free users — "each lesson uses a little bit of energy," refilling over ~a day or purchasable ([Duolingo blog, Jul 2025](https://blog.duolingo.com/duolingo-energy/)). UNVERIFIED: exact lesson duration; current speaking-exercise availability in the Japanese course specifically.

**Pedagogy.** Duolingo invented **half-life regression** spaced repetition — "We invented a new statistical model we call half-life regression (HLR)" — predicting per-word forgetting instead of fixed intervals ([Duolingo research blog](https://blog.duolingo.com/how-we-learn-how-you-learn/); [paper](https://research.duolingo.com/papers/settles.acl16.pdf)). There is **no user-visible review queue** — review is interleaved invisibly into the path. Grammar is implicit/inductive rather than explained; courses are CEFR-aligned. No kanji mnemonic system (kanji taught as whole-word recognition — criticized, see consensus). UNVERIFIED: the successor model "Birdbrain" (secondary coverage only); XP leagues (well known, but not on any page fetched this pass).

**Review consensus.** Apple App Store: **4.7/5, 5.3M ratings** ([App Store](https://apps.apple.com/us/app/duolingo-language-lessons/id570060128)). Praise centers on habit formation ("I'll give Duo this: it got me to open the app for 300 days straight" — Reddit user quoted in [JLPT Samurai's Reddit-consensus review, Nov 2025](https://jlptsamurai.com/2025/11/15/is-duolingo-japanese-good-for-beginners-the-ultimate-2025-review-and-reddit-opinions/)). Criticism: the grammar gap ("I feel like I'm fluent at 'The cat is eating the bread' but I have absolutely no idea what to do with a simple relative clause" — same source) and kanji-as-whole-words without radicals or readings. The 2025 Energy change drew press backlash: free users get 25 energy, "even perfect lessons result in depleted energy," exhausted within ~3 lessons ([Android Authority, Oct 2025](https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/)).

**Repetition handling.** Disguise via exercise-type variety, character/story wrappers, and **invisible scheduling** — with no visible pile there is no review-debt anxiety. Two failure modes: (a) users can't see or control what gets reviewed; (b) the disguise wears thin mid-course — "Once you get past the initial N5-level lessons, the course gets repetitive, slow, and the new material is just dumped on you without enough review" (JLPT Samurai Reddit aggregation, above). Post-2025, Energy throttles free sessions independent of performance, converting grind complaints into paywall complaints.

**JLPT coverage.** Independent analysis (Nov 2025): completing the course yields "the vast majority of N4 vocabulary and a solid, intuitive understanding of most N4 grammar," but it "does not reach a comfortable JLPT N3 level" — est. 60–70% N4 exam readiness, 20–30% N3 ([JLPT Samurai](https://jlptsamurai.com/2025/11/16/duolingo-japanese-to-jlpt-what-level-does-the-full-course-reach-n5-n4-n3-equivalence/)). **Conflict:** Duolingo announced (Apr 22, 2026) that Japanese is among nine courses now teaching "through B2 on the CEFR scale" ([Duolingo blog](https://blog.duolingo.com/courses-teach-advanced-content/)) — a CEFR claim postdating the independent analysis and not yet third-party assessed. Duolingo's own "teaches all vocabulary and grammar needed to pass JLPT N5" post now 404s — UNVERIFIED. **Abandonment point: the N4→N3 transition** (kanji production, systematic grammar, formal vocabulary).

**Platform/price/status.** iOS/Android/web; free tier (ads + Energy); Super/Max subscriptions — App Store IAP tiers $9.99–$119.99; May 2026 tracking: Super ~$12.99/mo or ~$83.99–95.99/yr, Max ~$29.99/mo ([dealnews price tracker](https://www.dealnews.com/features/duolingo/cost/); regional variance unreconciled). Extremely active development; the April 2025 "AI-first" memo and 148 AI-generated courses drew major backlash with no measurable usage damage — DAUs +40% YoY, >$1B revenue anticipated; CEO: "I said some stuff about AI, and I didn't give enough context… we got some backlash on social media" ([TechCrunch, Aug 2025](https://techcrunch.com/2025/08/07/the-backlash-against-duolingo-going-ai-first-didnt-even-matter/)).

### 3.2 WaniKani

**Core loop.** Web app, two activities: **Lessons** (mnemonics + quiz) and **Reviews** (a queue filling as SRS timers expire). Teaching chain: radical mnemonic → kanji meaning/reading via radical story → vocabulary using known kanji ([how it works](https://knowledge.wanikani.com/getting-started/how-wanikani-works/)). Reviews demand **typed recall** — "no multiple choice or self-evaluation allowed." Progression gated: 90% of a level's kanji to "Guru" unlocks the next of 60 levels; totals "2,000 kanji, 6,000 vocabulary words" ([unlocking](https://knowledge.wanikani.com/getting-started/unlocking-kanji/); [wanikani.com](https://www.wanikani.com/)). Community pace consensus: level 60 in ~1.5–2 years; max speed "not recommended" ([forum thread](https://community.wanikani.com/t/how-long-to-get-to-level-60-in-wanikani/67529)).

**Pedagogy.** Fixed-ladder SRS, publicly documented to the hour: Apprentice 4h→8h→1d→2d, Guru 1wk→2wk, Master 1mo, Enlightened 4mo → Burned; wrong answers drop stages by formula ([SRS stages](https://knowledge.wanikani.com/wanikani/srs-stages/)). Radical-composition mnemonics are the core device. **Deliberately kanji+vocab only** — no grammar, listening, speaking, or reading content. Gamification is thin (level-ups, themed level-group names 快/苦/死/地獄/天国/現実).

**Review consensus.** No official mobile app exists, so no app-store rating ([iOS app policy](https://knowledge.wanikani.com/api-and-third-party-apps/ios-app/)). Independent reviews: mnemonics "genuinely effective," but slow early levels, no skip option for prior knowledge, and JLPT misalignment — "WaniKani cannot guarantee you will have covered all N5 vocabulary by then—because that is simply not how its curriculum is organized" ([JLPTLord, Mar 2026](https://www.jlptlord.com/blog/wanikani-review)); "It gets you to L60 in 18–24 months… roughly 2,000 kanji," but "one of the worst ways to spend $9–299 if you only review sporadically" ([Wanilog](https://wanilog.com/guides/is-wanikani-worth-it)).

**Repetition handling.** WaniKani **does not disguise repetition at all** — it is a naked, numbered review queue, and that number is the product's central failure mode. Canonical burnout spiral, documented on its own forum: a returning user facing "~1200 reviews… ~1000 apprentice items" at 60–70% accuracy ([forum thread](https://community.wanikani.com/t/stuck-with-1000-pile-of-reviews-and-apprentices/66955)); coping mechanisms (vacation mode, capping Apprentice at ~100–150, deliberate pacing) are community-evolved survival lore rather than product design. It also *manufactures* grind: no level-skipping regardless of prior knowledge (JLPTLord). **Lesson for us: honesty about repetition without camouflage or load-smoothing produces burnout as the default outcome.**

**JLPT coverage.** Kanji only, ordered by WaniKani's own composition logic, not JLPT lists: ~99% of N5 kanji by ~level 10 falling to ~64% of N1 kanji at level 60, full set ≈ Joyo+ ([Wanilog JLPT tables](https://wanilog.com/jlpt); UNVERIFIED: percentages are that site's computation — wkstats.com requires login). Zero coverage of every non-kanji JLPT section at every level. **Abandonment: a WaniKani-only learner can read 2,000 kanji but cannot parse a sentence or follow speech.**

**Platform/price/status.** Web only; $9/mo, $89/yr, $299 lifetime; free = levels 1–3 ([plans](https://knowledge.wanikani.com/account-and-membership/payment-and-billing/subscription-plans/); [free tier](https://knowledge.wanikani.com/getting-started/payment-and-billing/wanikani/wanikani-free/)). Actively curated — content additions/movements announced for July 8–29, 2026 ([forum announcement](https://community.wanikani.com/t/wanikani-content-additions-and-movements-wednesday-july-8-2026-wednesday-july-29-2026/74990)); steady maintenance, no expansion of scope.

### 3.3 Renshuu

**Core loop.** Dashboard → "mastery schedules" (JLPT-, textbook-, or self-directed paths) → daily lessons introducing vocab/kanji/grammar with pictures and audio → the day's SRS quiz pile in varied formats (multiple choice, typing, drag-and-drop, listening) ([renshuu.org](https://www.renshuu.org/); [Coto Academy review](https://cotoacademy.com/learning-japanese-with-renshuu-app-review/)). Daily pacing is a default, not a paywall ([forum](https://eu.renshuu.org/forums/topics/15080/Do_we_have_to_wait_every_day_for_more_lessons_or_do_we_have_to_pay_to_keep_learn)). Correct answers feed a mascot/garden/quest metagame (Kao-chan).

**Pedagogy.** Custom adaptive SRS, not stock SM-2: per-mastery-level base intervals adjusted by each term's success history, with an **anti-clumping scheduler** — it "picks an ideal date based on the above parameters… then creates a bit of space on each side (usually about 10-20%)" and drops the item on the lightest day ([developer's own explanation](https://www.renshuu.org/forums/topics/630/SRS+in+renshuu+vs.+Anki)). Mastery is global across the site. Content stats: "over 2,000 colorful mnemonics," 12,000+ kanji, 800+ grammar expressions, 15,000+ native-recorded audio files, 160,000 example sentences ([App Store](https://apps.apple.com/us/app/renshuu-japanese-learning/id1542730063)). Six+ word games (Quick Draw, Shiritori Cat, Counter Punch, Crosswords, multiplayer Shiritori, Hanko Maker).

**Review consensus.** App Store **4.9/5, 1.3K ratings**; "This app rolls up all of the previous apps I've used to learn Japanese all into one place" (App Store review, NoerOnus222). Google Play figures UNVERIFIED-direct (listing truncated; aggregators suggest ~4.84/5, ~14K ratings via [AppBrain](https://www.appbrain.com/app/renshuu-japanese-learning/com.renshuu.renshuu_org) snippet, direct fetch 403). Community praise for comprehensiveness, grammar, and the responsive solo dev; the recurring criticism is UI — "It has the worst UI/UX I have encountered in the last 10 years. It's bloated, buggy and counter-intuitive" ([WaniKani forum thread](https://community.wanikani.com/t/renshuu-is-toooo-underrated/68944)); "there's no oral component (unless you join the Discord community)" (Coto).

**Repetition handling.** The strongest *app-side* disguise stack found: format variety, word games, mascot/garden/quests, anti-clumping load smoothing, and daily pacing framed as burnout protection. Notably, **fetched complaints center on UI clutter, not grind** — indirect evidence the disguise works. UNVERIFIED: recent collectible/Kao-Manga reward mechanics (search snippets only).

**JLPT coverage.** Full N5→N1 across vocab, kanji, grammar, plus textbook packs (Genki, Tobira, Minna no Nihongo, Japanese for Busy People) and beyond-JLPT Kanji Kentei content ([renshuu.org](https://www.renshuu.org/); [grammar library](https://www.renshuu.org/index.php?page=grammar%2Fmain)). Whether quality holds at N1: UNVERIFIED — no direct testimony fetched either way. **Abandonment point: output skills — no speaking/production practice.**

**Platform/price/status.** Web/iOS/Android; generous free tier; Pro $3.99–6.99/mo, $49.99–59.99/yr, $109.99–129.99 lifetime (App Store IAPs). Built and run since ~2001 by creator Michael Hominick with a tiny team ([2014 interview](https://blog.learnwitholiver.com/the-story-behind-japanese-learning-website-renshuu-org/); [site credits](https://www.renshuu.org/index.php?page=misc%2Fcopyright)). Live forum activity within hours of the research pass ([forums](https://www.renshuu.org/forums)); note the legacy news page is stale (stops May 2021) — contradicted by live activity.

### 3.4 Shashingo: Learn Japanese with Photography

**Core loop.** First-person exploration of a small fictional Japanese shopping street; photographing an object generates a bilingual photo flash-card (Japanese + English + native audio) stored in an album with mastery stickers. Opt-in drills: "Find Mode" (locate the object for a given word) and "Quiz Mode" (multiple choice for cosmetic-filter currency), added May 2024 ([Steam](https://store.steampowered.com/app/1632490/Shashingo_Learn_Japanese_with_Photography/); [update history](https://steamcommunity.com/app/1632490/allnews/)). Romaji/kana/furigana/kanji display toggle; day/night and weather cycles.

**Pedagogy.** **No SRS** — mastery stars only, no scheduled review. Recognition-focused (object↔word); no production or conversation. Native audio per card. No JLPT mapping; grammar limited to browsable manual pages — it "lacks basics and interactions showing how Japanese is actually used" ([Nintendo World Report](http://www.nintendoworldreport.com/review/69291/sashingo-learn-japanese-with-photography-switch-review)).

**Review consensus.** Steam **Very Positive — 90% of 640 reviews** (store page; [Steambase](https://steambase.io/games/shashingo-learn-japanese-with-photography) computes 740/810 = 91.4%; both live same day, likely filter differences — reported as a conflict). Press: Siliconera 80 — "feels like the sort of edutainment game that you use in conjunction with other learning tools to help make learning a language more fun" ([Siliconera](https://www.siliconera.com/review-shashingo-learn-japanese-with-photography-is-more-fun-than-flashcards/)); NWR 70 — "could be a great supplemental tool… but it falls a bit short as a full method to learn Japanese and as a photography videogame."

**Repetition handling.** Disguise = collection completion (photo album) plus opt-in drills. The evidence says it's thin: the full set of **145 photographable words** can be collected "in about 2 hours," with 400+ words total on cards, and nothing schedules re-encounters ([Steam discussion](https://steamcommunity.com/app/1632490/discussions/0/4407417073566521472/)). Both press reviews independently converge on "supplement, not a method" — **the canonical game-first failure: one-pass content, retention outsourced to the player.**

**JLPT coverage.** No JLPT claims; beginner urban vocabulary only (~145 objects / 400+ card words; ~580 incl. phrase pages UNVERIFIED verbatim). A Steam thread asking whether it's worth buying at N3 implies the low ceiling ([thread](https://steamcommunity.com/app/1632490/discussions/0/4355617421467952140/)). No expansion roadmap found. **Abandonment: after one evening.** Real-world relevance: it *is* signage/urban-object literacy — the one axis where it's ahead of the JLPT apps.

**Platform/price/status.** Steam (Windows) $19.99 + $3.49 filter DLC, released Feb 27, 2024; Switch $20, Sep 3, 2024 ([Nintendo Life](https://www.nintendolife.com/news/2024/08/shashingo-learn-japanese-with-photography-snaps-up-september-release-date-on-switch)). Solo dev, Autumn Pioneer (name reported both as "Ryan Winters" ([shashingo.com](https://shashingo.com/)) and "Ryan Pocock" ([Metacritic](https://www.metacritic.com/game/shashingo-learn-japanese-with-photography/)) — unresolved discrepancy). Last update May 25, 2025; **no visible update in the ~13 months since — content-complete/dormant** ([news feed](https://steamcommunity.com/app/1632490/allnews/)).

### 3.5 Wagotabi: A Japanese Journey

**Core loop.** Top-down 2D RPG through *real* Japan (currently 2 playable prefectures in the San'in region): walk around towns, talk to NPCs **entirely in progressively-introduced Japanese**, progress by quests and language-driven puzzles; advancement gated by in-dialogue comprehension checks and mini-games ([Steam](https://store.steampowered.com/app/2701720/Wagotabi_A_Japanese_Journey/); [wagotabi.com](https://www.wagotabi.com/); [Destructoid](https://www.destructoid.com/in-terms-of-games-that-try-to-teach-japanese-wagotabi-might-be-the-real-deal/)).

**Pedagogy.** The strongest game-embedded pedagogy verified in this audit: a real built-in SRS ("benefit from our SRS tool pin-pointing your weaknesses" — [App Store](https://apps.apple.com/us/app/wagotabi-learn-japanese/id6474207287)), 15+ question types including sentence construction, conjugation, and audio; kana/kanji stroke-order practice; a "Kanjidex" collection; explicit grammar explanations; content ordered "according to the JLPT standard, beginning with N5." Fully voiced: +2,600 voiced Japanese dialogues (official site). Mixes recognition AND production.

**Review consensus.** Steam **Overwhelmingly Positive — 98% of 1,384 reviews** (recent: 98% of 66); iOS 4.9/5 (~1.4K ratings); Play ~4.89/5 (~4.2K — UNVERIFIED exact, fetch truncated). Destructoid: "It combines a lot of conventional study methods into an interactive experience with a more practical way of applying what you've learned" (while calling the art "butt ugly"). Learner forums praise it as a complement to SRS apps; main criticism is the ceiling — it will become "far too easy for more advanced learners" ([WaniKani forum](https://community.wanikani.com/t/wagotabi-learn-japanese-with-a-video-game/68460)).

**Repetition handling.** **Dual-layer, and the best model found:** (a) narrative gating forces immediate and repeated use — "grammar that is taught is used immediately in sentences so the players are exposed to that grammar point over and over again" (user RainbowBrite13, WaniKani thread); (b) the SRS layer schedules weak items independently of story progress. The retention risk is not shallowness but the content ceiling.

**JLPT coverage.** Partial N5 today: dev statement (Aug 13, 2025) — "a bit more than 300 words," "around 150 kanji," mostly N5 with some N4/N3 items ([dev post](https://steamcommunity.com/app/2701720/discussions/0/597409017434828634/)); site now lists +400 words/grammar points, +195 kanji, +600 sentences. Roadmap: complete 5 prefectures ≈ full N5, ~1,000 words; "We might continue after (N4, N3 levels, ...) but those stages are not decided yet" (same dev post). The oft-cited 47-prefecture N5→N1 vision is community-relayed, not committed (official wiki fetch 403 — UNVERIFIED). **Abandonment: mid-N5 today; N4+ undecided.**

**Platform/price/status.** iOS/Android $4.99 each, Steam $9.99 (Win/Mac/Linux, Deck Verified), one-time, ad-free; mobile launch Oct 2024 (exact day UNVERIFIED), Steam Aug 13, 2025 ([FAQ](https://www.wagotabi.com/faq) — team of 4 working "on our free time"). **Extremely active:** hotfixes every 3–5 days, content update May 19 2026, latest hotfix Jul 9 2026 ([news feed](https://steamcommunity.com/app/2701720/allnews/)).

### 3.6 Nihongo Quest (N5)

**Core loop (as designed — unreleased).** Turn-based JRPG (not a visual novel): "Battle wild characters, students, and evil forces using the Japanese learned in the game," plus handwriting practice, town-building from your vocabulary list, and timed mini-games ([Steam](https://store.steampowered.com/app/1556070/Nihongo_Quest/)). A 2020 "MMO" framing is no longer in current marketing — multiplayer status UNVERIFIED ([news blog](https://nihongoquest.com/blogs/news)).

**Pedagogy (claimed).** "Review using an automatically created, personalized review schedule" (SRS-like); 1,500+ words/characters and 80+ grammar points to N5; "Native Japanese are creating and reviewing the sentences" ([FAQ](https://nihongoquest.com/pages/faqs)). Handwriting = production; battles = recognition. Voice acting: not claimed anywhere fetched — likely absent, UNVERIFIED.

**Review consensus.** **None exists — the game is unreleased** with zero Steam reviews. The only substantial community signal is delay frustration: dev (Jan 1, 2026): final beta "March/April," release "shortly thereafter"; revised (Jun 18, 2026): "Full release will be either late this year or early next year" ([forum](https://steamcommunity.com/app/1556070/discussions/0/688619018316277782/)). Development history: alpha/beta 2020–21, Next Fest demo Oct 2021, official blog stale since ~2021.

**Repetition handling.** On paper the most SRS-app-like of the games (personalized schedule + battles/handwriting/town-building/mini-games as retrieval variety). **No independent evidence — treat all retention claims as marketing until release.**

**JLPT coverage.** N5 at launch; homepage markets "From あ to N1" as aspiration with no dated roadmap ([nihongoquest.com](https://nihongoquest.com/)). No N4 sequel exists.

**Platform/price/status.** Planned Steam Win/Mac/Linux, mobile ports "planned"; price unannounced; Steam page says 2026; "100% self-funded" (Melon Mint Games). Chronic slippage is the story: this is the cautionary tale for scope promises. UNVERIFIED: earlier targets of Jan 2022/Q3 2023 (third-party listing snippets).

### 3.7 Koe (声) — Part 1

**History (key finding).** Not vaporware but a ten-year odyssey ending in half a game: Kickstarted Feb–Mar 2014 by Jitesh Rawal (Derby, UK) — **£75,167 raised on a £35,000 goal, 4,169 backers** ([Kicktraq](https://www.kicktraq.com/projects/297265509/koe-a-jrpg-with-japanese-at-the-core-of-gameplay/); [SoraNews24, 2014](https://soranews24.com/2014/03/28/play-video-games-learn-japanese-crowdfunded-jrpg-koe-reaches-its-goal-with-cash-to-spare/)). "Nearly 2 years worth of delays" already by Dec 2015 ([GeekySweetie](https://geekysweetie.com/koe-jrpg-learn-japanese-vocabulary-kickstarter/)); backer alpha builds from Feb 2018 ([dev post](https://steamcommunity.com/app/672430/discussions/0/3377008022021548249/)); **Part 1 released Apr 18, 2024** ([Steam](https://store.steampowered.com/app/672430/Koe__Part_1/)). Kickstarter pages, archive.org, and the official site were unfetchable this pass (403/blocked/503) — original delivery promise UNVERIFIED.

**Core loop.** Exchange student in rural Sakurachou: explore, talk to NPCs, learn kana/vocabulary, then turn-based battles in a parallel fantasy world where collected Japanese words are your items/spells — "your words will be your most powerful weapon"; you "level the individual Kana" (Steam page).

**Pedagogy.** No SRS documented anywhere. Learning-through-use: vocabulary built "through repeated use rather than rote memorization" ([SoraNews24](https://soranews24.com/2014/03/28/play-video-games-learn-japanese-crowdfunded-jrpg-koe-reaches-its-goal-with-cash-to-spare/)); kana→kanji→basic conversation scope ([GIGAZINE, 2014](https://gigazine.net/gsc_news/en/20140327-learn-japanese-rpg-koe/)); an in-game Japanese-level setting strips translations at higher settings ([player thread](https://steamcommunity.com/app/672430/discussions/0/4363500448196560980/)).

**Review consensus.** Steam **Mixed — 68% of 16 reviews**, $19.99 ([Steambase](https://steambase.io/games/koe-%E5%A3%B0-part-1/steam-charts) computes 71/100 from 24 total — conflict from review-subset rules). Reach is essentially zero: **all-time peak 21 concurrent players**, ~1 through 2025–26 (Steambase). Release-day threads mix praise for atmosphere with launch bugs ([thread](https://steamcommunity.com/app/672430/discussions/0/4363500448196509392/)).

**Repetition handling.** The JRPG loop *is* the disguise — word-grinding reframed as combat/leveling — but with no scheduling layer beneath it. Dominant community complaint is about *waiting*, not grinding.

**JLPT coverage.** "Koe is designed with absolute beginners in mind" (dev, Apr 2024, quoted in the level thread); community ceiling assessment in the same thread: "Nothing of this sort ever goes much beyond N4." Kana→N5-ish. **Abandonment: immediately post-beginner — and literally mid-story: Part 1 ends incomplete; Part 2 (promised as a free update) is unreleased, with dev silence since Feb 2025** ([status thread](https://steamcommunity.com/app/672430/discussions/0/601895828709202331/)).

**Platform/price/status.** Steam Win/Mac/Linux, $19.99. The 2014 PS Vita stretch-goal never materialized. Effective status: **dormant, half-shipped.**

### 3.8 Learn Japanese RPG: Hiragana Forbidden Speech

**Core loop.** Comedic story-driven RPG (640×480 legacy engine) where **combat is a typing drill** — type the romaji/reading of kana/words to attack; multiple-choice mode for Steam Deck. Between battles, long voice-acted dialogue scenes deliver story and 50+ grammar tutorials. Signature mechanic: the **Adaptive Dialogue System** — "Dialogue changes from English to Japanese as you learn and progress" — swapping a sentence's English for Japanese only once every word in it is learned ([Steam](https://store.steampowered.com/app/1114950/Learn_Japanese_RPG_Hiragana_Forbidden_Speech/)). 18+ hour campaign.

**Pedagogy.** Recall-heavy (typing readings = production, not recognition). "Small Step Immersion": newly learned kana immediately recur in dialogue and battles. 4,000+ lines by professional Japanese voice actors. **No formal SRS** — spacing emerges from story-driven recurrence; a post-launch "Kanji Mode" (Mar 21, 2025) added dedicated practice for its 136 kanji ([news feed](https://steamcommunity.com/app/1114950/allnews/)).

**Review consensus.** Steam **Very Positive — 98% of 250 reviews** ([Steambase](https://steambase.io/games/learn-japanese-rpg-hiragana-forbidden-speech): 99/100 from 264). Users report it genuinely works for kana: "I finished the game and learned them all in two weeks and 20 hours of total play time" (xwaix); "my progression in Japanese has improved more in days than it did in MONTHS of trying," though "this isn't a well-rounded, comprehensive introduction" (Monkeypro) ([Steam reviews](https://steamcommunity.com/app/1114950/reviews/?browsefilter=toprated)). Press cooler: Gamecritics 6/10 — "a genuinely helpful tool for anyone curious about learning Hiragana," criticizing pacing ("excessive text windows"), "rapid introduction of new vocabulary making retention difficult," and scatterbrained vocab order ([Gamecritics](https://gamecritics.com/rorenado/learn-japanese-rpg-hiragana-forbidden-speech-review/)).

**Repetition handling.** Disguise = adaptive immersion: every learned item keeps resurfacing in voiced dialogue and battle, so re-exposure is constant and story-motivated rather than deck-based — and players credit exactly this for retention. Counter-evidence (Gamecritics): **intake pacing** is the weak point — new vocab arrives faster than it settles. Net: sufficient repetition for a tiny scope; retention bounded by that scope.

**JLPT coverage.** Pre-N5 slice: full hiragana, 136+ kanji, ~240 words, basic grammar. **No katakana** — the learner exits with hiragana-only literacy. No sequel or roadmap announced ([official site](https://www.learnjapaneserpg.com/)).

**Platform/price/status.** Steam Windows, $19.99; Early Access Oct 2022 → 1.0 Dec 14, 2023; Kanji Mode Mar 2025; last news Sep 1, 2025; an in-progress Unity engine port was announced (year displayed ambiguously — UNVERIFIED) ([news feed](https://steamcommunity.com/app/1114950/allnews/)). Dev: Study Bunny Games LLC.

---

## 4. 2025–2026 releases

Live sweep of Steam/app stores/community, fetched 2026-07-11. The window produced one breakout hit (Wagotabi's PC launch, §3.5), one big-budget curiosity, and several mid-size beginner titles. **Honest negative:** the sweep found **no verifiable major "AI-tutor with game mechanics" launch** in 2025–26 — that space is a long tail of small undated web apps (existence verifiable, launch dates and traction not; UNVERIFIED beyond existence).

| Title | Dev / date / price | What it is | Level | Reception (2026-07-11) |
|---|---|---|---|---|
| **Shujinkou** | Rice Games, Feb 13 2025, $59.99 | Story-driven turn-based dungeon crawler, 80+ hr; optional layered learning: kana/vocab/grammar **spanning N5–N1**, multiple script modes ([Steam](https://store.steampowered.com/app/1386630/Shujinkou/)) | N5–N1 (claimed) | 91% positive of **only 24 reviews**; strong critic scores on page; commercially dead — plausibly the $60 price |
| **So to Speak** | Erik Andersen, Mar 31 2025, $17.99 | Inference-puzzle game: decode signs/conversations from context, no translations given; ~650 words ([Steam](https://store.steampowered.com/app/1779030/So_to_Speak/)) | Zero-beginner | **Very Positive — 97% of 113** |
| **WonderLang Japanese** | bair games, Jul 15 2025, $24.99 | Fantasy RPG with SRS "combat," kanji drawing, speech-recognition challenges; difficulty modes very-beginner/N5/N4 ([Steam](https://store.steampowered.com/app/3506220/WonderLang_Japanese/)) | ≤N4 | **Mixed — 45% of 11** |
| **MaruMori (mobile)** | Lucien Bos / small team, iOS live (roadmap: full release Q2 2025) | Web platform's app: lessons + SRS, "in-depth grammar lessons for every level (N5–N1)"; roadmap shows N3 completed Q1 2025, N2 begun Q2 2025 — roadmap claims, not verified shipped ([changelog](https://marumori.io/changelog?entry=302867168); [App Store](https://apps.apple.com/us/app/marumori/id6642702724)) | N5→N1 (building) | 5.0★ but **only 7 ratings** |
| Learn Japanese Kana & Vocab with Sushi | The Farting Cat, Mar 7 2025, $7 | Sushi-minigame edutainment, kana + vocab ([Steam](https://store.steampowered.com/app/3319740/Learn_Japanese_Kana__Vocab_with_Sushi/)) | Kana–N3 vocab (claimed) | 91% of 35 |

Pipeline non-events, verified: **Nihongo Quest N5 still unreleased** (§3.6); **Koe Part 2 unshipped** (§3.7). Significance of the sweep: **MaruMori is the only 2025 launch explicitly building intermediate (N3→N2) content** — the market's response to the gap this project targets is one small web platform, zero games.

---

## 5. Coverage audit — where each product abandons the learner

Levels reflect *verified shipped content* as of 2026-07-11, not marketing. ◐ = partial. Sources: per-product profiles above.

| Product | Kana | N5 | N4 | N3 | N2 | N1 | Real-world / survival content | Abandonment point |
|---|---|---|---|---|---|---|---|---|
| Duolingo JP | ✓ | ✓ | ✓ | ◐ (B2 claimed Apr 2026, unassessed; independent est. 20–30% N3) | — | — | some situational themes (not audited) | N4→N3: kanji production, systematic grammar |
| WaniKani | — (assumes kana) | ✓ kanji only | ✓ kanji only | ◐ kanji only | ◐ kanji only | ◐ kanji only (~64% by L60) | none | Everything but kanji/vocab, at every level |
| Renshuu | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | counters, textbook packs; no speaking | Output skills (no production/conversation) |
| Shashingo | ✓ (display toggle) | ◐ vocab (~400 words) | — | — | — | — | **signage/urban-object literacy** (its whole premise) | After ~2 hours; no review scheduling |
| Wagotabi | ✓ + stroke order | ◐ (~400 words, 195 kanji) | — (undecided) | — | — | — | real geography, travel framing | Mid-N5 today; N4+ roadmap undecided |
| Nihongo Quest | (unreleased) | planned | — | — | — | — | — | Unreleased; "From あ to N1" is aspiration only |
| Koe Part 1 | ✓ | ◐ | — | — | — | — | rural-Japan exchange-student framing | Post-beginner + mid-story (Part 2 unshipped) |
| Learn Japanese RPG | ◐ **hiragana only** | ◐ (~240 words, 136 kanji) | — | — | — | — | anime-register vocab | No katakana; hiragana-only literacy |
| Shujinkou | ✓ | ✓ claimed | ✓ claimed | ✓ claimed | ✓ claimed | ✓ claimed | — | Nothing pedagogical verified beyond store claims; no player base |
| MaruMori | ✓ | ✓ | ✓ | ✓ (roadmap: done Q1 2025) | ◐ (begun Q2 2025, roadmap) | claimed | none audited | Output skills; roadmap claims unverified as shipped |

**No product in this audit covers, in any verified source: keigo in service/workplace situations, bureaucracy navigation, medical/emergency language, train announcements, handwritten/stylized font reading, or konbini/restaurant interaction flows.** (Absence claim — based on all pages fetched this pass; Session 2 will define these modules.) The closest gestures: Shashingo's signage literacy and Wagotabi's real-geography travel framing.

### The N4–N3 cliff — evidence

**Hard data (documented endpoints).** Duolingo ≈ N4 (§3.1). Every verified 2025–26 game except Shujinkou tops out at beginner level (§4). Textbooks: the canonical chain ends at Genki II (~N4) → Quartet Vol. 1 "designed for learners roughly around the N3 level," explicitly positioned as fixing the post-Genki gap where Tobira meant "a steep difficulty increase" ([Tofugu Quartet review](https://www.tofugu.com/reviews/quartet-vol1/)); a Bunpro community count: Tobira covers only **128/217 N3 and 43/210 N2 grammar points** (community-computed, user Cfergu01 — [thread](https://community.bunpro.jp/t/what-textbooks-take-you-through-n3-level-grammar/53089)). Even textbook coverage fragments at N3.

**Hard data (official JLPT statistics, July 2025 session** — [JLPT stats archive](https://www.jlpt.jp/e/statistics/archive/202501.html); totals: [archive index](https://www.jlpt.jp/e/statistics/archive.html), 1,940,852 applicants across both 2025 sessions):

| Level | Applicants | Examinees | Certified | Pass rate |
|---|---|---|---|---|
| N5 | 80,916 | 65,483 | 33,242 | 50.8% |
| N4 | 207,901 | 178,849 | 65,850 | 36.8% |
| N3 | **253,758** | 218,726 | 83,120 | 38.0% |
| N2 | 224,658 | 193,909 | 65,735 | 33.9% |
| N1 | 137,239 | 112,262 | 31,460 | 28.0% |

Two readings (pass rates computed from the table): pass rates cliff after N5 (50.8% → ~34–38% for N4–N2 → 28% N1), and **N3 is the single largest applicant pool (~28% of 904,472)** — tested demand peaks exactly where product supply stops. Caveat: JLPT stats cannot directly measure beginner abandonment — casual N5-level learners mostly never sit the exam.

**Community sentiment (labeled as such; fetched threads).** "Hello from the Intermediate Plateau™. Has anyone got a map out of here?" — OP despite heavy study: "I still just… don't feel like I'm getting any better"; replies normalize a multi-year plateau whose only exit is self-directed native-material immersion ([WaniKani community, 2021](https://community.wanikani.com/t/hello-from-the-intermediate-plateau%E2%84%A2-has-anyone-got-a-map-out-of-here/51719)). "How Long is the Intermediate Plateau?" — "been in the intermediate plateau for the last 5 years"; "the intermediate plateau lasts just about forever" ([2018 thread](https://community.wanikani.com/t/how-long-is-the-intermediate-plateau/28536)). "Level 10, Genki I + II, now what?" — the archetypal post-N4 orientation crisis; answers are a DIY patchwork (Tobira, Bunpro, graded readers, NHK Easy), no guided product continuation ([2020 thread](https://community.wanikani.com/t/level-10-genki-i-ii-now-what/46900)). Further plateau threads surfaced in search with contents unfetched (titles only). Market corroboration: MaruMori explicitly built N3→N2 content through 2025 to serve this gap ([roadmap](https://marumori.io/changelog?entry=302867168)).

---

## 6. Repetition-disguise patterns — taxonomy from the evidence

The payload for Session 3. Each pattern is named, evidenced above, and given a verdict for our design.

**P1. Invisible scheduling (Duolingo).** HLR predicts per-item forgetting; review is woven into the path with no visible queue → no review-debt anxiety. *Failure modes:* learner has no control or transparency; when exercise variety is small relative to content length, the disguise wears off anyway ("repetitive, slow" mid-course). *Verdict: adopt the invisible-queue principle, but add opt-in transparency (a "why am I seeing this?" affordance) and enough retrieval-format variety to outlast long content.*

**P2. The naked queue (WaniKani, Anki).** No disguise; a number that grows when you rest. Evidence: the 1,000+-review pile spiral, vacation-mode-as-survival, community pacing lore. *Verdict: reject as primary UX. Retain what makes it work under the hood — typed recall rigor and honest SRS — but never render repetition as debt.*

**P3. Metagame skin + load smoothing (Renshuu).** Variety of question formats, word games, mascot/garden/quests, **anti-clumping scheduler** that spreads reviews onto light days, daily pacing as burnout protection. Complaints target UI, not grind — the disguise holds. *Verdict: adopt anti-clumping and daily-load shaping; execute the skin with far better UX.*

**P4. Narrative gating + embedded SRS (Wagotabi).** Story progress *requires* using each item repeatedly in comprehension checks; an SRS independently re-schedules weak items. Both layers hide in fiction. 98% positive at 1,384 reviews says players accept heavy repetition when it's the road, not a chore. *Verdict: core model to emulate — and extend past its ceiling (its open question, N4+, is exactly our project).*

**P5. Adaptive re-exposure (Learn Japanese RPG).** Learned items keep resurfacing in voiced dialogue (English→Japanese swap per mastered sentence); re-encounter is constant, story-motivated, and *visibly rewarding* (you watch text turn Japanese). *Failure mode is intake pacing, not re-exposure.* *Verdict: adopt the visible-mastery-transformation idea (world text progressively de-translating); control intake rate with the SRS.*

**P6. Collection/completion camouflage (Shashingo).** Photograph-to-collect with mastery stickers. Motivating but retention-free without scheduling: one pass, ~2 hours, done. *Verdict: collection is a valid hook, never a retention mechanism — pair any collection with scheduled resurfacing.*

**P7. Combat-as-drill (Koe, Shujinkou, WonderLang, Nihongo Quest's design).** Words as weapons/spells. Works as moment-to-moment disguise; fails when (a) no scheduler beneath it (Koe), (b) price/scope mismatch kills adoption (Shujinkou $60, WonderLang Mixed 45%). *Verdict: usable as one retrieval format among many — battles are a *mode*, not the architecture.*

**P8. Context-inference play (So to Speak).** Repetition hidden as re-reading the environment to decode meaning (97% positive). *Verdict: strong model for our real-world signage/announcement modules.*

**Cross-cutting conclusions.** (1) The winning combination — real SRS + varied retrieval formats + motivational fiction — exists piecemeal (P3+P4+P5) but never spans N5→N1. (2) Every game that nails the disguise caps content at beginner scope; every product with N1 content abandons the disguise. That two-sided failure is this project's opening. (3) Load shaping (P3) and intake pacing (P5's failure) are as important as disguise — burnout comes from schedule spikes, boredom from format scarcity. (4) Low price + sincere pedagogy + small polished scope earns outlier review scores; $60 comprehensive ambition earned 24 reviews.

---

## 7. Implications for our design (non-binding, for Session 3)

- Build **one loop** where narrative/goal progress (P4) sits on an invisible, load-smoothed SRS (P1+P3), with items cycling through many retrieval formats (recognition → recall → production → speed → context) so format variety outlasts six levels of content.
- Make mastery *visible in the world* (P5): environments/dialogue that de-translate as items are learned — a repetition reward the player can see.
- Reserve collection (P6) and combat (P7) as hooks/modes, never as the retention architecture.
- Real-world modules (signage, announcements — Session 2) fit P8's proven inference-play shape.
- The N4–N3 cliff is the market's open wound and our differentiator: design the loop so the *same items* escalate into harder real-world contexts (N5 konbini word → N2 keigo exchange), which no audited product does.
- Per decision **D-003** (docs/decisions.md): design proposals should assume GSAP-grade motion polish on the established Node.js → GitHub Pages static-deploy pattern; visual juice is part of the disguise budget.
- Pricing/scope lesson: ship sincere, small, polished increments (Wagotabi model), not a $60 monolith (Shujinkou model).

---

## 8. Source index

All accessed 2026-07-11. Grouped by subject; one-line note on what each supports.

**Duolingo**
- https://apps.apple.com/us/app/duolingo-language-lessons/id570060128 — 4.7/5.3M rating, IAP prices, update cadence
- https://blog.duolingo.com/duolingo-energy/ — Energy mechanics (primary)
- https://blog.duolingo.com/courses-teach-advanced-content/ — Apr 2026 B2 expansion incl. Japanese (primary)
- https://blog.duolingo.com/learning-to-read-japanese-characters/ — kana/kanji tab exercises (primary)
- https://blog.duolingo.com/duolingo-updates/ — CEFR alignment, DuoRadio/Video Call (primary)
- https://blog.duolingo.com/how-we-learn-how-you-learn/ — half-life regression (primary); paper: https://research.duolingo.com/papers/settles.acl16.pdf
- https://www.tofugu.com/japanese-learning-resources-database/duolingo-japanese/ — independent review (2017; dated)
- https://jlptsamurai.com/2025/11/15/is-duolingo-japanese-good-for-beginners-the-ultimate-2025-review-and-reddit-opinions/ — Reddit-consensus aggregation
- https://jlptsamurai.com/2025/11/16/duolingo-japanese-to-jlpt-what-level-does-the-full-course-reach-n5-n4-n3-equivalence/ — course endpoint ≈ N4
- https://techcrunch.com/2025/08/07/the-backlash-against-duolingo-going-ai-first-didnt-even-matter/ — AI-first backlash, financials
- https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/ — Energy backlash details
- https://www.dealnews.com/features/duolingo/cost/ — May 2026 price tracking

**WaniKani**
- https://www.wanikani.com/ and https://www.wanikani.com/kanji — totals, levels, marketing claims (primary)
- https://knowledge.wanikani.com/getting-started/how-wanikani-works/ — loop, typed recall (primary)
- https://knowledge.wanikani.com/getting-started/unlocking-kanji/ — gated progression (primary)
- https://knowledge.wanikani.com/wanikani/srs-stages/ — exact SRS ladder and penalty formula (primary)
- https://knowledge.wanikani.com/account-and-membership/payment-and-billing/subscription-plans/ — pricing (primary)
- https://knowledge.wanikani.com/getting-started/payment-and-billing/wanikani/wanikani-free/ — free tier (primary)
- https://knowledge.wanikani.com/api-and-third-party-apps/ios-app/ — no official mobile app (primary)
- https://wanilog.com/guides/is-wanikani-worth-it — independent verdict, queue-spiral warning
- https://wanilog.com/jlpt — JLPT kanji coverage by level (site's computation)
- https://www.jlptlord.com/blog/wanikani-review — independent review, JLPT misalignment
- https://community.wanikani.com/t/stuck-with-1000-pile-of-reviews-and-apprentices/66955 — burnout-spiral thread
- https://community.wanikani.com/t/how-long-to-get-to-level-60-in-wanikani/67529 — pacing consensus
- https://community.wanikani.com/t/wanikani-content-additions-and-movements-wednesday-july-8-2026-wednesday-july-29-2026/74990 — active curation, Jul 2026

**Renshuu**
- https://www.renshuu.org/ — features, N5–N1 claim, platforms (primary)
- https://apps.apple.com/us/app/renshuu-japanese-learning/id1542730063 — 4.9/1.3K, IAPs, content stats
- https://www.renshuu.org/forums/topics/630/SRS+in+renshuu+vs.+Anki — developer's SRS/anti-clumping explanation (primary)
- https://eu.renshuu.org/forums/topics/15080/Do_we_have_to_wait_every_day_for_more_lessons_or_do_we_have_to_pay_to_keep_learn — pacing is default, not paywall
- https://www.renshuu.org/forums/topics/12385/How_worth_it_would_you_consider_renshuu_pro_to_be — Pro value sentiment
- https://www.renshuu.org/index.php?page=grammar%2Fmain — grammar library N5–N1 filters (primary)
- https://www.renshuu.org/index.php?page=misc%2Fcopyright — credits (primary)
- https://cotoacademy.com/learning-japanese-with-renshuu-app-review/ — session structure, games, no-speaking criticism
- https://community.wanikani.com/t/renshuu-is-toooo-underrated/68944 — community praise/UI criticism
- https://blog.learnwitholiver.com/the-story-behind-japanese-learning-website-renshuu-org/ — founder/history (2014)
- https://www.appbrain.com/app/renshuu-japanese-learning/com.renshuu.renshuu_org — Play stats (snippet only; direct fetch 403)

**Shashingo**
- https://store.steampowered.com/app/1632490/Shashingo_Learn_Japanese_with_Photography/ — price, Very Positive 90%/640, features (primary)
- https://steambase.io/games/shashingo-learn-japanese-with-photography — alternate live count (740/810)
- https://steamcommunity.com/app/1632490/allnews/ — update history; dormancy since May 2025
- https://steamcommunity.com/app/1632490/discussions/0/4407417073566521472/ — 145 words, ~2h collection
- https://steamcommunity.com/app/1632490/discussions/0/4355617421467952140/ — "worth it at N3?" ceiling evidence
- https://www.siliconera.com/review-shashingo-learn-japanese-with-photography-is-more-fun-than-flashcards/ — press verdict
- http://www.nintendoworldreport.com/review/69291/sashingo-learn-japanese-with-photography-switch-review — 7/10, retention criticism
- https://www.nintendolife.com/news/2024/08/shashingo-learn-japanese-with-photography-snaps-up-september-release-date-on-switch — Switch date/publisher
- https://www.metacritic.com/game/shashingo-learn-japanese-with-photography/ — critic scores, credits
- https://shashingo.com/ — official site, credits

**Wagotabi**
- https://store.steampowered.com/app/2701720/Wagotabi_A_Japanese_Journey/ — Overwhelmingly Positive 98%/1,384, $9.99, features (primary)
- https://www.wagotabi.com/ — content stats, prefecture status, goals (primary)
- https://www.wagotabi.com/faq — team, dates, pricing model (primary)
- https://apps.apple.com/us/app/wagotabi-learn-japanese/id6474207287 — $4.99, 4.9/1.4K, SRS description
- https://steamcommunity.com/app/2701720/discussions/0/597409017434828634/ — dev statement: JLPT coverage, roadmap (primary)
- https://steamcommunity.com/app/2701720/allnews/ — update cadence through Jul 2026
- https://www.destructoid.com/in-terms-of-games-that-try-to-teach-japanese-wagotabi-might-be-the-real-deal/ — press verdict
- https://community.wanikani.com/t/wagotabi-learn-japanese-with-a-video-game/68460 — learner consensus, ceiling criticism
- https://play.google.com/store/apps/details?id=com.WagotabiLimited.Wagotabi&hl=en_US — Android listing (truncated fetch)

**Nihongo Quest**
- https://store.steampowered.com/app/1556070/Nihongo_Quest/ — unreleased status, planned 2026, feature/content claims (primary)
- https://nihongoquest.com/pages/faqs — release plans, N5 scope, platforms (primary)
- https://nihongoquest.com/ — "From あ to N1" aspiration, self-funded (primary)
- https://nihongoquest.com/blogs/news — 2020–21 history; blog staleness (primary)
- https://steamcommunity.com/app/1556070/discussions/0/688619018316277782/ — dated dev release statements (Jan/Jun 2026)
- https://www.metacritic.com/game/nihongo-quest-n5/ — empty reviews entry
- https://store.steampowered.com/news/app/1759670/view/7082543117434279391 — playtest build (listing via search; body not fetched)

**Koe**
- https://store.steampowered.com/app/672430/Koe__Part_1/ — release 2024-04-18, $19.99, Mixed 68%/16, mechanics, Part 2 promise (primary)
- https://www.kicktraq.com/projects/297265509/koe-a-jrpg-with-japanese-at-the-core-of-gameplay/ — funding £75,167/£35,000, 4,169 backers
- https://soranews24.com/2014/03/28/play-video-games-learn-japanese-crowdfunded-jrpg-koe-reaches-its-goal-with-cash-to-spare/ — campaign-era mechanics/promises
- https://gigazine.net/gsc_news/en/20140327-learn-japanese-rpg-koe/ — 2014 scope incl. Vita stretch goal
- https://geekysweetie.com/koe-jrpg-learn-japanese-vocabulary-kickstarter/ — delay history by 2015
- https://steamcommunity.com/app/672430/discussions/0/3377008022021548249/ — 2018 backer alpha (primary dev post)
- https://steamcommunity.com/app/672430/discussions/0/4363500448196560980/ — dev's beginner-target statement; N4-ceiling comment
- https://steamcommunity.com/app/672430/discussions/0/4363500448196509392/ — release-day reception/bugs
- https://steamcommunity.com/app/672430/discussions/0/601895828709202331/ — Part 2 silence since Feb 2025
- https://steambase.io/games/koe-%E5%A3%B0-part-1/steam-charts — 21 peak CCU, 71/100 of 24 reviews
- Fetch failures noted: kickstarter.com (403), web.archive.org (blocked), koe.fandom.com (402), koegame.net (503)

**Learn Japanese RPG**
- https://store.steampowered.com/app/1114950/Learn_Japanese_RPG_Hiragana_Forbidden_Speech/ — Very Positive 98%/250, $19.99, content claims, adaptive dialogue (primary)
- https://www.learnjapaneserpg.com/ — dev confirmation, scope; no sequel info (primary)
- https://steamcommunity.com/app/1114950/allnews/ — Kanji Mode (Mar 2025), Unity port, last news Sep 2025
- https://steamcommunity.com/app/1114950/reviews/?browsefilter=toprated — verbatim user outcomes
- https://gamecritics.com/rorenado/learn-japanese-rpg-hiragana-forbidden-speech-review/ — 6/10, pacing/retention criticism
- https://steambase.io/games/learn-japanese-rpg-hiragana-forbidden-speech — 99/100 of 264 (via search summary)

**2025–26 releases & the N4–N3 cliff**
- https://store.steampowered.com/app/1386630/Shujinkou/ — Feb 2025, $59.99, N5–N1 claim, 91%/24
- https://store.steampowered.com/app/1779030/So_to_Speak/ — Mar 2025, 97%/113, inference-puzzle loop
- https://store.steampowered.com/app/3506220/WonderLang_Japanese/ — Jul 2025, Mixed 45%/11
- https://store.steampowered.com/app/3319740/Learn_Japanese_Kana__Vocab_with_Sushi/ — Mar 2025 minor release
- https://marumori.io/changelog?entry=302867168 — Dec 2024 roadmap: N3 done Q1 2025, N2 from Q2 2025
- https://apps.apple.com/us/app/marumori/id6642702724 — MaruMori iOS, 5.0★/7, N5–N1 grammar claim
- https://www.jlpt.jp/e/statistics/archive/202501.html — July 2025 official per-level statistics
- https://www.jlpt.jp/e/statistics/archive.html — 2025 totals (1,940,852)
- https://www.tofugu.com/reviews/quartet-vol1/ — Quartet ≈ N3, post-Genki gap framing
- https://community.bunpro.jp/t/what-textbooks-take-you-through-n3-level-grammar/53089 — Tobira 128/217 N3 (community count)
- https://community.wanikani.com/t/hello-from-the-intermediate-plateau%E2%84%A2-has-anyone-got-a-map-out-of-here/51719 — plateau thread (2021)
- https://community.wanikani.com/t/how-long-is-the-intermediate-plateau/28536 — plateau duration thread (2018)
- https://community.wanikani.com/t/level-10-genki-i-ii-now-what/46900 — post-Genki orientation crisis (2020)

---

*End of Session 1 research. Next: Session 2 — curriculum mapping (N5→N1 counts from JMdict/KANJIDIC2/KanjiVG/Tatoeba) and real-world module definition.*
