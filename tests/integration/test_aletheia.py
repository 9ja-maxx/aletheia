from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


def test_propose_and_clash_consensus():
    factory = get_contract_factory("Aletheia")
    contract = factory.deploy(args=[])

    # 1. Propose debate thesis with topic, claim, and evidence URL
    rc = contract.propose_thesis(
        args=[
            "Climate Change Impact on Agriculture",
            "Severe drought conditions will reduce global crop yields by 15% before 2030.",
            "https://example.com/climate-report-2026"
        ]
    ).transact()
    assert tx_execution_succeeded(rc)

    arenas = contract.get_arenas(args=[0]).call()
    assert len(arenas) == 1
    arena = arenas[0]
    assert arena["topic"] == "Climate Change Impact on Agriculture"
    assert arena["claim"] == "Severe drought conditions will reduce global crop yields by 15% before 2030."
    assert arena["evidence_url"] == "https://example.com/climate-report-2026"
    assert int(arena["progression_index"]) == 1

    arena_id = arena["id"]

    # 2. Clash thesis with contender claim and contender evidence URL
    rc2 = contract.clash_thesis(
        args=[
            arena_id,
            "Crop adaptation strategies will mitigate drought losses, maintaining stable yields.",
            "https://example.com/agri-adaptation-report"
        ]
    ).transact()
    assert tx_execution_succeeded(rc2)

    arena_updated = contract.get_arena(args=[arena_id]).call()
    assert int(arena_updated["clashes"]) == 1
    assert arena_updated["claim"] in (
        "Severe drought conditions will reduce global crop yields by 15% before 2030.",
        "Crop adaptation strategies will mitigate drought losses, maintaining stable yields."
    )

    stats = contract.get_stats(args=[]).call()
    assert int(stats["debates"]) == 1
