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


class Aletheia(gl.Contract):
    """
    Aletheia is a decentralized, evidence-grounded debate arena on GenLayer.
    Unlike subjective debate forums, every claim must be backed by a web evidence URL,
    which is resolved on-chain via GenLayer's non-deterministic web fetching.
    """
    owner: Address
    arena_topics: TreeMap[str, str]           # arena_id -> topic string
    arena_proponents: TreeMap[str, Address]    # arena_id -> current proponent Address
    arena_claims: TreeMap[str, str]           # arena_id -> current thesis claim string
    arena_evidence: TreeMap[str, str]         # arena_id -> current evidence URL
    arena_defenses: TreeMap[str, u256]        # arena_id -> count of successful defenses
    arena_clashes: TreeMap[str, u256]         # arena_id -> total duels run
    arena_founders: TreeMap[str, Address]     # arena_id -> founder Address
    arena_stages: TreeMap[str, u256]          # arena_id -> generation stage (progression index)
    
    # Store progression history in a key-value format: "arenaId_stageIndex" -> JSON representation
    arena_history: TreeMap[str, str]
    
    arena_ids: DynArray[str]
    ledger: DynArray[str]                     # append-only debate logs
    seq: u256
    total_debates: u256
    total_overthrows: u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.seq = u256(0)
        self.total_debates = u256(0)
        self.total_overthrows = u256(0)
