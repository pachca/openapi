from __future__ import annotations

from dataclasses import dataclass

@dataclass
class Category:
    id: int
    name: str
    parent: Category | None = None
    children: list[Category] | None = None


@dataclass
class TreeNode:
    value: str
    left: TreeNode | None = None
    right: TreeNode | None = None
