import os
from decouple import config, UndefinedValueError

def get_env_variable(var_name, default=None, cast_type=str):
    """Retrieve environment variable safely with fallback to os.environ"""
    try:
        return config(var_name, default=default, cast=cast_type)
    except UndefinedValueError:
        return os.getenv(var_name, default)