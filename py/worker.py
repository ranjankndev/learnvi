"""Batch worker for the audio track. Called by the Node CLI.

usage: python py/worker.py <jobs.json> <results.json>

jobs.json = {"models": "<dir>", "jobs": [
  {"type": "tts",   "id": "...", "text": "...", "voice": "af_heart", "speed": 1.0, "lang": "en-us", "out": "x.wav"},
  {"type": "align", "id": "...", "wav": "x.wav", "out": "x.json"}
]}
Models load lazily, once per batch.
"""
import json, sys, os
import numpy as np
import soundfile as sf

_kokoro = None
_asr = None


def kokoro(models):
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        d = os.path.join(models, "kokoro")
        _kokoro = Kokoro(os.path.join(d, "kokoro-v1.0.onnx"), os.path.join(d, "voices-v1.0.bin"))
    return _kokoro


def asr(models):
    global _asr
    if _asr is None:
        import sherpa_onnx
        d = os.path.join(models, "sherpa-onnx-zipformer-en-2023-06-26") + os.sep
        _asr = sherpa_onnx.OfflineRecognizer.from_transducer(
            encoder=d + "encoder-epoch-99-avg-1.int8.onnx", decoder=d + "decoder-epoch-99-avg-1.onnx",
            joiner=d + "joiner-epoch-99-avg-1.int8.onnx", tokens=d + "tokens.txt",
            num_threads=4, decoding_method="greedy_search")
    return _asr


def do_tts(job, models):
    samples, sr = kokoro(models).create(job["text"], voice=job["voice"], speed=float(job.get("speed", 1.0)),
                                        lang=job.get("lang", "en-us"))
    os.makedirs(os.path.dirname(job["out"]) or ".", exist_ok=True)
    sf.write(job["out"], samples, sr)
    return {"duration": len(samples) / sr, "sampleRate": sr}


def do_align(job, models):
    audio, sr = sf.read(job["wav"], dtype="float32", always_2d=True)
    audio = audio.mean(axis=1)
    rec = asr(models)
    st = rec.create_stream()
    st.accept_waveform(sr, audio)
    rec.decode_stream(st)
    r = st.result
    # merge BPE tokens into words; a token starting with a space starts a new word
    words = []
    for tok, t in zip(r.tokens, r.timestamps):
        if tok.startswith(" ") or not words:
            w = tok.strip()
            if w:
                words.append({"w": w.lower(), "start": round(float(t), 3)})
            elif not words:
                continue
        else:
            words[-1]["w"] += tok.lower()
    dur = len(audio) / sr
    for i, w in enumerate(words):  # end = next word start (approximation good enough for captions)
        w["end"] = words[i + 1]["start"] if i + 1 < len(words) else round(dur, 3)
    out = {"text": r.text.lower(), "words": words, "duration": dur}
    with open(job["out"], "w") as f:
        json.dump(out, f)
    return {"words": len(words)}


def main():
    spec = json.load(open(sys.argv[1]))
    models = spec["models"]
    results = {}
    for job in spec["jobs"]:
        try:
            fn = {"tts": do_tts, "align": do_align}[job["type"]]
            results[job["id"]] = {"ok": True, **fn(job, models)}
        except Exception as e:  # report per job, keep going
            results[job["id"]] = {"ok": False, "error": f"{type(e).__name__}: {e}"}
        print(f"{job['type']:5} {job['id']} {'ok' if results[job['id']]['ok'] else 'FAILED'}", file=sys.stderr, flush=True)
    json.dump(results, open(sys.argv[2], "w"))


if __name__ == "__main__":
    main()
