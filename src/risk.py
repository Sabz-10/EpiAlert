
def assign_review_priority(top_5_flag, district_rank):

    # Check whether the district was selected in the top 5
    if str(top_5_flag).strip().lower() in ("true", "1", "yes"):
        return "Priority Review"

    return "Not Selected"


def explain_review_priority(top_5_flag, district_rank):

    selected = str(top_5_flag).strip().lower() in (
        "true", "1", "yes"
    )

    if selected:
        return (
            f"This district was selected for review "
            f"with a relative model rank of {district_rank}."
        )

    return (
        f"This district was not selected in the top-five "
        f"review list. Its relative model rank was {district_rank}."
    )
