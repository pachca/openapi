from __future__ import annotations

from dataclasses import dataclass

@dataclass
class Task:
    id: int
    title: str
    is_done: bool | None = None


@dataclass
class TaskUpdateRequestTask:
    title: str | None = None
    is_done: bool | None = None


@dataclass
class TaskUpdateRequest:
    task: TaskUpdateRequestTask
