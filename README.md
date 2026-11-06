# learnvi

Video studio behind [learnvi.in](https://learnvi.in).

A config-driven production framework. First series: **What Happens When You Press Enter?**
Narration (audio track) and visuals (video track) are separate components, joined only by **cue IDs**.
Change a title in JSON or re-record one paragraph, and rebuild: only what changed is redone.

Plan and architecture: [`docs/plan.html`](docs/plan.html).

**Status: Phase 2 (Remotion visual engine) done.** Phase 3 (finished pilot video, Shorts, audio-only) is next.

## Setup (once per machine)

Needs Node 20+, Python 3.10+ and ffmpeg on your PATH.

```bash
npm install
npm link                                # makes the `press` command available
pip install -r py/requirements.txt
press setup                             # downloads the offline voice (Kokoro) and alignment (sherpa-onnx) models, ~650 MB
```

On Windows, if `python` is not the right interpreter, set `PRESS_PYTHON` to its full path.

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
