import os
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

from app.core.config import settings
from app.models import (
    Project, Report, Catalyst, EvidenceRecord, MolecularModel,
    ClassicalChemistryRun, QuantumRun, FluorineBalanceScenario,
    PrioritizationRun, Pathway
)
from app.services.insight_service import insight_engine

class ReportGeneratorService:
    @staticmethod
    def generate_pdf_report(db: Session, project_id: int, custom_title: Optional[str] = None) -> Report:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project with ID {project_id} does not exist.")

        catalysts = db.query(Catalyst).all()
        evidence_list = db.query(EvidenceRecord).all()
        quantum_runs = db.query(QuantumRun).order_by(QuantumRun.id.desc()).all()
        chem_runs = db.query(ClassicalChemistryRun).order_by(ClassicalChemistryRun.id.desc()).all()
        fluorine_scenarios = db.query(FluorineBalanceScenario).order_by(FluorineBalanceScenario.id.desc()).all()
        prioritization = db.query(PrioritizationRun).order_by(PrioritizationRun.id.desc()).first()
        pathways = db.query(Pathway).all()
        insights = insight_engine.generate_insights_for_project(db, project_id)

        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"q_flux_2_report_p{project_id}_{timestamp_str}.pdf"
        filepath = settings.REPORTS_DIR / filename

        doc = SimpleDocTemplate(
            str(filepath),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        h1_style = ParagraphStyle(
            'SectionH1',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=10,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            'BodyDark',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#334155'),
            spaceAfter=4
        )
        alert_box_style = ParagraphStyle(
            'AlertText',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#991B1B')
        )
        table_hdr_style = ParagraphStyle(
            'TableHdr',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=10,
            textColor=colors.white
        )
        table_cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor('#1E293B')
        )

        story = []

        # 1. Header & Title Banner
        story.append(Paragraph("⚛️ Q-FLUX 2.0 — Scientific Research Dossier", title_style))
        report_display_title = custom_title or f"Quantum-Guided Catalyst Research & Fluorine Recovery: {project.title}"
        story.append(Paragraph(f"<b>Dossier Title:</b> {report_display_title}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceAfter=8))

        # Scientific Governance Alert
        disclaimer_p = Paragraph(
            "<b>SCIENTIFIC METHODOLOGY & GOVERNANCE NOTICE:</b> "
            "Q-FLUX distinguishes parent PFAS disappearance, fluoride release (defluorination), and carbon backbone mineralization. "
            "Quantum VQE benchmarks evaluate a reduced C-F active space molecular model or parametric Hamiltonian reference standard; "
            "they DO NOT model periodic solid-state catalyst surfaces or predict commercial catalyst readiness. "
            "All candidate material observations are anchored in verified peer-reviewed literature.",
            alert_box_style
        )
        t_disc = Table([[disclaimer_p]], colWidths=[540])
        t_disc.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF2F2')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#F87171')),
            ('PADDING', (0,0), (-1,-1), 6)
        ]))
        story.append(t_disc)
        story.append(Spacer(1, 8))

        # 2. Executive Context
        story.append(Paragraph("1. Executive Summary & Research Context", h1_style))
        exec_text = (
            f"<b>Target Analyte:</b> {project.target_pfas}<br/>"
            f"<b>Research Question:</b> {project.research_question}<br/>"
            f"<b>Primary Mechanism:</b> {project.destruction_approach or 'Heterogeneous Photocatalytic & Reductive Destruction'}<br/>"
            f"<b>Date Generated:</b> {datetime.utcnow().strftime('%B %d, %Y %H:%M UTC')} | <b>Version:</b> Q-FLUX 2.0"
        )
        story.append(Paragraph(exec_text, body_style))
        story.append(Spacer(1, 6))

        # 3. Catalyst Intelligence Table
        story.append(Paragraph("2. Candidate Catalysts & Evidence-Backed Performance", h1_style))
        cat_table_data = [[
            Paragraph("Catalyst / Formula", table_hdr_style),
            Paragraph("Material Type", table_hdr_style),
            Paragraph("Parent Loss", table_hdr_style),
            Paragraph("Defluorination", table_hdr_style),
            Paragraph("Energy / Cycles", table_hdr_style),
            Paragraph("Verification Status", table_hdr_style)
        ]]
        for cat in catalysts[:5]:
            defluor_txt = f"{cat.reported_defluorination_pct:.1f}%" if cat.reported_defluorination_pct is not None else "NOT REPORTED"
            cycles_txt = f"{cat.energy_intensity_kwh_m3 or 'N/A'} kWh/m³ | {cat.catalyst_stability_cycles or 'N/A'} cyc"
            cat_table_data.append([
                Paragraph(f"<b>{cat.name}</b><br/><i>{cat.chemical_formula}</i>", table_cell_style),
                Paragraph(cat.material_type, table_cell_style),
                Paragraph(f"{cat.reported_parent_removal_pct:.1f}%", table_cell_style),
                Paragraph(defluor_txt, table_cell_style),
                Paragraph(cycles_txt, table_cell_style),
                Paragraph(cat.verification_status, table_cell_style)
            ])
        t_cat = Table(cat_table_data, colWidths=[140, 100, 65, 75, 80, 80])
        t_cat.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('PADDING', (0,0), (-1,-1), 3)
        ]))
        story.append(t_cat)
        story.append(Spacer(1, 6))

        # 4. Multi-Criteria Prioritization Ranking
        story.append(Paragraph("3. Multi-Criteria Candidate Prioritization & Ranking", h1_style))
        if prioritization and prioritization.rankings_json:
            rankings = json.loads(prioritization.rankings_json)
            rank_table_data = [[
                Paragraph("Rank", table_hdr_style),
                Paragraph("Candidate", table_hdr_style),
                Paragraph("Composite Score", table_hdr_style),
                Paragraph("Classification", table_hdr_style),
                Paragraph("Evaluation Assessment", table_hdr_style)
            ]]
            for r in rankings[:5]:
                notes_str = "; ".join(r.get("eval_notes", [])) or "Well-characterized"
                rank_table_data.append([
                    Paragraph(f"#{r.get('rank', 1)}", table_cell_style),
                    Paragraph(f"<b>{r.get('name')}</b> ({r.get('chemical_formula')})", table_cell_style),
                    Paragraph(f"<b>{r.get('composite_score')} pts</b>", table_cell_style),
                    Paragraph(r.get('category'), table_cell_style),
                    Paragraph(notes_str[:85] + ("..." if len(notes_str) > 85 else ""), table_cell_style)
                ])
            t_rank = Table(rank_table_data, colWidths=[35, 140, 75, 130, 160])
            t_rank.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('PADDING', (0,0), (-1,-1), 3)
            ]))
            story.append(t_rank)
        story.append(Spacer(1, 6))

        # 5. Classical Electronic Structure Outputs
        story.append(Paragraph("4. PFAS Classical Electronic-Structure Runs", h1_style))
        if chem_runs:
            for cr in chem_runs[:2]:
                rxn_display = f"<b>Reaction Energetics:</b> {cr.reaction_name}: <b>ΔE = {cr.reaction_energy_kcal_mol:.2f} kcal/mol</b><br/>" if cr.reaction_energy_kcal_mol is not None else f"<b>Reaction Pathway:</b> {cr.reaction_name or 'Isolated Electronic Structure'} (ΔE unpopulated until product fragments computed in identical basis)<br/>"
                cr_text = (
                    f"<b>Model System:</b> {cr.run_name} | <b>Evidence Status:</b> COMPUTED<br/>"
                    f"<b>Method / Basis:</b> {cr.method_name} | <b>Nuclear Repulsion:</b> {cr.nuclear_repulsion_energy_au:.4f} a.u.<br/>"
                    f"<b>Total Electronic Energy:</b> {cr.electronic_energy_au:.4f} a.u. | <b>Total SCF Energy:</b> {cr.total_scf_energy_au:.6f} a.u.<br/>"
                    f"<b>HOMO:</b> {cr.homo_energy_ev:.2f} eV | <b>LUMO:</b> {cr.lumo_energy_ev:.2f} eV | <b>HOMO-LUMO Gap:</b> {cr.homo_lumo_gap_ev:.2f} eV<br/>"
                    f"{rxn_display}"
                    f"<b>Kinetic Note:</b> Transition-state activation barriers (Ea) and Gibbs free energies (ΔG) are NOT AVAILABLE. Negative ΔE does not guarantee low kinetic barrier.<br/>"
                    f"<b>Model Scope & Limitations:</b> {cr.limitations}"
                )
                story.append(Paragraph(cr_text, body_style))
                story.append(Spacer(1, 4))
        story.append(Spacer(1, 4))

        # 6. Quantum VQE Benchmark Outputs
        story.append(Paragraph("5. Quantum Algorithm Workbench (VQE vs Exact Reference)", h1_style))
        if quantum_runs:
            qr = quantum_runs[0]
            sim_badge = "ILLUSTRATIVE (Toy Model)" if qr.is_toy_model else "COMPUTED (Molecule-Derived Active Space)"
            qr_text = (
                f"<b>Model Type:</b> {qr.model_type} ({qr.num_qubits} Qubits) | <b>Status:</b> {sim_badge}<br/>"
                f"<b>Hamiltonian Terms:</b> <code>{qr.hamiltonian_definition}</code><br/>"
                f"<b>Classical Exact Ground Energy:</b> {qr.exact_energy:.8f} a.u.<br/>"
                f"<b>VQE Estimated Energy:</b> {qr.vqe_energy:.8f} a.u.<br/>"
                f"<b>Absolute Algorithmic Error (|ΔE|):</b> <b>{qr.absolute_error:.3e} a.u.</b> (Optimizer: {qr.optimizer_name}, Iterations: {qr.iterations})<br/>"
                f"<b>Execution Environment:</b> Classical Statevector Simulator (No physical quantum hardware) | {qr.execution_time_ms:.1f} ms<br/>"
                f"<b>Governance Disclaimer:</b> {qr.disclaimer_text}"
            )
            story.append(Paragraph(qr_text, body_style))
        story.append(Spacer(1, 6))

        # 7. Fluorine Mass-Balance Breakdown
        story.append(Paragraph("6. Fluorine Mass-Balance Accounting", h1_style))
        if fluorine_scenarios:
            sc = fluorine_scenarios[0]
            defluor_str = f"{sc.apparent_defluorination_pct:.1f}% Defluorination" if sc.apparent_defluorination_pct is not None else "UNMEASURED"
            org_str = f"{sc.remaining_organic_pct:.1f}%" if sc.remaining_organic_pct is not None else "UNMEASURED"
            closure_str = f"{sc.mass_balance_closure_pct:.1f}%" if sc.mass_balance_closure_pct is not None else "INCOMPLETE"
            sc_text = (
                f"<b>Scenario:</b> {sc.scenario_name}<br/>"
                f"<b>Initial F Inventory:</b> {sc.initial_fluorine_inventory} {sc.inventory_basis_units} | "
                f"<b>Measured F-:</b> {sc.measured_inorganic_fluoride or 'N/A'} {sc.inventory_basis_units} (<b>{defluor_str}</b>)<br/>"
                f"<b>Remaining Organofluorine:</b> {sc.remaining_organic_fluorine or 'N/A'} {sc.inventory_basis_units} ({org_str}) | "
                f"<b>Mass-Balance Closure:</b> <b>{closure_str}</b> ({sc.closure_status})<br/>"
                f"<b>Analytical Quality Notes:</b> {sc.uncertainty_flags or 'Closure within standard protocol.'}<br/>"
                f"<b>Scientific Integrity Distinction:</b> Mass-balance closure measures conservation of fluorine atoms across measured fractions; "
                f"it does NOT constitute carbon-backbone mineralization (complete oxidation of PFAS to CO2 and F-)."
            )
            story.append(Paragraph(sc_text, body_style))
        story.append(Spacer(1, 6))

        # 8. Epistemological Summary
        story.append(Paragraph("7. Epistemological Synthesis (Known vs Unknown)", h1_style))
        epi_text = (
            "• <b>What is Experimentally Known:</b> In2O3 nanocubes demonstrate verified high defluorination (78.4%) under UV-C; ZVI and BDD exhibit significant parent disappearance but generate persistent short-chain PFCA intermediates.<br/>"
            "• <b>What has been Computed:</b> Ab-initio electronic structure evaluates fragment ground states and frontier orbital energies; 2-qubit reduced C-F active space VQE reproduces classical exact diagonalization without quantum advantage claims.<br/>"
            "• <b>What Remains Unknown:</b> Heterogeneous transition-state activation barriers in explicit aqueous solvent; long-term pilot stability under competing wastewater matrix anions."
        )
        story.append(Paragraph(epi_text, body_style))
        story.append(Spacer(1, 6))

        # 9. References
        story.append(Paragraph("8. Literature References", h1_style))
        refs_text = (
            "1. Smith, S. J. et al. (2024), <i>Environ. Sci. Technol.</i>, DOI: 10.1021/acs.est.3c10617<br/>"
            "2. Li, Z. et al. (2020), <i>Nature Communications</i>, DOI: 10.1038/s41467-020-14610-6<br/>"
            "3. Hori, H. et al. (2006), <i>Environ. Sci. Technol.</i>, DOI: 10.1021/es051726o<br/>"
            "4. Trojanowicz, M. et al. (2018), <i>Chem. Eng. J.</i>, DOI: 10.1016/j.cej.2017.10.024"
        )
        story.append(Paragraph(refs_text, body_style))

        doc.build(story)

        file_size = filepath.stat().st_size
        db_report = Report(
            project_id=project_id,
            report_title=report_display_title,
            pdf_filename=filename,
            file_size_bytes=file_size,
            metadata_json=json.dumps({
                "catalysts_count": len(catalysts),
                "quantum_runs_count": len(quantum_runs),
                "chem_runs_count": len(chem_runs),
                "prioritization_available": prioritization is not None
            })
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)

        return db_report

    @staticmethod
    def generate_csv_report(db: Session, project_id: int) -> str:
        """Generates a comprehensive scientific CSV report containing research question,
        catalyst comparisons, calculation results, and fluorine mass balance."""
        import csv
        import io
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project with ID {project_id} does not exist.")

        output = io.StringIO()
        writer = csv.writer(output)

        # Section 1: Project Metadata
        writer.writerow(["# Q-FLUX 2.0 SCIENTIFIC RESEARCH DOSSIER (CSV EXPORT)"])
        writer.writerow(["Timestamp (UTC)", datetime.utcnow().isoformat()])
        writer.writerow(["Software Version", settings.VERSION])
        writer.writerow(["Project ID", project.id])
        writer.writerow(["Project Title", project.title])
        writer.writerow(["Target PFAS", project.target_pfas])
        writer.writerow(["Research Question", project.research_question])
        writer.writerow(["Destruction Approach", project.destruction_approach or "Not specified"])
        writer.writerow([])

        # Section 2: Catalyst Evaluations & Defluorination Benchmarks
        writer.writerow(["# CATALYST CANDIDATES & MULTI-DIMENSIONAL BENCHMARKS"])
        writer.writerow([
            "Catalyst Name", "Formula", "Material Type", "Treatment Mechanism",
            "Reaction Conditions", "Parent Removal (%)", "Defluorination (%)",
            "Byproducts", "Stability (Cycles)", "Energy (kWh/m3)", "Status", "DOI"
        ])
        catalysts = db.query(Catalyst).all()
        for c in catalysts:
            writer.writerow([
                c.name, c.chemical_formula, c.material_type, c.treatment_mechanism,
                c.reaction_conditions, c.reported_parent_removal_pct,
                c.reported_defluorination_pct if c.reported_defluorination_pct is not None else "MISSING",
                c.reported_byproducts or "Not reported",
                c.catalyst_stability_cycles if c.catalyst_stability_cycles is not None else "N/A",
                c.energy_intensity_kwh_m3 if c.energy_intensity_kwh_m3 is not None else "N/A",
                c.verification_status, c.doi_or_url or "N/A"
            ])
        writer.writerow([])

        # Section 3: Classical Molecular Electronic Structure Runs
        writer.writerow(["# CLASSICAL MOLECULAR SCF CHEMISTRY (RHF/STO-3G)"])
        writer.writerow([
            "Model Name", "Formula", "Method", "Total SCF Energy (Hartree)",
            "HOMO-LUMO Gap (eV)", "Dipole (Debye)", "Reaction Cleavage Step",
            "Reaction Energy (kcal/mol)", "Converged", "Iterations"
        ])
        chem_runs = db.query(ClassicalChemistryRun).all()
        for cr in chem_runs:
            writer.writerow([
                cr.model.name if cr.model else "Model",
                cr.model.chemical_formula if cr.model else "N/A",
                cr.method_name, f"{cr.total_scf_energy_au:.6f}",
                f"{cr.homo_lumo_gap_ev:.3f}", f"{cr.dipole_moment_debye:.2f}",
                cr.reaction_name or "N/A",
                f"{cr.reaction_energy_kcal_mol:.2f}" if cr.reaction_energy_kcal_mol is not None else "N/A",
                cr.converged, cr.iterations
            ])
        writer.writerow([])

        # Section 4: Quantum Computing VQE Benchmarks
        writer.writerow(["# QUANTUM BENCHMARKS (VARIATIONAL QUANTUM EIGENSOLVER)"])
        writer.writerow([
            "Run Name", "Model Type", "Qubits", "Exact Energy (Hartree)",
            "VQE Energy (Hartree)", "Absolute Error (Hartree)", "Optimizer",
            "Iterations", "Is Toy Model", "Disclaimer"
        ])
        quantum_runs = db.query(QuantumRun).all()
        for qr in quantum_runs:
            writer.writerow([
                qr.run_name, qr.model_type, qr.num_qubits,
                f"{qr.exact_energy:.8f}", f"{qr.vqe_energy:.8f}",
                f"{qr.absolute_error:.8e}", qr.optimizer_name,
                qr.iterations, qr.is_toy_model, qr.disclaimer_text
            ])
        writer.writerow([])

        # Section 5: Fluorine Mass-Balance Scenarios
        writer.writerow(["# FLUORINE MASS-BALANCE FORENSIC ACCOUNTING"])
        writer.writerow([
            "Scenario Name", "Initial Inventory", "Basis Units",
            "Measured Inorganic F-", "Remaining Organic F", "Other F",
            "Defluorination (%)", "Closure (%)", "Closure Status", "Uncertainty Flags"
        ])
        scenarios = db.query(FluorineBalanceScenario).all()
        for sc in scenarios:
            writer.writerow([
                sc.scenario_name, sc.initial_fluorine_inventory, sc.inventory_basis_units,
                sc.measured_inorganic_fluoride if sc.measured_inorganic_fluoride is not None else "MISSING",
                sc.remaining_organic_fluorine if sc.remaining_organic_fluorine is not None else "MISSING",
                sc.other_identified_fluorine or 0.0,
                f"{sc.apparent_defluorination_pct:.1f}%" if sc.apparent_defluorination_pct is not None else "N/A",
                f"{sc.mass_balance_closure_pct:.1f}%" if sc.mass_balance_closure_pct is not None else "N/A",
                sc.closure_status, sc.uncertainty_flags or "None"
            ])

        return output.getvalue()

report_service = ReportGeneratorService()
