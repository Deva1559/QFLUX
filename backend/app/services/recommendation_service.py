from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models import Catalyst, EvidenceRecord, TreatmentExperiment, ClassicalChemistryRun, PrioritizationRun
from app.schemas import RecommendationResponse, RecommendationEvidenceItem
from app.services.prioritization_service import prioritization_engine

class TransparentRecommendationEngine:
    @staticmethod
    def generate_recommendations(
        db: Session,
        target_pfas: str = "PFOA",
        project_id: Optional[int] = None
    ) -> List[RecommendationResponse]:
        """Synthesizes stored evidence, defluorination penalties, and molecular models
        into transparent, evidence-grounded research recommendations."""
        # 1. Run or get prioritization results
        res = prioritization_engine.run_prioritization(db=db, project_id=project_id)
        rankings = res.get("rankings", [])
        
        recommendations: List[RecommendationResponse] = []

        for rank_idx, r in enumerate(rankings, start=1):
            cat_id = r.get("catalyst_id") or r.get("id")
            cat = db.query(Catalyst).filter(Catalyst.id == cat_id).first()
            if not cat:
                continue

            # Check if defluorination penalty was applied
            penalty_applied = cat.reported_defluorination_pct is None or (cat.reported_defluorination_pct < 40.0)
            if cat.reported_defluorination_pct is None:
                penalty_explanation = (
                    "Mandatory Defluorination Penalty: Literature source does not report stoichiometric "
                    "inorganic fluoride recovery. Without verified fluoride release, high parent disappearance "
                    "may represent mere conversion to shorter-chain PFCAs or matrix adsorption."
                )
            elif cat.reported_defluorination_pct < 40.0:
                penalty_explanation = (
                    f"Low Defluorination Warning ({cat.reported_defluorination_pct:.1f}%): Over 60% of original fluorine "
                    "remains in mobile, persistent fluorinated intermediates."
                )
            else:
                penalty_explanation = "No penalty applied: Stoichiometric fluoride recovery verified in primary literature."

            # Confidence assessment
            if cat.verification_status == "Verified against primary literature" and cat.reported_defluorination_pct is not None:
                confidence = "High Confidence" if cat.reported_defluorination_pct >= 70.0 else "Moderate Confidence"
            elif cat.verification_status == "Hypothetical candidate":
                confidence = "Preliminary / Theoretical (No Experimental Synthesis)"
            else:
                confidence = "Moderate Confidence with Data Gaps"

            # Gather supporting evidence
            evidence_items: List[RecommendationEvidenceItem] = []
            ev_records = db.query(EvidenceRecord).filter(EvidenceRecord.catalyst_id == cat.id).all()
            for ev in ev_records:
                evidence_items.append(RecommendationEvidenceItem(
                    catalyst_name=cat.name,
                    treatment_method=cat.treatment_mechanism,
                    target_pfas=cat.target_pfas,
                    reported_parent_removal_pct=ev.parent_removal_pct or cat.reported_parent_removal_pct,
                    reported_defluorination_pct=ev.defluorination_pct or cat.reported_defluorination_pct,
                    byproduct_risk=cat.reported_byproducts or "Not reported",
                    doi_or_url=ev.doi_or_url or cat.doi_or_url,
                    evidence_category=ev.evidence_category
                ))
            if not evidence_items:
                evidence_items.append(RecommendationEvidenceItem(
                    catalyst_name=cat.name,
                    treatment_method=cat.treatment_mechanism,
                    target_pfas=cat.target_pfas,
                    reported_parent_removal_pct=cat.reported_parent_removal_pct,
                    reported_defluorination_pct=cat.reported_defluorination_pct,
                    byproduct_risk=cat.reported_byproducts or "Not reported",
                    doi_or_url=cat.doi_or_url,
                    evidence_category=cat.evidence_category
                ))

            # Molecular mechanistic insights derived from structured material classification and treatment mechanism
            mat_type = (cat.material_type or "").lower()
            mechanism = (cat.treatment_mechanism or "").lower()

            if "semiconductor" in mat_type or "photocatal" in mechanism:
                mech_insights = (
                    "Photo-generated electron-hole pairs drive interfacial charge transfer. "
                    "In n-type metal oxide semiconductors with oxygen vacancies, localized active sites "
                    "facilitate carboxylate coordination and decarboxylation, initiating step-wise defluorination."
                )
            elif "transition metal" in mat_type or "reduction" in mechanism or "redox" in mechanism:
                mech_insights = (
                    "Single-electron transfer (SET) initiates reductive radical scission of the terminal C-F or C-C bond. "
                    "However, rapid formation of passivating oxide/hydroxide layers curtails long-term electron transfer kinetics."
                )
            elif "electrode" in mat_type or "electrochemical" in mechanism or "anodic" in mechanism:
                mech_insights = (
                    "Direct anodic oxidation drives single-electron extraction from the carboxylate head group. "
                    "High overpotentials generate volatile fluorocarbon fragments and shorter PFCAs unless mass transport is tightly controlled."
                )
            elif "single-atom" in mat_type or "coordination" in mechanism:
                mech_insights = (
                    "Coordinatively unsaturated transition-metal centers coordinate the perfluoroalkyl terminal group, "
                    "lowering the activation barrier for initial C-F scission. Requires rigorous experimental verification of synthesis."
                )
            else:
                mech_insights = "General radical cleavage pathway. Ab-initio surface adsorption modeling is recommended."

            # Missing measurements & uncertainty
            missing = []
            if cat.reported_defluorination_pct is None:
                missing.append("Inorganic fluoride (F-) mass-balance closure")
            if cat.catalyst_stability_cycles is None:
                missing.append("Long-term reusability and cycle deactivation rates")
            if not cat.reported_byproducts:
                missing.append("Volatile organofluorine byproduct speciation (GC-MS / 19F-NMR)")
            if cat.energy_intensity_kwh_m3 is None:
                missing.append("Electrical energy per order of magnitude (EEO / kWh/m3)")

            # Proposed next experiment based on structured material class and data gaps
            if cat.reported_defluorination_pct is None:
                proposed_exp = "Execute closed-vessel batch reactor degradation with quantitative ion chromatography (IC) to measure inorganic fluoride (F-) mass-balance closure."
                conditions_hold = "Essential to confirm whether parent loss represents true defluorination rather than physical adsorption."
            elif "semiconductor" in mat_type or "photocatal" in mechanism:
                proposed_exp = "Measure fluoride release closure in real groundwater matrices containing sulfate/chloride competing anions at neutral pH 7.0."
                conditions_hold = "Valid only when light irradiation can penetrate the medium without excessive turbidity or organic scavenging."
            elif "transition metal" in mat_type or "reduction" in mechanism:
                proposed_exp = "Perform closed-vessel headspace gas chromatography (GC-MS) to quantify volatile fluorocarbon emissions and acid wash rejuvenation."
                conditions_hold = "Valid strictly under anaerobic/acidic conditions (pH <= 3.5); passivates in oxygenated neutral water."
            elif "electrode" in mat_type or "electrochemical" in mechanism:
                proposed_exp = "Benchmark energy consumption (kWh/m3) at sub-ppm PFAS concentrations using flow-through electrochemical reactors."
                conditions_hold = "Valid in low-chloride waters; formation of toxic chlorate/perchlorate occurs when chloride exceeds 50 mg/L."
            elif "single-atom" in mat_type or "coordination" in mechanism:
                proposed_exp = "Complete wet-chemical synthesis, pyrolysis, and HAADF-STEM validation followed by micro-reactor defluorination testing."
                conditions_hold = "Subject to laboratory experimental synthesis confirmation; theoretical model candidate."
            else:
                proposed_exp = "Synthesize sample batch and perform closed-mass-balance batch reactor testing with ion chromatography."
                conditions_hold = "Subject to laboratory experimental confirmation."

            recommendations.append(RecommendationResponse(
                candidate_name=cat.name,
                target_pfas=cat.target_pfas,
                rank=rank_idx,
                composite_score=round(r["composite_score"], 4),
                confidence_assessment=confidence,
                defluorination_penalty_applied=penalty_applied,
                penalty_explanation=penalty_explanation,
                supporting_evidence=evidence_items,
                molecular_mechanistic_insights=mech_insights,
                missing_measurements=missing,
                potential_hazards=r.get("notes", []),
                proposed_next_experiment=proposed_exp,
                conditions_under_which_recommendation_holds=conditions_hold
            ))

        return recommendations

recommendation_engine = TransparentRecommendationEngine()
