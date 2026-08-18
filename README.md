# Aletheia: The Evidence-Grounded Debate Arena

> **A Decentralized Fact-Adjudicated Coliseum on GenLayer**

Aletheia is a decentralized dispute and debate terminal where users challenge claims (Theses) not through mere rhetoric, but through **verifiable evidence**. Unlike typical subjective AI forums, every argument proposed or challenged in Aletheia must be anchored to a public **Evidence URL**. GenLayer's validators fetch the live webpage content on-chain, and an LLM arbiter judges the claims strictly against the retrieved web facts. 

---

## 🐉 The Dragon Coliseum flow

Below is the architectural flow of Aletheia, showing how claims and evidence are processed and verified:

```mermaid
graph TD
    classDef challenger fill:#2d1a1a,stroke:#b91c1c,stroke-width:2px,color:#fca5a5;
    classDef incumbent fill:#1e293b,stroke:#0ea5e9,stroke-width:2px,color:#bae6fd;
    classDef validator fill:#1a2d1a,stroke:#16a34a,stroke-width:2px,color:#bbf7d0;
    classDef contract fill:#2e1f47,stroke:#8b5cf6,stroke-width:2px,color:#ddd6fe;

    subgraph UserAction ["The Challenge Arena"]
        Challenger["Contender (Antithesis Claim + Evidence URL)"]:::challenger
        Incumbent["Proponent (Thesis Claim + Evidence URL)"]:::incumbent
    end

    subgraph OnChainVM ["Aletheia GenVM Intelligent Contract"]
        Crawler["Web Crawler: gl.nondet.web.get(url)"]:::contract
        Arbiter["Dragon Arbiter LLM Adjudicator"]:::contract
        Store["State Storage (Optimized TreeMap Mappings)"]:::contract
    end

    subgraph ConsensusJury ["Decentralized Validator Jury"]
        Leader["Consensus Leader Node"]:::validator
        Validators["Honest Validator Nodes"]:::validator
    end

    Challenger -->|Submit clash_thesis| Leader
    Incumbent -->|Stored thesis| Leader

    Leader -->|1. Triggers Web Fetching| Crawler
    Crawler -->|2. Pulls live evidence page text| Arbiter
    
    Arbiter -->|3. Rules on categorical verdict & tight margin| Leader
    Leader -->|4. Proposes block & outputs| Validators
    
    Validators -->|5. Re-fetches web data & executes evaluation| Validators
    Validators -->|6. Check verdict match & margin delta <= 12| Leader
    
    Leader -->|7. Writes result to state on consensus| Store
    Store -->|If Overthrown: Rotate Thesis Proponent| Store
    Store -->|Prune logs using O(1) circular queue| Store
```

---

## Key Innovations & Resolutions

Aletheia is designed to address key production constraints of LLM-native smart contracts:

1. **Factual Grounding (Web Crawling):**
   We enforce factual grounding by requiring an `evidence_url` on proposal and clash. The contract fetches the live page content using `gl.nondet.web.get(url)` and truncates it to fit LLM window sizes, ensuring the judge bases its verdict strictly on verifiable public text.
2. **Consensus Stability (Tight Margin Tolerance):**
   By grounding evaluations on specific crawled text rather than general training data, we naturally reduce LLM variance. This allows us to tighten the validator consensus tolerance window to **12 points** (down from 30 in previous builds), improving audit accuracy.
3. **Aligned Exception Routing:**
   Exception types are unified under `ERR_USER` and `ERR_LLM`. The leader node and validators raise the same tagged exceptions during parsing errors, preventing consensus failure when handling malformed LLM outputs.
4. **O(1) Circular Event Buffer:**
   Instead of clearing and rebuilding the event ledger on every write, we overwrite elements at a modulo index (`total_debates % MAX_LOG_SIZE`). This keeps log prunings at an `O(1)` gas fee on-chain, while the view function sorts it chronologically off-chain.
5. **TreeMap Storage Partitioning:**
   We store state fields in independent maps (`arena_topics`, `arena_proponents`, `arena_claims`, etc.) instead of serializing the entire arena object to a JSON string. This eliminates the gas cost of serialization/deserialization during writes.

---

## Contract Public API

### Mutating Transactions (Writes)
* **`propose_thesis(topic: str, opening_claim: str, evidence_url: str) -> str`**
  * Establishes a new debate arena, setting the creator as the proponent.
* **`clash_thesis(arena_id: str, contender_claim: str, contender_evidence_url: str)`**
  * Launches an AI consensus duel. The incumbent stands unless the challenger is factually superior.

### Query View Methods (Views)
* **`get_stats() -> dict`**
  * Returns global counters: total arenas, total debates, total overthrows.
* **`get_arena(arena_id: str) -> dict`**
  * Returns detailed state and progression history for a specific topic.
* **`get_arenas(start: int) -> list`**
  * Paged list of debate arenas, newest first.
* **`get_ledger(start: int) -> list`**
  * Paged list of historical event logs sorted chronologically (newest first).

---

## Setup & Testing

### 1. Compile & Lint Contract
```bash
pip install genvm-linter
genvm-lint contracts/aletheia.py
```

### 2. Run Integration Tests
Make sure the GenLayer test runner is installed, then execute:
```bash
gltest tests/integration/ -v -s --network studionet
```

### 3. Start Frontend Local Dev
```bash
cd frontend
npm install
npm run dev
```

---

## License
MIT. Owned and maintained by **9ja_maxx**.
