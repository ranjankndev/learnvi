import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Series } from "../../schema/index.js";

const ff = (args: string[]) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...args], { encoding: "utf8", maxBuffer: 64e6 });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.split("\n").slice(-6).join("\n")}`);
  return r.stderr;
};

export function duration(file: string): number {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return +(+out.trim()).toFixed(3);
}

/**
 * Make every take sound like its neighbours: mono, fixed sample rate, high-pass,
 * trimmed silence at both ends, short pad, two-pass loudness normalisation.
 */
export function postProcess(input: string, output: string, a: Series["audio"]) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const trim = a.trimSilence
    ? "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.02,areverse,"
    : "";
  const ms = Math.round(a.padSeconds * 1000);
  const pre = `highpass=f=70,${trim}adelay=${ms}:all=1,apad=pad_dur=${a.padSeconds}`;
  const target = `I=${a.loudnessLUFS}:TP=${a.truePeak}:LRA=11`;
  // pass 1: measure
  const log = ff(["-i", input, "-af", `${pre},loudnorm=${target}:print_format=json`, "-f", "null", "-"]);
  const j = JSON.parse(log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1));
  const measured = `measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  // pass 2: apply
  ff(["-i", input, "-af", `${pre},loudnorm=${target}:${measured}`, "-ac", "1", "-ar", String(a.sampleRate), "-c:a", "pcm_s16le", output]);
}

/** Lay clips on a silent bed at exact start times (seconds). */
export function mixAt(clips: { file: string; start: number }[], total: number, output: string, sampleRate: number) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const args = ["-f", "lavfi", "-t", String(total), "-i", `anullsrc=r=${sampleRate}:cl=mono`];
  clips.forEach((c) => args.push("-i", c.file));
  const parts = clips.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.start * 1000)}:all=1[a${i}]`);
  const inputs = ["[0:a]", ...clips.map((_, i) => `[a${i}]`)].join("");
  const filter = `${parts.join(";")};${inputs}amix=inputs=${clips.length + 1}:normalize=0:dropout_transition=0[out]`;
  ff([...args, "-filter_complex", filter, "-map", "[out]", "-t", String(total), "-c:a", "pcm_s16le", output]);
}

export interface WorkerJob { type: "tts" | "align"; id: string; [k: string]: unknown }

/** Run a batch of TTS / alignment jobs in one Python process (models load once). */
export function runWorker(root: string, jobs: WorkerJob[], onLine?: (l: string) => void) {
  if (!jobs.length) return {} as Record<string, any>;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "press-"));
  const spec = path.join(tmp, "jobs.json"), res = path.join(tmp, "results.json");
  fs.writeFileSync(spec, JSON.stringify({ models: path.join(root, ".models"), jobs }));
  const py = process.env.PRESS_PYTHON || (process.platform === "win32" ? "python" : "python3");
  const r = spawnSync(py, [path.join(root, "py", "worker.py"), spec, res], { encoding: "utf8", maxBuffer: 64e6 });
  r.stderr?.split("\n").filter((l) => /^(tts|align)\s/.test(l)).forEach((l) => onLine?.(l));
  if (r.status !== 0 || !fs.existsSync(res)) throw new Error(`Python worker failed:\n${(r.stderr || "").split("\n").slice(-12).join("\n")}`);
  const out = JSON.parse(fs.readFileSync(res, "utf8"));
  fs.rmSync(tmp, { recursive: true, force: true });
  return out as Record<string, any>;
}
