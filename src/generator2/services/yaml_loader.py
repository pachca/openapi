from pathlib import Path

from ruamel.yaml import YAML

from .constants import PATH_TO_YAML

YAML_DICT = YAML(typ='rt').load(Path(PATH_TO_YAML))
