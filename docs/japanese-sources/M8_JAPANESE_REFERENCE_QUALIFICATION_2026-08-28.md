# M8 Japanese reference qualification

This record implements the bounded source qualification approved by D-051.
It does not approve JMdict-derived production content.

## Qualified authoring-only tools

- `kuromoji@0.1.2` may propose token boundaries, dictionary forms, readings,
  and part-of-speech labels in Node authoring scripts. Its Apache-2.0 license
  and bundled IPADIC/ICOT notice must be retained. Neither the package nor its
  dictionary may enter a browser bundle.
- `wanakana@5.3.1` may propose kana/romaji transformations in Node authoring
  scripts. Its MIT notice must be retained. It is not a kanji-reading engine.
- Every generated proposal requires Bunbun review. In particular, the M8
  review corrected context-sensitive readings such as `三分 → さんぷん`,
  `公園の端 → こうえんのはし`, and `行った → いった`.

Both packages have zero per-call and recurring service cost, require no
account, use no learner data, and make no runtime network request.

## JMdict Gate 2 candidate

The exact ignored candidate is `JMdict English without examples`, revision
`JMdict.2026-08-27`, archive SHA-256
`2fdd9e55b2a5b90d063473f7b33b83ea80782e19591d523f0000259ad9274d36`.
It remains unextracted and unpromoted. The data is CC BY-SA 4.0 and therefore
requires EDRDG attribution, license linking, and an explicit update procedure
if selected.

Gate 2 proposes exactly eight context-relevant English rows: `財布`, `探す`
(sense 1 only), `傘` (sense 1), `駅` (sense 1), `終電`, `公園`, `猫` (domestic
cat sense 1), and `店`. Each proposal is pinned by source member, JMdict
sequence, reading, definition tags, and raw Yomitan-row SHA-256. Other senses
and all other rows remain rejected/unselected.

User approval of the exact packet file SHA-256 is required before any
JMdict-derived English gloss enters Git or runtime. Rejection does not block
the Bunbun-authored M8 study catalog.

## Runtime boundary

The committed M8 catalog contains only reviewed Bunbun-authored Vietnamese
meanings and grammar notes. Kuromoji and WanaKana are recorded as proposal
tools, not content authorities. The runtime receives compact reviewed JSON;
it does not receive kuromoji, IPADIC, WanaKana, JMdict, Yomitan, or any remote
dictionary/audio integration.
