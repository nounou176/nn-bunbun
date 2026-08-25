# VOICEVOX Nemo 0.24.0 qualification source record

Status: Technical qualification passed; manual voice review pending
Intake date: 2026-08-25
Purpose: Milestone 8 local Japanese TTS qualification only

## Source identity

- Product: VOICEVOX Nemo
- Engine: VOICEVOX Nemo Engine
- Engine version: `0.24.0`
- Engine manifest UUID: `208cf94d-43d2-4cf5-abc0-9783cac36d29`
- Engine default port: `50121`
- Platform: Linux CPU x64
- Official product: `https://voicevox.hiroshiba.jp/nemo/`
- Official output terms: `https://voicevox.hiroshiba.jp/nemo/term/`
- Official engine repository:
  `https://github.com/VOICEVOX/voicevox_nemo_engine`
- Official release:
  `https://github.com/VOICEVOX/voicevox_nemo_engine/releases/tag/0.24.0`
- Release asset:
  `voicevox_engine-linux-cpu-x64-0.24.0.7z.001`
- Published and verified SHA-256:
  `c2af9ddf42dd28f55e831f0e76f605321daaec981dda3c8be558c734dc6830e7`

The first transfer was interrupted and then written concurrently by two
transfer processes, producing a file with trailing data and a mismatched hash.
That exact failed intake file was removed. A clean single-process download was
verified against the published SHA-256 and passed `7z t` with `Everything is
Ok` before extraction.

## Local intake measurements

| Measurement                          |            Result |
| ------------------------------------ | ----------------: |
| Verified archive                     | 136,493,982 bytes |
| Archive size reported by 7-Zip       |           131 MiB |
| Uncompressed archive contents        | 330,265,003 bytes |
| Extracted directory reported by `du` |           316 MiB |
| Plan disk stop limit                 |             2 GiB |

The verified archive is retained only in the Git-ignored local intake path
`.bunbun-data/vendor/voicevox-nemo/intake/`. The extracted engine is retained
only at
`.bunbun-data/vendor/voicevox-nemo/0.24.0/linux-cpu-x64/`.

## Rights boundary reviewed at intake

The bundled engine terms say the software may be used commercially or
non-commercially and may be incorporated and redistributed, while generated
audio remains subject to each voice library's terms. They also require credit
that makes VOICEVOX use clear and prohibit reverse engineering and harmful or
public-order-violating use.

The official VOICEVOX Nemo output terms allow commercial and non-commercial
use with credit. They prohibit missing credit, machine-learning use, rights
infringement, criminal encouragement, and uses that seriously damage the
reputation or dignity of VOICEVOX or a voice provider. Terms may change for
future use; they must be checked again before production publication.

Accepted future credit text, if the candidate later qualifies and ships:

`VOICEVOX Nemo`

This source record does not approve engine or model redistribution with
Bunbun. Qualification treats the engine as a removable local authoring tool.
Generated qualification WAV files remain ignored local evidence and cannot
become production assets until the user accepts exact voices and
pronunciation.

## Installed voice identities

The verified bundled model metadata reports one normal style for each of nine
voices:

| Voice    | Style ID | Speaker UUID                           | Model version |
| -------- | -------: | -------------------------------------- | ------------- |
| Female 1 |    10005 | `abccafa5-174f-44d8-b70c-c41eebb3061c` | 0.15.0        |
| Female 2 |    10007 | `a601bf4a-d986-468d-a394-345f4e1e7ae1` | 0.15.0        |
| Female 3 |    10004 | `be15f40d-a95a-4fb3-b298-a59fdd727af1` | 0.15.0        |
| Female 4 |    10003 | `3f98f123-fa9a-4ad0-96ba-2a1bae922433` | 0.15.0        |
| Female 5 |    10008 | `69f71ba4-1c36-406d-a693-8091d60fa952` | 0.15.0        |
| Female 6 |    10006 | `3490c392-30be-44c2-8379-b77df27fa65e` | 0.15.0        |
| Male 1   |    10001 | `2171909e-d2d1-4bbb-aa45-442c12732665` | 0.15.0        |
| Male 2   |    10000 | `7ecc7a17-1465-4b22-a3b5-842a110ff55e` | 0.15.0        |
| Male 3   |    10002 | `627b3e92-32c5-4c2f-860a-a5553d3d6662` | 0.15.0        |

Each bundled voice policy points to the common Nemo terms and requires the
same `VOICEVOX Nemo` credit. The anchor review shortlisted Female 1 and Female 6
for Aoi, plus Male 1 and Male 2 for Tanaka. No final mapping is accepted yet.

## Cost, account, and data flow

- Expected monetary cost: USD 0.
- Worst-case usage and recurring monetary cost: USD 0.
- Account: none.
- Credential or API key: none.
- Paid tier or automatic purchase path: none.
- Initial external data flow: the pinned engine archive was downloaded from
  the official GitHub release.
- Synthesis data flow: fixed project-authored Japanese evaluation text was sent
  only over loopback to `127.0.0.1:50121`.
- Learner data in qualification: none.
- Gameplay connection to engine: prohibited and not implemented.

## Technical qualification evidence

The engine reported version `0.24.0`, the expected manifest UUID, and all nine
installed voice identities through its local API. It was started with mutable
APIs disabled and bound only to `127.0.0.1:50121`; `ss` confirmed that it did
not listen on a LAN or public interface.

The unchanged baseline generated four anchors for every voice: 36 query JSON
records and 36 WAV files. Independent validation confirmed 36 unique sample
identities, 36 matching SHA-256 hashes, 36 parseable query files, and 36 local
listening-page controls. Every WAV is 24 kHz, 16-bit, mono PCM.

| Measurement                     |      Result |
| ------------------------------- | ----------: |
| Anchor WAV count                |          36 |
| Anchor WAV bytes                |   3,686,448 |
| Anchor evaluation directory     |     3.9 MiB |
| Complete local vendor directory |     446 MiB |
| Synthesis time, minimum         |    471.1 ms |
| Synthesis time, maximum         |    982.5 ms |
| Synthesis time, average         |    711.1 ms |
| Realtime factor, average        |       0.335 |
| Observed engine resident memory | 385,928 KiB |

Offline behavior was tested in a temporary network namespace with exactly one
loopback interface, zero external routes, and a failed external connection.
The engine still synthesized a valid WAV. Its SHA-256 was
`1864116b23b6d6c7237c55de29e199eb76bfcb76ce1d14c2af6eca09a8150516`,
identical to the normal loopback baseline for the same text, style, and query.

An unknown style ID (`999999`) was rejected and produced no file. Engine 0.24.0
returns HTTP 500 with an invalid-speaker core error for this case, so later
authoring tooling must validate style IDs before calling the engine instead of
depending on a 4xx response.

All generated engine, query, WAV, manifest, and listening-page evidence remains
under Git-ignored `.bunbun-data/`. The engine is stopped. Technical success
does not establish Japanese pronunciation quality or character fit; those
remain explicit user-review gates.

## Finalist evaluation

On 2026-08-25 the user selected these anchor finalists:

| Role   | Candidate | Style ID | Speaker UUID                           |
| ------ | --------- | -------: | -------------------------------------- |
| Aoi    | Female 1  |    10005 | `abccafa5-174f-44d8-b70c-c41eebb3061c` |
| Aoi    | Female 6  |    10006 | `3490c392-30be-44c2-8379-b77df27fa65e` |
| Tanaka | Male 1    |    10001 | `2171909e-d2d1-4bbb-aa45-442c12732665` |
| Tanaka | Male 2    |    10000 | `7ecc7a17-1465-4b22-a3b5-842a110ff55e` |

All twelve fixed evaluation lines were generated for every finalist with the
engine-returned query left unchanged. Independent validation confirmed 48
unique sample identities, 48 matching WAV hashes, 48 parseable query files,
48 page controls, and 24 kHz, 16-bit, mono PCM format throughout.

| Measurement                   |    Result |
| ----------------------------- | --------: |
| Finalist WAV count            |        48 |
| Finalist WAV bytes            | 3,818,560 |
| Finalist evaluation directory |   4.1 MiB |
| Synthesis time, minimum       |  409.2 ms |
| Synthesis time, maximum       |  841.1 ms |
| Synthesis time, average       |  560.7 ms |
| Realtime factor, average      |     0.342 |

The user must now select one final Aoi voice and one final Tanaka voice and
report any line-specific pronunciation or personality issue. Until then the
candidate remains unqualified for production mapping.

## Operational data-path decision

The engine resolves its mutable user dictionary and settings directory before
argument parsing. In the workspace sandbox it attempted to create
`/home/nunu/.local/share/voicevox-nemo-engine` and exited because that external
path is read-only. The documented CLI has no user-data-directory option.

The smallest isolated continuation is to set the standard process-local
`XDG_DATA_HOME` variable to the absolute ignored Bunbun path
`.bunbun-data/vendor/voicevox-nemo/user-data` only for the Nemo engine process.
This would not modify `.env`, the shell profile, `$HOME`, application code, or
the host-wide environment. The user explicitly confirmed this
environment-variable name and isolated value on 2026-08-25. It may now be used
only for the approved Nemo qualification process.

## Removal path

If Nemo is rejected, first stop the exact engine process. Resolve and confirm
the following exact directories, then remove only them:

- `.bunbun-data/vendor/voicevox-nemo/`
- `.bunbun-data/audio-evaluation/voicevox-nemo-0.24.0/`

This tracked source record may remain as historical rejection evidence. No
application rollback or database migration is currently required.
