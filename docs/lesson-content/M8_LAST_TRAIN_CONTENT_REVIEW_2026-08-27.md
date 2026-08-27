# M8 last-train content review

Status: Proposed for exact user approval
Packet: `M8_LAST_TRAIN_CONTENT_REVIEW_2026-08-27.json`
Authority: D-046; speech generation and runtime activation remain unauthorized

## Review boundary

This sheet summarizes the exact repository-owned content proposed for M8
Milestone 4 Content Gate 1. The JSON packet and its byte-level SHA-256 are the
approval authority. Approval authorizes preparation of the fixed
CatalogSnapshot/LessonManifest and generation of only the four exact speech
lines through the already approved local VOICEVOX Nemo boundary. It does not
authorize a new provider, dependency, asset, runtime TTS call, or M7 compiler
integration.

Incremental cost is USD 0. The sibling N5 extraction was consulted only for
scope and spelling; no external definition, link, or source ID is copied.

## Story

- Japanese title: `終電まであと3分`
- Vietnamese title: `Ba phút trước chuyến tàu cuối`
- Template: `SOLVE_SMALL_PROBLEM`
- Objective: `財布を探して、あおいを助けてください。`
- Vietnamese support: `Hãy tìm chiếc ví và giúp Aoi.`
- Resolution: the umbrella is not Aoi's, the wallet was dropped near the park
  edge, and nobody is accused of theft.
- The three-minute deadline is narrative only. There is no timer, game over,
  or punishment.

## Learning targets

| Role       | Target           | Reading or pattern | Vietnamese support   | Evidence intent                              |
| ---------- | ---------------- | ------------------ | -------------------- | -------------------------------------------- |
| Requested  | `財布`           | `さいふ`           | ví                   | heard, arranged, selected, actively produced |
| Requested  | `探す`           | `さがす`           | tìm kiếm             | heard, arranged, actively produced           |
| Requested  | `～てください`   | polite request     | xin hãy làm…         | heard, arranged, actively produced           |
| Supporting | `傘`             | `かさ`             | ô                    | heard, recognized                            |
| Supporting | `駅`             | `えき`             | ga                   | heard                                        |
| Supporting | `～てはいけない` | prohibition        | không được phép làm… | heard, recognized                            |

Rain and the last-train deadline are story context, not extra assessed targets.

## Exact production utterances

| ID                         | Speaker/profile            | Exact Japanese                                                       | Vietnamese support                                                                   |
| -------------------------- | -------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `utterance_aoi_opening`    | Aoi / `voice_aoi_01`       | `財布がありません。終電まであと三分です。財布を探してください。`     | Tôi không thấy ví. Chỉ còn ba phút nữa là đến chuyến tàu cuối. Xin hãy tìm chiếc ví. |
| `utterance_tanaka_rule`    | Tanaka / `voice_tanaka_01` | `この傘はあおいさんの傘ではありません。店の中に入ってはいけません。` | Chiếc ô này không phải ô của Aoi. Không được vào bên trong cửa hàng.                 |
| `utterance_tanaka_clue`    | Tanaka / `voice_tanaka_01` | `猫が公園のほうへ行きました。公園を見てください。`                   | Con mèo đã đi về phía công viên. Hãy nhìn về phía công viên.                         |
| `utterance_aoi_resolution` | Aoi / `voice_aoi_01`       | `ありがとうございます。財布が見つかりました。これで駅へ行けます。`   | Cảm ơn bạn. Đã tìm thấy ví rồi. Giờ tôi có thể đi đến ga.                            |

Any wording or profile change creates a new cache key and requires a new
speech hash review. The existing technical Aoi WAV is not promoted by this
content approval.

## Nine-step primitive sequence

| #   | Primitive    | Learner action                            | Exact answer truth                                                    | Primary recovery                           |
| --- | ------------ | ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------ |
| 1   | LISTEN       | Hear Aoi's request                        | Continue after at least half of reviewed audio or use text assistance | Replay + Japanese text                     |
| 2   | ARRANGE      | Rebuild the request                       | `財布を` → `探して` → `ください。`                                    | Show `［もの］を探してください。`          |
| 3   | CHOOSE       | Understand Tanaka and reject the umbrella | The umbrella is not Aoi's; entering the store is prohibited           | Reduce to two choices + Vietnamese meaning |
| 4   | TYPE         | Ask Tanaka politely                       | `財布を探してください。` after fixed normalization                    | Pattern + reading                          |
| 5   | MOVE_TO      | Follow Momo's clue                        | `park_edge`                                                           | Meaning + Japanese text                    |
| 6   | CLICK_OBJECT | Select Momo                               | `momo`                                                                | Reduce/highlight objects                   |
| 7   | PICK_UP      | Recover the wallet                        | `wallet_clue`                                                         | Deterministically reduce to the wallet     |
| 8   | GIVE         | Return it                                 | `wallet_clue` → `aoi`                                                 | Highlight Aoi + reduce to wallet           |
| 9   | LISTEN       | Hear Aoi's resolution                     | Continue after at least half of reviewed audio or use text assistance | Replay + Japanese text                     |

All assessable steps allow at most two attempts and then continue through a
deterministic assisted path. PICK_UP guarantees the wallet before GIVE. The
sequence uses every accepted primitive, repeats LISTEN only for the spoken
resolution, and adds no mechanic.

## Cue intentions

The proposal uses only code-owned cues backed by existing D-043 audio and
accepted world targets: Aoi request, tension start, Tanaka rule, umbrella
correction, Momo clue/reaction, wallet reveal/pickup/return, correct/incorrect
feedback, and resolution. The later manifest contains cue IDs only; it cannot
supply URLs, files, mix values, or playback scripts.

## Approval effect

After the exact packet SHA-256 is approved:

1. the content becomes immutable revision 1 input for the fixed production
   package;
2. only the four exact utterances may be queued for local speech generation;
3. every resulting WAV still requires a separate listen-and-hash Gate 2; and
4. runtime activation remains blocked until package validation and Gate 2 are
   complete.
