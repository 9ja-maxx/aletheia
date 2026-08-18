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


def _clean(s, lo: int, hi: int, label: str) -> str:
    s = str(s if s is not None else "").strip()
    if not (lo <= len(s) <= hi):
        raise gl.vm.UserError(f"{ERR_USER} {label} length must be between {lo} and {hi} characters")
    return s


def _normalize_verdict(raw) -> dict:
    if isinstance(raw, str):
        first, last = raw.find("{"), raw.rfind("}")
        if first < 0 or last < 0:
            raise gl.vm.UserError(f"{ERR_LLM} Response format is invalid (no JSON object found)")
        try:
            raw = json.loads(raw[first:last + 1])
        except Exception as e:
            raise gl.vm.UserError(f"{ERR_LLM} JSON decode error: {str(e)}")
    if not isinstance(raw, dict):
        raise gl.vm.UserError(f"{ERR_LLM} Verdict response is not a valid dictionary object")
    
    verdict = str(raw.get("verdict", "")).strip().upper()
    if verdict not in ("DEFEND", "OVERTHROW"):
        raise gl.vm.UserError(f"{ERR_LLM} Invalid verdict value received: {verdict!r}")
        
    try:
        margin = max(0, min(100, int(round(float(str(raw.get("margin", 0)).strip())))))
    except (ValueError, TypeError):
        raise gl.vm.UserError(f"{ERR_LLM} Margin field is not a valid numeric integer")
        
    reasoning = str(raw.get("reasoning", raw.get("note", ""))).strip()[:300]
    return {"verdict": verdict, "margin": margin, "reasoning": reasoning}


def _handle_leader_error(leaders_res, leader_fn) -> bool:
    leader_msg = getattr(leaders_res, "message", "")
    try:
        leader_fn()
        return False
    except gl.vm.UserError as e:
        msg = getattr(e, "message", str(e))
        if msg.startswith(ERR_USER) or msg.startswith(ERR_LLM):
            return msg == leader_msg
        return False
    except Exception:
        return False


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
