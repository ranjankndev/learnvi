# learnvi

Video studio behind [learnvi.in](https://learnvi.in).

A config-driven production framework. First series: **What Happens When You Press Enter?**
Narration (audio track) and visuals (video track) are separate components, joined only by **cue IDs**.
Change a title in JSON or re-record one paragraph, and rebuild: only what changed is redone.

Plan and architecture: [`docs/plan.html`](docs/plan.html).

**Status:** audio track, visual engine, publishing package, review studio, multiple series, a general-purpose
scene kit, and an optional AI drafting step. Two series: `press-enter` (custom scenes) and `nlp-basics`
(built entirely from the scene kit).

**Does it call AI services?** Only `press draft`, and only when you run it. Everything else (voice, word
timing, visuals, rendering, review) runs on your machine with no API calls and no per-use cost.

## Setup (once per machine)

Needs Node 20+, Python 3.10+ and ffmpeg on your PATH.

```bash
npm install
npm link                                # makes the `press` command available
pip install -r py/requirements.txt
press setup                             # downloads the offline voice (Kokoro) and alignment (sherpa-onnx) models, ~650 MB
```

On Windows, if `python` is not the right interpreter, set `PRESS_PYTHON` to its full path.

## Series

Each series lives in `series/<id>/` with its own `config/`, `episodes/` and `takes/`. The engine, models,
cache and outputs (`out/<series>/<episode>/`) are shared.

```bash
press series                 # list series; ▶ marks the current one
press series nlp-basics      # make it the default
press -s press-enter status ep03   # or pick one per command
```

To start a new series, copy `series/nlp-basics/config/` to `series/<new-id>/config/` and edit `series.json`
(title, badge, template, episode list).

## Making a new episode

Two routes, both ending in the same files:

**By hand (no AI):** add the episode to `series.json → episodes`, run `press new <id>`, then edit
`episode.json` (which scenes, what they show) and `script.md` (what is said). `press check` tells you
exactly what's wrong, field by field.

**With `press draft` (one AI call):** add the episode to `series.json → episodes`, write a short brief,
and run:

```bash
press draft u1-03 --text "Cover: what classification is, spam vs not spam, labelled examples, precision vs recall in plain words."
# or: press draft u1-03 --brief brief.md        (--dry-run prints the prompt and sends nothing)
```

It writes `episode.json`, `script.md` and a `fact-check.md` list, validated like a hand-written
episode. If validation finds problems, a second call fixes them (never more than two calls). Model,
effort, length and house style are in `series.json → draft`. It needs `ANTHROPIC_API_KEY` (or
`ant auth login`). The draft is a starting point: read it, fix it, tick the fact-check list.

## Scene kit

General-purpose scenes in `remotion/kit/`, usable by any series with JSON alone:
`TitleCard`, `BigIdea`, `Bullets`, `Steps`, `Compare`, `Definition`, `Table`, `BarChart`, `Quiz`,
`Chat`, `Timeline`, `Recap`. Each has a spec in `remotion/kit/specs.ts` (fields, length limits, an
example), which `press check` validates against and `press draft` shows to the model.

Timing is automatic: a scene that reveals a list shows one item per narrated paragraph (an extra first
paragraph can introduce it). To pin an item to a word instead, mark the word in the script
(`{@name}`) and give the item `"at": "c07@name"`.

## Everyday commands

| Command | What it does |
| --- | --- |
| `press check [ep03]` | Validate config, the episode template, the script and every cue reference |
| `press status ep03` | Every cue: TTS or your take, ready / needs build / stale, length |
| `press audio ep03` | Voice, clean up and align whatever changed; write the lock file, timeline, narration and captions |
| `press timeline ep03 --refs` | Segment and cue start times, and every `c07@mark` time |
| `press take ep03 c07 my.wav` | Import your recording of one paragraph and select it |
| `press takes ep03 c07` | List a cue's takes |
| `press use ep03 c07 tts` | Switch a cue to another take (`tts`, `v1`, `v2`…) |
| `press ids ep03` | Give new script paragraphs a cue id |
| `press new ep04` | Start an episode from the series template |
| `press studio` | Open the Remotion preview studio; editing config/ or episodes/ rebuilds the timeline live |
| `press still ep03 bpe --at c18@merge` | Render one frame of a segment to PNG |
| `press sheet ep03` | Contact sheet: one frame per segment, in one PNG |
| `press render ep03` | Render the episode; only segments whose look or timing changed are re-rendered |
| `press package ep03` | Everything to publish: video, Shorts, thumbnail, audio-only MP3, captions, YouTube text |
| `press review ep03` | Open the review studio at http://localhost:4310 |

Outputs go to `out/<episode>/`: `narration.wav`, `timeline.json` (what the visual engine reads), `captions.srt`.

## Where things live

```
config/series.json        series title, episode titles, stops, voice, audio settings, episode template
config/lexicon.json       pronunciations, e.g. "LLMs" → "el el ems" (captions keep the original)
episodes/<ep>/episode.json  segments: which component, which props, in template order
episodes/<ep>/script.md     narration, one paragraph = one cue
episodes/<ep>/audio.lock.json  generated: per cue take, duration, mark times (commit it, don't edit it)
remotion/                  visual engine: theme (ui.tsx), components/, Root.tsx; generated/ is written by press audio
takes/<ep>/<cue>/          your recordings (vN.wav) + takes.json (which one is selected); stored with Git LFS
.cache/  .models/  out/    generated, not committed
```

## Visuals (Remotion)

Every segment in `episode.json` names a **component** and gives it **props**. Components live in
`remotion/components/` and are registered in `remotion/components/index.tsx`; the travel theme
(colours, fonts, chips, stamps, motion helpers) is in `remotion/ui.tsx`.

Components never use seconds. A prop like `"firstMergeAt": "c18@merge"` is read with
`useMark(firstMergeAt)`, which returns the frame where that word is spoken, so re-recording a
paragraph re-times its animation automatically. Props can use `{{templates}}` like the script.

**Adding a component:** write it in `remotion/components/`, add one line to the registry, and use its
name in an episode. An unknown name renders a placeholder showing its props, so new episodes still preview.

**Rendering:** each segment renders silently and is cached under `.cache/segments/` by a hash of the
component code, its props, and its timings *relative to the segment*. A retake in one segment
shifts later segments in time without changing their pixels, so they are reused. Segments are joined
without re-encoding, then the narration is added. The result is `out/<ep>/<ep>-<name>.mp4`.

Remotion downloads its own headless Chrome on first use. To use one you already have, set
`REMOTION_BROWSER_EXECUTABLE` to its path.

## Review studio

`press review ep03` opens a local web page (http://localhost:4310) for reviewing an episode
paragraph by paragraph:

- **Listen**: play any paragraph, or jump the rendered video to it.
- **Record a retake**: the paragraph is shown teleprompter-style; Space starts and stops. The take is
  converted to WAV, stored in `takes/`, selected, and the audio rebuilt (only that paragraph).
  You can also upload a file, or switch between takes and the TTS voice.
- **Edit text**: changes are written back into `script.md`, keeping the cue id and settings.
- **Comment, approve, flag for retake**: saved in `episodes/<ep>/review.json` (commit it). An approval
  only holds for the exact text and take you approved; change either and it reopens.
- **Build**: rebuild audio, render or package, with the log streamed into the page.

It works on the same files as the CLI, so you can switch between the two at any time.
Recording needs microphone permission; browsers allow it on `localhost`.

## Publishing package

`press package ep03` writes to `out/ep03/`:

| File | What it is | Configured in |
| --- | --- | --- |
| `ep03-token-city.mp4` | 16:9 episode, 1080p | `series.json → video` |
| `shorts/ep03-short-<segment>.mp4` | 9:16 Short for every segment with `"short": true` | `episode.json → segments[].shortTitle`, `series.json → shorts` |
| `ep03-thumbnail.jpg` | 1280×720 thumbnail | `episode.json → thumbnail` |
| `ep03-audio-only.mp3` | Narration with chapters; long pauses capped for listeners | `series.json → audioOnly` |
| `ep03.srt`, `ep03.vtt` | Captions, broken into the same lines as the burned-in ones | |
| `youtube.txt` | Title, description with chapter timestamps, tags | `series.json → youtube`, `episode.json → tags` |

Chapter names come from each segment's `title` in episode.json. YouTube needs chapters of at least
10 s, so shorter segments are folded into the previous chapter automatically.

## Writing script.md

```markdown
## bpe                                   ← segment id from episode.json
> Pause before the answer.               ← direction for whoever records (not spoken)
[c17 after=3] {@pause}Pause and predict: which pair wins?
[c18] It's "i" followed by "n", 26 times. So we {@merge}glue them into one new piece.
```

- `{@name}` marks the next word. In episode.json a prop like `"firstMergeAt": "c18@merge"` makes an animation wait for that word.
- `[[BPE|B P E]]`: captions show the left part, the voice says the right part.
- `{{stop.name}}`, `{{series.runningPrompt}}`, `{{next.question}}`: values from series.json. Rename something there and the narration follows.
- `[c12 after=3]` adds 3 s of silence after the cue. `[c08 voice=bf_emma speed=0.9]` overrides the voice for one cue.

## How a retake works

1. Edit paragraph `c07`, or decide you want to say it yourself.
2. `press take ep03 c07 c07.wav` stores it as `takes/ep03/c07/vN.wav` and selects it.
3. `press audio ep03`: the take is trimmed, high-passed and loudness-matched to −16 LUFS, then aligned so its `{@marks}` get real times. Every later cue and segment moves automatically; nothing else is reprocessed.
4. If you later change c07's text, the take is flagged **stale** and TTS is used until you record again (`audio.staleTakePolicy` in series.json: `tts-fallback`, `keep` or `error`).
5. Old takes stay, so `press use ep03 c07 v1` switches back.

A recording is also checked against the script: if few of its words match (`audio.minMatchScore`), you get a warning that you may have read the wrong paragraph.
