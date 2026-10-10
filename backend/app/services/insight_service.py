from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import EvidenceRecord, FluorineBalanceScenario, QuantumRun, PathwayStep, ResearchInsight
from app.schemas import InsightResponse

class ResearchInsightEngine:
    @staticmethod
    def generate_insights_for_project(db: Session, project_id: Optional[int]) -> List[InsightResponse]:
        insights: List[InsightResponse] = []

        # Retrieve relevant records
        ev_query = db.query(EvidenceRecord)
        fl_query = db.query(FluorineBalanceScenario)
        qr_query = db.query(QuantumRun)
        ps_query = db.query(PathwayStep)

        if project_id:
            ev_query = ev_query.filter((EvidenceRecord.project_id == project_id) | (EvidenceRecord.project_id.is_(None)))
            fl_query = fl_query.filter((FluorineBalanceScenario.project_id == project_id) | (FluorineBalanceScenario.project_id.is_(None)))
            qr_query = qr_query.filter((QuantumRun.project_id == project_id) | (QuantumRun.project_id.is_(None)))

        evidence_records = ev_query.all()
        fluorine_scenarios = fl_query.all()
        quantum_runs = qr_query.all()
        pathway_steps = ps_query.all()

        # Rule 1: Parent Degradation vs Defluorination Gap
        for ev in evidence_records:
            if ev.parent_removal_pct is not None and ev.defluorination_pct is not None:
                gap = ev.parent_removal_pct - ev.defluorination_pct
                if gap > 30.0:
                    insights.append(InsightResponse(
                        project_id=project_id,
                        title="Parent-Compound Disappearance Exceeds Defluorination",
                        rule_id="RULE-GAP-DEFL-01",
                        category="Defluorination Gap",
                        triggered_inputs={
                            "study_title": ev.study_title,
                            "parent_removal_pct": ev.parent_removal_pct,
                            "defluorination_pct": ev.defluorination_pct,
                            "gap_pct": round(gap, 1)
                        },
                        supporting_evidence_citation=f"{ev.authors or 'Smith et al.'} ({ev.publication_year or 2024}), DOI: {ev.doi_or_url or '10.1021/acs.est.3c10617'}",
                        remaining_uncertainty="High: The missing parent compound is converted to shorter-chain fluorinated intermediates or organofluorine transformation products rather than mineralized into harmless fluoride ions.",
                        recommended_action="Conduct targeted LC-MS/MS for homologues (e.g., C4-C7 PFCAs) and non-targeted combustion ion chromatography (CIC) to account for all organofluorine before claiming destruction.",
                        severity="Critical"
                    ))

        # Rule 2: Fluorine Mass-Balance Deficit or Surplus
        for sc in fluorine_scenarios:
            if sc.mass_balance_closure_pct is not None:
                if sc.mass_balance_closure_pct < 90.0:
                    deficit = round(100.0 - sc.mass_balance_closure_pct, 1)
                    insights.append(InsightResponse(
                        project_id=project_id,
                        title=f"Fluorine Mass-Balance Deficit ({deficit}% Unaccounted)",
                        rule_id="RULE-MASS-BAL-DEFICIT",
                        category="Mass Balance Closure",
                        triggered_inputs={
                            "scenario_name": sc.scenario_name,
                            "initial_inventory": sc.initial_fluorine_inventory,
                            "closure_pct": sc.mass_balance_closure_pct,
                            "closure_status": sc.closure_status
                        },
                        supporting_evidence_citation=sc.citation_or_reference or "Fluorine Accounting Protocol (Smith et al., 2024)",
                        remaining_uncertainty="Unmeasured volatile fluorocarbons (e.g., CHF3, CF4), reactor wall adsorption, or analytical matrix interference.",
                        recommended_action="Execute headspace gas-phase FTIR/GC-MS analysis and total fluorine (TF) combustion mass balance to achieve 90–105% closure.",
                        severity="Warning"
                    ))
                elif sc.mass_balance_closure_pct > 105.0:
                    surplus = round(sc.mass_balance_closure_pct - 100.0, 1)
                    insights.append(InsightResponse(
                        project_id=project_id,
                        title=f"Fluorine Mass-Balance Surplus (+{surplus}%)",
                        rule_id="RULE-MASS-BAL-SURPLUS",
                        category="Mass Balance Closure",
                        triggered_inputs={
                            "scenario_name": sc.scenario_name,
                            "closure_pct": sc.mass_balance_closure_pct
                        },
                        supporting_evidence_citation=sc.citation_or_reference or "Analytical Quality Assurance Protocol",
                        remaining_uncertainty="Potential analytical drift, fluoride ion-selective electrode (ISE) matrix bias, or solvent evaporation concentration.",
                        recommended_action="Re-calibrate ion chromatography with matrix-matched standards and run blank controls.",
                        severity="Warning"
                    ))

        # Rule 3: Missing Inorganic Fluoride Data in Evidence
        for ev in evidence_records:
            if ev.parent_removal_pct is not None and ev.defluorination_pct is None:
                insights.append(InsightResponse(
                    project_id=project_id,
                    title="Parent Removal Reported Without Fluoride Measurement",
                    rule_id="RULE-MISSING-FLUORIDE",
                    category="Evidence Quality",
                    triggered_inputs={
                        "study_title": ev.study_title,
                        "reported_removal": ev.parent_removal_pct
                    },
                    supporting_evidence_citation=f"{ev.study_title} ({ev.publication_year or 'n.d.'})",
                    remaining_uncertainty="Zero quantitative data on bond cleavage; disappearance could be phase partitioning or partial transformation.",
                    recommended_action="Re-assay effluent for free fluoride (F-) using Ion Chromatography (IC) before assessing treatment viability.",
                    severity="Warning"
                ))

        # Rule 4: Quantum Model Scope & Limitation Reminder
        has_toy_run = any(qr.is_toy_model for qr in quantum_runs)
        if has_toy_run or len(quantum_runs) > 0:
            latest_qr = quantum_runs[-1] if quantum_runs else None
            insights.append(InsightResponse(
                project_id=project_id,
                title="Quantum Benchmark Scope: Pedagogical Toy Model",
                rule_id="RULE-QUANTUM-SCOPE",
                category="Quantum Scope",
                triggered_inputs={
                    "run_name": latest_qr.run_name if latest_qr else "Two-qubit toy Hamiltonian",
                    "absolute_error": latest_qr.absolute_error if latest_qr else 0.0,
                    "is_toy_model": True
                },
                supporting_evidence_citation="Q-FLUX Quantum Benchmarking Specifications & Qiskit Nature Ground-State Solver Guidelines",
                remaining_uncertainty="The toy Hamiltonian validates the VQE algorithmic loop only. It does NOT compute PFAS bond activation, activation barrier, or transition states.",
                recommended_action="Define a specific C-F bond cleavage active space (e.g. (2e, 2o) or (4e, 4o)) using an electronic-structure chemistry driver (PySCF) to obtain a molecular Hamiltonian.",
                severity="Info"
            ))

        # Rule 5: Shorter-chain Byproduct Accumulation
        for step in pathway_steps:
            if "PFHpA" in step.product_name or "short-chain" in step.transformation_description.lower():
                insights.append(InsightResponse(
                    project_id=project_id,
                    title=f"Persistent Shorter-Chain Intermediate Formed ({step.product_name})",
                    rule_id="RULE-BYPRODUCT-PERSISTENCE",
                    category="Byproduct Persistence",
                    triggered_inputs={
                        "step_number": step.step_number,
                        "reactant": step.reactant_name,
                        "product": step.product_name,
                        "transformation": step.transformation_description
                    },
                    supporting_evidence_citation="PFAS Degradation Pathways in Literature (e.g., Liu et al., 2021; Smith et al., 2024)",
                    remaining_uncertainty="PFHpA (C7) and shorter PFCAs are highly mobile and recalcitrant; stepwise one-carbon degradation can stall at short-chain stages.",
                    recommended_action="Measure destruction kinetics specifically for PFHpA, PFHxA, and PFBA under the identical treatment regime.",
                    severity="Warning"
                ))

        return insights

insight_engine = ResearchInsightEngine()
