# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

# --- Coliseum Constants & Custom Error Markers ---
# We tag error strings to identify whether they are user inputs or system anomalies.
ERR_USER = "[EXPECTED_USER_ERROR]"
ERR_LLM = "[NATURAL_LANGUAGE_PARSING_ERROR]"
ERR_SYSTEM = "[UNEXPECTED_SYSTEM_FAULT]"

# Boundaries for strings, limits, and windowed logs
MAX_TOPIC_LENGTH = 100
MAX_CLAIM_LENGTH = 600
MAX_URL_LENGTH = 200
MAX_EVIDENCE_LENGTH = 3000  # truncate webpage content to fit LLM window constraints
MAX_HISTORY_LENGTH = 30     # number of generational thesis updates retained
MAX_LOG_SIZE = 150          # circular log limit
MARGIN_TOLERANCE = 12       # consensus threshold for LLM margin variance
