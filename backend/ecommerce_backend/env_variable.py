import os
from enum import Enum

class EnvVariable(Enum):
    BUCKET_NAME = os.environ["BUCKET_NAME"]
