"""Download the offline models into .models/ (run once per machine: `press setup`)."""
import os, sys, tarfile, urllib.request
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".models")
FILES = [
    ("kokoro/kokoro-v1.0.onnx", "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"),
    ("kokoro/voices-v1.0.bin", "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"),
]
ASR = ("sherpa-onnx-zipformer-en-2023-06-26",
       "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-en-2023-06-26.tar.bz2")

def fetch(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print("downloading", url, flush=True)
    urllib.request.urlretrieve(url, dest + ".part")
    os.replace(dest + ".part", dest)

for rel, url in FILES:
    p = os.path.join(ROOT, rel)
    if not os.path.exists(p):
        fetch(url, p)
if not os.path.isdir(os.path.join(ROOT, ASR[0])):
    tgz = os.path.join(ROOT, "asr.tar.bz2")
    fetch(ASR[1], tgz)
    with tarfile.open(tgz) as t:
        t.extractall(ROOT)
    os.remove(tgz)
print("models ready in", os.path.abspath(ROOT))
