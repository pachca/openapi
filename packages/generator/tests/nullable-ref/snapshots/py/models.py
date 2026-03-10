from __future__ import annotations

from dataclasses import dataclass

@dataclass
class Address:
    city: str
    zip: str | None = None


@dataclass
class Person:
    id: int
    name: str
    home_address: Address | None = None
    work_address: Address | None = None
