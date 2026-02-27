from enum import Enum

class SearchSortOrder(str, Enum):
    ALPHABETICAL = "alphabetical"
    BY_SCORE = "by_score"

    def __str__(self) -> str:
        return str(self.value)
