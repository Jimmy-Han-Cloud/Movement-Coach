from collections import defaultdict
from threading import Lock
from time import time

from fastapi import HTTPException

_store: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def check_rate_limit(key: str, max_calls: int, window_sec: int) -> None:
    """Raise HTTP 429 if key has exceeded max_calls within the last window_sec seconds."""
    now = time()
    with _lock:
        _store[key] = [t for t in _store[key] if now - t < window_sec]
        if len(_store[key]) >= max_calls:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
            )
        _store[key].append(now)
