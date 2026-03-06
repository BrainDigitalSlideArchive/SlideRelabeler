import tracemalloc
from contextlib import contextmanager
from pathlib import Path
from typing import Iterable, Optional, Sequence


def _format_frame(filename: str, lineno: int, funcname: str) -> str:
    """
    FlameGraph stack frame format: "func (file:line)" is readable.
    Avoid spaces that can confuse some parsers by keeping it simple.
    """
    short_file = str(Path(filename).name)
    return f"{funcname} ({short_file}:{lineno})"


def _stat_to_folded_line(stat, invert: bool, prefix: Optional[str]) -> Optional[str]:
    """
    Convert a tracemalloc StatisticDiff into a single folded-stack line.

    stat.traceback: most recent call last (closest to allocation site is last frame in traceback)
    FlameGraph expects: root;...;leaf value
    """
    size = stat.size_diff  # bytes net allocated (can be negative)
    if size == 0:
        return None

    frames = []
    for frame in stat.traceback:
        # frame has: filename, lineno, name (function)
        frames.append(_format_frame(frame.filename, frame.lineno, frame.name))

    # Typical flamegraphs show "root -> leaf". We’ll treat the *oldest* frame as root.
    # tracemalloc traceback order is "most recent call last", so reverse for call order.
    frames = list(reversed(frames))

    if invert:
        frames = list(reversed(frames))

    if prefix:
        frames = [prefix] + frames

    stack = ";".join(frames)

    # FlameGraph input: "<stack> <value>"
    # We want positive growth only (default). If you want both, handle below.
    if size > 0:
        return f"{stack} {size}"
    return None


def write_tracemalloc_flamegraph(
    snap_before,
    snap_after,
    out_folded_path: str,
    *,
    include_patterns: Optional[Sequence[str]] = None,
    exclude_patterns: Optional[Sequence[str]] = None,
    group_by: str = "traceback",
    limit: int = 200_000,
    invert: bool = False,
    prefix: Optional[str] = "python",
) -> None:
    """
    Creates a folded-stack file of net allocated bytes between two snapshots.

    - include_patterns/exclude_patterns: glob-like filename filters (tracemalloc Filter).
      Example include: ("your_project/*",)
      Example exclude: ("*/site-packages/*",)
    - group_by: "traceback" gives call stacks; "lineno" collapses to lines (less useful for flamegraph).
    - limit: max number of diff stats to process.
    """
    filters = []

    if include_patterns:
        for pat in include_patterns:
            filters.append(tracemalloc.Filter(inclusive=True, filename_pattern=pat))

    if exclude_patterns:
        for pat in exclude_patterns:
            filters.append(tracemalloc.Filter(inclusive=False, filename_pattern=pat))

    if filters:
        snap_before = snap_before.filter_traces(filters)
        snap_after = snap_after.filter_traces(filters)

    stats = snap_after.compare_to(snap_before, group_by)

    out_lines = 0
    out_path = Path(out_folded_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with out_path.open("w", encoding="utf-8") as f:
        for stat in stats[:limit]:
            line = _stat_to_folded_line(stat, invert=invert, prefix=prefix)
            if line:
                f.write(line + "\n")
                out_lines += 1

    print(f"[tracemalloc] wrote {out_lines} folded stacks to: {out_path}")


@contextmanager
def tracemalloc_region(
    *,
    nframes: int = 25,
    include_patterns: Optional[Sequence[str]] = None,
    exclude_patterns: Optional[Sequence[str]] = ("*/site-packages/*",),
    folded_out: str = "mem.folded",
    prefix: str = "python",
):
    import logging
    logging.basicConfig(
        filename="tracemalloc.log",
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )
    # logging.getLogger("tracemalloc").setLevel(logging.INFO)
    logging.info(f"Starting tracemalloc region with {nframes} frames")
    """
    Context manager that captures memory growth inside a region and writes folded stacks.
    """
    tracemalloc.start(nframes)
    snap_before = tracemalloc.take_snapshot()
    try:
        yield
    finally:
        snap_after = tracemalloc.take_snapshot()
        write_tracemalloc_flamegraph(
            snap_before,
            snap_after,
            folded_out,
            include_patterns=include_patterns,
            exclude_patterns=exclude_patterns,
            group_by="traceback",
            prefix=prefix,
        )
        tracemalloc.stop()
        logging.info(f"Stopped tracemalloc region with {nframes} frames")
        


# ------------------- Example usage -------------------

def your_workload():
    # Example "leaky-ish" workload:
    junk = []
    for i in range(50_000):
        junk.append({"i": i, "s": "x" * (i % 200)})
    return junk


if __name__ == "__main__":
    # Tip: set include_patterns to your project to reduce noise:
    # include_patterns=("your_project/*",)
    with tracemalloc_region(
        nframes=35,
        folded_out="out/mem.folded",
        exclude_patterns=("*/site-packages/*",),
        prefix="python",
    ):
        your_workload()