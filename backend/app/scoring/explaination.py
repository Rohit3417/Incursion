from typing import List, Dict, Any

def generate_explanations(results: List[Dict[str, Any]], top_x: int) -> List[Dict[str, Any]]:
    """
    Computes explanation data per team: points and share per criterion, top two strengths, 
    weakest criterion, failed eligibility rules, gap to the top-X cutoff, missing warnings, 
    and deterministic template text[cite: 6].
    """
    # Find the score of the team exactly at the top_x cutoff[cite: 6]
    shortlisted = [r for r in results if r.get("status") == "Shortlisted"]
    cutoff_score = min((r.get("team_score", 0.0) for r in shortlisted), default=0.0)

    for team in results:
        status = team.get("status")
        breakdown = team.get("criterion_breakdown", {})
        total_score = team.get("team_score", 0.0)
        failed_rules = team.get("failed_rules", [])
        warnings = team.get("missing_warnings", [])

        # Calculate share per criterion and sort to find strengths and weaknesses[cite: 6]
        shares = {}
        sorted_criteria = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)
        
        for k, pts in breakdown.items():
            shares[k] = round((pts / total_score * 100), 1) if total_score > 0 else 0.0

        top_strengths = [c[0] for c in sorted_criteria[:2] if c[1] > 0]
        weakest = sorted_criteria[-1][0] if sorted_criteria else None
        gap_to_cutoff = round(total_score - cutoff_score, 2)

        # Build template text strictly from run data[cite: 6]
        if status == "Shortlisted":
            strengths_str = " and ".join(top_strengths) if top_strengths else "consistent performance"
            text = (
                f"Shortlisted (Rank #{team.get('rank')}) because of strong {strengths_str} "
                f"(+{abs(gap_to_cutoff)} pts above the Top-{top_x} cutoff)."
            )
        elif status == "Not shortlisted":
            weak_str = f" Weakest area: {weakest}." if weakest else ""
            text = (
                f"Not shortlisted (Rank #{team.get('rank')}); fell {abs(gap_to_cutoff)} pts "
                f"short of the Top-{top_x} cutoff.{weak_str}"
            )
        elif status == "Ineligible":
            rule_names = ", ".join(
                [f"{r['rule']['signal']} {r['rule']['operator']} {r['rule']['value']}" for r in failed_rules]
            )
            text = f"Ineligible due to failed rules: {rule_names}."
        else:
            warn_str = ", ".join(warnings) if warnings else "incomplete profile signals"
            text = f"Needs review due to missing or uncertain data ({warn_str})."

        team["explanation_details"] = {
            "criterion_shares": shares,
            "top_two_strengths": top_strengths,
            "weakest_criterion": weakest,
            "gap_to_cutoff": gap_to_cutoff,
            "failed_eligibility_rules": failed_rules,
            "missing_warnings": warnings
        }
        team["explanation"] = text

    return results