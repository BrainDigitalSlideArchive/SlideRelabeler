from threading import Lock
from typing import Any, Dict, Optional, TypeVar, Generic, Iterator

K = TypeVar('K')
V = TypeVar('V')

class ThreadSafeDict(Generic[K, V]):
    """
    A thread-safe dictionary implementation that uses locks to ensure thread safety.
    """
    def __init__(self, *args: Any, **kwargs: Any):
        self._dict: Dict[K, V] = dict(*args, **kwargs)
        self._lock = Lock()

    def __getitem__(self, key: K) -> V:
        """Thread-safe get item operation."""
        with self._lock:
            return self._dict[key]

    def __setitem__(self, key: K, value: V) -> None:
        """Thread-safe set item operation."""
        with self._lock:
            self._dict[key] = value

    def __delitem__(self, key: K) -> None:
        """Thread-safe delete item operation."""
        with self._lock:
            del self._dict[key]

    def __contains__(self, key: K) -> bool:
        """Thread-safe contains check."""
        with self._lock:
            return key in self._dict

    def __len__(self) -> int:
        """Thread-safe length check."""
        with self._lock:
            return len(self._dict)

    def __iter__(self) -> Iterator[K]:
        """Thread-safe iteration."""
        with self._lock:
            return iter(self._dict.copy())

    def get(self, key: K, default: Optional[V] = None) -> Optional[V]:
        """Thread-safe get with default value."""
        with self._lock:
            return self._dict.get(key, default)

    def setdefault(self, key: K, default: Optional[V] = None) -> Optional[V]:
        """Thread-safe setdefault operation."""
        with self._lock:
            return self._dict.setdefault(key, default)

    def update(self, *args: Any, **kwargs: Any) -> None:
        """Thread-safe update operation."""
        with self._lock:
            self._dict.update(*args, **kwargs)

    def clear(self) -> None:
        """Thread-safe clear operation."""
        with self._lock:
            self._dict.clear()

    def pop(self, key: K, default: Optional[V] = None) -> Optional[V]:
        """Thread-safe pop operation."""
        with self._lock:
            return self._dict.pop(key, default)

    def popitem(self) -> tuple[K, V]:
        """Thread-safe popitem operation."""
        with self._lock:
            return self._dict.popitem()

    def keys(self) -> set[K]:
        """Thread-safe keys view."""
        with self._lock:
            return set(self._dict.keys())

    def values(self) -> list[V]:
        """Thread-safe values view."""
        with self._lock:
            return list(self._dict.values())

    def items(self) -> list[tuple[K, V]]:
        """Thread-safe items view."""
        with self._lock:
            return list(self._dict.items())

    def copy(self) -> 'ThreadSafeDict[K, V]':
        """Thread-safe copy operation."""
        with self._lock:
            return ThreadSafeDict(self._dict.copy())
