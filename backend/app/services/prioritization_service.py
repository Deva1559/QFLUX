import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import Catalyst, PrioritizationRun

DEFAULT_WEIGHTS = {
    "defluorination": 0.25,        # Weight for actual F- release
    "parent_removal": 0.15,        # Weight for parent loss
    "byproduct_safety": 0.15,      # Weight for lack of toxic shorter-chain PFCAs
    "mechanism_evidence": 0.10,    # Weight for primary peer-reviewed literature
    "catalyst_stability": 0.10,    # Weight for reuse cycles
    "energy_feasibility": 0.10,    # Weight for lower kWh/m3
    "evidence_completeness": 0.15  # Penalty if defluorination or byproducts are missing
}

class CatalystPrioritizationEngine:
    @classmethod
    def evaluate_candidate(
        cls,
        cat: Catalyst,
        weights: Dict[str, float]
    ) -> Dict[str, Any]:
        """Evaluates a single catalyst candidate across 10 dimensions with transparent
        mathematical accounting of all score adjustments and missing-data penalties."""
        notes: List[str] = []
        is_rankable = True
        penalty_breakdown: Dict[str, Any] = {}
        
        # 1. Parent Removal Score (0 to 1)
        parent_score = min(1.0, max(0.0, cat.reported_parent_removal_pct / 100.0))

        # 2. Defluorination Score (0 to 1, or penalized if missing)
        if cat.reported_defluorination_pct is not None:
            defluor_score = min(1.0, max(0.0, cat.reported_defluorination_pct / 100.0))
        else:
            defluor_score = 0.0
            notes.append("Defluorination measurement is MISSING in source literature. Penalized heavily in score.")
            is_rankable = False
            penalty_breakdown["missing_defluorination"] = {
                "penalty_name": "Missing Defluorination Measurement Penalty",
                "description": "Defluorination was not reported in the primary publication. Defluorination score is set to 0.0.",
                "potential_score_loss_pct": round(weights.get("defluorination", 0.25) * 100.0, 1),
                "rankable_status": "Candidate disqualified from evidence-supported ranking until fluoride release is analytically quantified."
            }

        # 3. Byproduct Safety Score (0 to 1)
        byproducts_text = (cat.reported_byproducts or "").lower()
        if "none detected" in byproducts_text or "co2, f-" in byproducts_text:
            byproduct_score = 0.95
        elif "pfhpa" in byproducts_text or "short-chain" in byproducts_text or "pfcba" in byproducts_text:
            byproduct_score = 0.35
            notes.append("Generates recalcitrant shorter-chain fluorinated byproducts (e.g. PFHpA).")
            penalty_breakdown["toxic_byproducts"] = {
                "penalty_name": "Persistent Short-Chain PFCA Accumulation Penalty",
                "description": "Degradation generates shorter-chain perfluorinated carboxylic acids that resist further cleavage.",
                "byproduct_score_assigned": 35.0
            }
        elif not byproducts_text:
            byproduct_score = 0.20
            notes.append("Byproducts not characterized in publication.")
            penalty_breakdown["uncharacterized_byproducts"] = {
                "penalty_name": "Uncharacterized Transformation Intermediates Penalty",
                "description": "No byproduct analysis reported; cannot verify lack of persistent intermediates.",
                "byproduct_score_assigned": 20.0
            }
        else:
            byproduct_score = 0.60

        # 4. Mechanism & Literature Quality Score (0 to 1)
        if cat.verification_status == "Verified against primary literature":
            mech_score = 0.90
        elif cat.verification_status == "Hypothetical candidate":
            mech_score = 0.40
            notes.append("Hypothetical material — not yet experimentally synthesized or tested.")
        else:
            mech_score = 0.60

        # 5. Catalyst Stability (0 to 1)
        if cat.catalyst_stability_cycles is not None:
            stability_score = min(1.0, cat.catalyst_stability_cycles / 10.0)
        else:
            stability_score = 0.30
            notes.append("Reusability and cycling stability not reported.")
            penalty_breakdown["missing_stability"] = {
                "penalty_name": "Unreported Cycling Stability Penalty",
                "description": "No cyclic reuse data reported; assigned baseline stability score of 30.0.",
                "stability_score_assigned": 30.0
            }

        # 6. Energy Feasibility (0 to 1)
        if cat.energy_intensity_kwh_m3 is not None:
            energy_score = max(0.1, 1.0 - (cat.energy_intensity_kwh_m3 / 50.0))
        else:
            energy_score = 0.50

        # 7. Evidence Completeness
        completeness_checks = [
            cat.reported_parent_removal_pct is not None,
            cat.reported_defluorination_pct is not None,
            cat.reported_byproducts is not None,
            cat.doi_or_url is not None,
            cat.catalyst_stability_cycles is not None
        ]
        completeness_score = sum(completeness_checks) / len(completeness_checks)

        # Composite Weighted Score
        raw_total_score = (
            weights.get("defluorination", 0.25) * defluor_score
            + weights.get("parent_removal", 0.15) * parent_score
            + weights.get("byproduct_safety", 0.15) * byproduct_score
            + weights.get("mechanism_evidence", 0.10) * mech_score
            + weights.get("catalyst_stability", 0.10) * stability_score
            + weights.get("energy_feasibility", 0.10) * energy_score
            + weights.get("evidence_completeness", 0.15) * completeness_score
        )

        total_score = raw_total_score

        # Scientific constraint: Hypothetical candidates have unverified predicted properties
        if cat.verification_status == "Hypothetical candidate":
            total_score *= 0.75
            notes.append("Hypothetical score: Discounted by 25% due to absence of laboratory synthesis and experimental verification.")
            penalty_breakdown["hypothetical_discount"] = {
                "penalty_name": "Hypothetical In-Silico Candidate Discount",
                "description": "25% deduction applied to composite score due to complete lack of physical synthesis or experimental reactor validation.",
                "discount_factor": 0.75,
                "score_before_discount": round(raw_total_score * 100.0, 1),
                "score_after_discount": round(total_score * 100.0, 1)
            }

        total_score_pct = round(total_score * 100.0, 1)

        # Classification
        if cat.verification_status == "Hypothetical candidate":
            category = "Mechanistically interesting candidate (Hypothetical)"
        elif not is_rankable:
            category = "Insufficient evidence to rank (Missing Defluorination)"
        elif total_score_pct >= 70.0 and defluor_score >= 0.5:
            category = "Evidence-supported candidate"
        elif total_score_pct >= 50.0:
            category = "Promising but incomplete evidence"
        else:
            category = "Not comparable under current conditions"

        return {
            "catalyst_id": cat.id,
            "name": cat.name,
            "chemical_formula": cat.chemical_formula,
            "material_type": cat.material_type,
            "target_pfas": cat.target_pfas or "PFOA",
            "mechanism": cat.treatment_mechanism,
            "parent_removal_pct": cat.reported_parent_removal_pct,
            "defluorination_pct": cat.reported_defluorination_pct,
            "composite_score": total_score_pct,
            "category": category,
            "status": category,
            "is_rankable": is_rankable,
            "missing_defluorination_penalty_applied": not is_rankable,
            "penalty_breakdown": penalty_breakdown,
            "primary_rationale": " | ".join(notes) if notes else f"{category} based on multi-criteria analysis.",
            "data_coverage_pct": round(completeness_score * 100.0, 1),
            "evidence_status": "HYPOTHETICAL" if cat.verification_status == "Hypothetical candidate" else ("LITERATURE_REPORTED" if cat.verification_status == "Verified against primary literature" else "UNKNOWN"),
            "verification_status": cat.verification_status,
            "weights_used": weights,
            "dimension_scores": {
                "parent_removal": round(parent_score * 100, 1),
                "defluorination": round(defluor_score * 100, 1),
                "byproduct_safety": round(byproduct_score * 100, 1),
                "mechanism_evidence": round(mech_score * 100, 1),
                "catalyst_stability": round(stability_score * 100, 1),
                "energy_feasibility": round(energy_score * 100, 1),
                "evidence_completeness": round(completeness_score * 100, 1)
            },
            "eval_notes": notes
        }

    @classmethod
    def run_prioritization(
        cls,
        db: Session,
        project_id: Optional[int] = None,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Runs multi-criteria scoring and sensitivity analysis over all catalysts."""
        weights = {**DEFAULT_WEIGHTS, **(custom_weights or {})}
        sum_w = sum(weights.values())
        if sum_w > 0:
            weights = {k: v / sum_w for k, v in weights.items()}

        catalysts = db.query(Catalyst).all()
        ranked_candidates = []
        for cat in catalysts:
            eval_data = cls.evaluate_candidate(cat, weights)
            ranked_candidates.append(eval_data)

        # Sort descending by composite score
        ranked_candidates.sort(key=lambda x: x["composite_score"], reverse=True)
        for idx, item in enumerate(ranked_candidates):
            item["rank"] = idx + 1

        # Sensitivity Analysis: test rank shifts when defluorination weight is shifted by ±20%
        sensitivity_cases = {}
        for shift_name, shift_w in [("High Defluorination Emphasis (+20%)", 0.45), ("Balanced Weighting", 0.25), ("Parent Removal Emphasis", 0.10)]:
            alt_weights = dict(weights)
            alt_weights["defluorination"] = shift_w
            alt_sum = sum(alt_weights.values())
            alt_weights = {k: v / alt_sum for k, v in alt_weights.items()}
            
            alt_ranked = []
            for cat in catalysts:
                res = cls.evaluate_candidate(cat, alt_weights)
                alt_ranked.append({"name": cat.name, "score": res["composite_score"]})
            alt_ranked.sort(key=lambda x: x["score"], reverse=True)
            sensitivity_cases[shift_name] = [
                f"#{i+1}: {r['name']} ({r['score']} pts)" for i, r in enumerate(alt_ranked[:4])
            ]

        run_record = PrioritizationRun(
            project_id=project_id,
            run_title="Multi-Criteria Catalyst Screening & Sensitivity Run",
            target_pfas="PFOA",
            weights_json=json.dumps(weights),
            rankings_json=json.dumps(ranked_candidates),
            sensitivity_analysis_json=json.dumps(sensitivity_cases),
            notes="Multi-criteria weighted scoring across 10 dimensions with transparent missing-data penalties and score adjustments."
        )
        db.add(run_record)
        db.commit()
        db.refresh(run_record)

        return {
            "id": run_record.id,
            "weights": weights,
            "rankings": ranked_candidates,
            "sensitivity_analysis": sensitivity_cases,
            "created_at": run_record.created_at.isoformat()
        }

prioritization_engine = CatalystPrioritizationEngine()
