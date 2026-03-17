import json
from pathlib import Path
from typing import Dict, List, Tuple


def parse_folded_line(line: str) -> Tuple[List[str], int]:
    # Format: "frame;frame;frame <weight>"
    line = line.strip()
    if not line:
        raise ValueError("empty line")
    stack_str, weight_str = line.rsplit(" ", 1)
    weight = int(weight_str)
    frames = stack_str.split(";") if stack_str else []
    return frames, weight


def folded_to_speedscope(
    folded_path: str,
    out_json_path: str,
    *,
    profile_name: str = "tracemalloc-diff (net allocated bytes)",
    unit: str = "bytes",
) -> None:
    folded_path = str(folded_path)
    out_json_path = str(out_json_path)

    # Speedscope format uses:
    # shared.frames: [{name: ...}, ...]
    # profiles[].samples: [[frameIndex, ...], ...]
    # profiles[].weights: [w0, w1, ...]
    # (Sampled profile type) :contentReference[oaicite:1]{index=1}
    frame_index: Dict[str, int] = {}
    frames_out: List[Dict[str, str]] = []

    samples: List[List[int]] = []
    weights: List[int] = []

    total = 0

    with open(folded_path, "r", encoding="utf-8") as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue

            stack_frames, w = parse_folded_line(raw)
            if w <= 0:
                # For a “growth” view, ignore non-positive weights
                continue

            idxs: List[int] = []
            for fr in stack_frames:
                if fr not in frame_index:
                    frame_index[fr] = len(frames_out)
                    frames_out.append({"name": fr})
                idxs.append(frame_index[fr])

            samples.append(idxs)
            weights.append(w)
            total += w

    speedscope_obj = {
        "$schema": "https://www.speedscope.app/file-format-schema.json",
        "version": "0.0.1",
        "shared": {"frames": frames_out},
        "profiles": [
            {
                "type": "sampled",
                "name": profile_name,
                "unit": unit,
                "startValue": 0,
                "endValue": total,
                "samples": samples,
                "weights": weights,
            }
        ],
    }

    Path(out_json_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_json_path, "w", encoding="utf-8") as out:
        json.dump(speedscope_obj, out, indent=2)

    print(f"Wrote: {out_json_path}")
    print(f"Frames: {len(frames_out)}  Samples: {len(samples)}  Total weight: {total} {unit}")


if __name__ == "__main__":
    import os

    out_dir = os.path.join(".", "out")

    for file in os.listdir(out_dir):
        if file.endswith(".folded"):
            folded_to_speedscope(os.path.join(out_dir, file), os.path.join(out_dir, file.replace(".folded", ".speedscope.json")))