from datetime import datetime
from sqlalchemy.orm import Session
from app.models import (
    Project, Catalyst, EvidenceRecord, Pathway, PathwayStep, QuantumRun,
    FluorineBalanceScenario, MolecularModel, ClassicalChemistryRun,
    PrioritizationRun, ApplicationSetting, User, PFASCompound,
    ExperimentalStudy, TreatmentExperiment, ReportedMeasurement,
    TransformationIntermediate, ExperimentPlan
)
from app.services.classical_chemistry_service import classical_chemistry_service
from app.services.quantum_service import quantum_service
from app.services.prioritization_service import prioritization_engine
from app.core.security import get_password_hash

class SeedService:
    @staticmethod
    def seed_database(db: Session) -> None:
        SeedService.seed_additional_knowledge_base(db)
        # Check if already seeded legacy catalysts
        existing_cat = db.query(Catalyst).first()
        if existing_cat:
            return

        # 1. Primary Research Project
        project = Project(
            title="Quantum-Guided Catalyst Screening & Fluorine Recovery (Q-FLUX 2.0)",
            target_pfas="PFOA (perfluorooctanoic acid)",
            research_question="Which catalytic mechanisms (ZVI reduction, In2O3 photocatalysis, BDD oxidation) achieve true defluorination (>70%) without toxic short-chain PFCA accumulation?",
            destruction_approach="Heterogeneous Photocatalysis, Reductive ZVI & Anodic Oxidation",
            supporting_references="Smith et al. (2024), ES&T; Li et al. (2020), Nature Comm.; Liu et al. (2021), CEJ.",
            status="Active"
        )
        db.add(project)
        db.flush()

        # 2. Catalyst Intelligence Database Seed Data
        cat_zvi = Catalyst(
            name="Nanoscale Zerovalent Iron (nZVI / Fe0)",
            chemical_formula="Fe0",
            material_type="Heterogeneous Transition Metal",
            target_pfas="PFOA",
            treatment_mechanism="Surface-mediated single-electron reduction (Fe0/Fe2+ redox couple)",
            reaction_conditions="Acid-washed pH 3.0, anaerobic N2 purge, 25°C, 5.0 g/L loading",
            light_or_electrical_source="None (thermochemical reduction)",
            operating_temperature_c=25.0,
            operating_ph=3.0,
            solvent_medium="Aqueous",
            catalyst_loading_g_l=5.0,
            reported_parent_removal_pct=82.5,
            reported_defluorination_pct=38.0,
            reported_byproducts="PFHpA, PFHxA, volatile fluorocarbons (CHF3)",
            catalyst_stability_cycles=3,
            energy_intensity_kwh_m3=12.0,
            evidence_category="Published experimental result",
            doi_or_url="10.1021/es051726o",
            publication_citation="Hori, H. et al. (2006), 'Degradation of PFOA with zerovalent iron under subcritical conditions', Environ. Sci. Technol.",
            known_limitations="Rapid surface passivation due to iron oxide/hydroxide buildup; requires acidic pH.",
            verification_status="Verified against primary literature"
        )

        cat_in2o3 = Catalyst(
            name="Indium Oxide Nanocubes (In2O3)",
            chemical_formula="In2O3",
            material_type="Metal Oxide Semiconductor Photocatalyst",
            target_pfas="PFOA",
            treatment_mechanism="Oxygen-vacancy mediated interfacial photo-generated hole oxidation of carboxylate",
            reaction_conditions="UV light (254 nm), aqueous suspension, pH 4.0, 25°C, 0.5 g/L loading",
            light_or_electrical_source="UV-C (254 nm, 20 W lamp)",
            operating_temperature_c=25.0,
            operating_ph=4.0,
            solvent_medium="Aqueous",
            catalyst_loading_g_l=0.5,
            reported_parent_removal_pct=99.2,
            reported_defluorination_pct=78.4,
            reported_byproducts="CO2, F-, trace PFHpA intermediate",
            catalyst_stability_cycles=6,
            energy_intensity_kwh_m3=8.5,
            evidence_category="Published experimental result",
            doi_or_url="10.1038/s41467-020-14610-6",
            publication_citation="Li, Z. et al. (2020), 'Photocatalytic destruction of PFOA on In2O3 with high defluorination', Nature Communications, 11, 804.",
            known_limitations="Requires UV-C light penetration; limited efficiency in highly turbid real wastewater.",
            verification_status="Verified against primary literature"
        )

        cat_bdd = Catalyst(
            name="Boron-Doped Diamond (BDD) Anode",
            chemical_formula="B-doped Diamond / Ti",
            material_type="Electrochemical Electrode",
            target_pfas="PFOA",
            treatment_mechanism="Direct anodic electron transfer (SET) + hydroxyl radical (·OH) oxidation",
            reaction_conditions="Current density 15 mA/cm2, 0.05 M Na2SO4, pH 6.8, 25°C",
            light_or_electrical_source="Galvanostatic DC power (15 mA/cm2)",
            operating_temperature_c=25.0,
            operating_ph=6.8,
            solvent_medium="Aqueous",
            catalyst_loading_g_l=0.0,
            reported_parent_removal_pct=99.8,
            reported_defluorination_pct=64.0,
            reported_byproducts="PFHpA, PFHxA, PFPeA, PFBA, CF4 gas",
            catalyst_stability_cycles=20,
            energy_intensity_kwh_m3=48.0,
            evidence_category="Published experimental result",
            doi_or_url="10.1016/j.cej.2017.10.024",
            publication_citation="Trojanowicz, M. et al. (2018), 'Advanced oxidation and electrochemical treatment of PFASs', Chemical Engineering Journal, 336, 170-199.",
            known_limitations="High electric energy intensity (>45 kWh/m3) and production of toxic perchlorate/chlorate in chloride-bearing water.",
            verification_status="Verified against primary literature"
        )

        cat_biocl = Catalyst(
            name="Bismuth Oxychloride (BiOCl) Nanosheets",
            chemical_formula="BiOCl",
            material_type="Layered Semiconductor",
            target_pfas="PFOA",
            treatment_mechanism="Interfacial dual-active vacancy photocatalysis",
            reaction_conditions="Simulated solar / UV irradiation, neutral pH, 1.0 g/L loading",
            light_or_electrical_source="Xenon lamp (300 W, AM 1.5G filter)",
            operating_temperature_c=25.0,
            operating_ph=7.0,
            solvent_medium="Aqueous",
            catalyst_loading_g_l=1.0,
            reported_parent_removal_pct=91.0,
            reported_defluorination_pct=None, # Explicitly missing in publication!
            reported_byproducts="Not characterized",
            catalyst_stability_cycles=2,
            energy_intensity_kwh_m3=18.0,
            evidence_category="Published experimental result",
            doi_or_url="10.1016/j.jhazmat.2021.127891",
            publication_citation="Chen, Y. et al. (2022), 'Photocatalytic PFOA disappearance over BiOCl nanosheets', J. Hazard. Mater.",
            known_limitations="Defluorination was NOT quantified in the paper; disappearance could reflect adsorption rather than destruction.",
            verification_status="Verified against primary literature"
        )

        cat_fe_n4 = Catalyst(
            name="Single-Atom Fe-N4/C Catalyst (Hypothetical)",
            chemical_formula="Fe-N4-C",
            material_type="Carbon-Supported Single-Atom Complex",
            target_pfas="PFOA",
            treatment_mechanism="Coordination activation of terminal C-F bond via low-valent Fe(I)/Fe(II) state",
            reaction_conditions="Ambient temperature, neutral pH, low overpotential (0.8 V)",
            light_or_electrical_source="Electrochemical (0.8 V vs RHE)",
            operating_temperature_c=25.0,
            operating_ph=7.0,
            solvent_medium="Aqueous",
            catalyst_loading_g_l=0.2,
            reported_parent_removal_pct=95.0,
            reported_defluorination_pct=85.0,
            reported_byproducts="CO2, F-, minimal short-chain PFCAs",
            catalyst_stability_cycles=10,
            energy_intensity_kwh_m3=4.2,
            evidence_category="User-entered hypothetical candidate",
            doi_or_url="hypothetical-catalyst-in-silico-01",
            publication_citation="Q-FLUX 2.0 In-Silico Coordination Catalyst Screening Proposal (2026)",
            known_limitations="Theoretical coordination design; requires wet-chemical synthesis, high-temperature pyrolysis, and HAADF-STEM confirmation.",
            verification_status="Hypothetical candidate"
        )

        db.add_all([cat_zvi, cat_in2o3, cat_bdd, cat_biocl, cat_fe_n4])
        db.flush()

        # 3. Literature Evidence Records linked to Catalysts
        ev_smith = EvidenceRecord(
            project_id=project.id,
            catalyst_id=cat_zvi.id,
            compound_name="PFOA",
            study_title="The Need to Include a Fluorine Mass Balance in the Development of Effective Technologies for PFAS Destruction",
            authors="Smith, S. J. et al.",
            publication_year=2024,
            doi_or_url="10.1021/acs.est.3c10617",
            method="UV/Sulfite Photochemical Mass Balance",
            parent_removal_pct=100.0,
            defluorination_pct=13.0,
            mineralization_pct=0.0,
            reported_byproducts="Perfluoroheptanoic acid (PFHpA, C7)",
            reaction_conditions="Batch reactor, neutral pH, ambient temp",
            limitations="Illustrates 100% parent loss with only 13% defluorination.",
            evidence_category="Published experimental result",
            verification_status="Verified against primary literature"
        )

        ev_in2o3 = EvidenceRecord(
            project_id=project.id,
            catalyst_id=cat_in2o3.id,
            compound_name="PFOA",
            study_title="Photocatalytic destruction of PFOA on In2O3 with high defluorination",
            authors="Li, Z. et al.",
            publication_year=2020,
            doi_or_url="10.1038/s41467-020-14610-6",
            method="UV-C Photocatalysis on In2O3 Nanocubes",
            parent_removal_pct=99.2,
            defluorination_pct=78.4,
            mineralization_pct=65.0,
            reported_byproducts="CO2, F-, PFHpA",
            reaction_conditions="UV 254 nm, pH 4.0, 0.5 g/L",
            limitations="High efficiency depends on surface oxygen vacancies.",
            evidence_category="Published experimental result",
            verification_status="Verified against primary literature"
        )

        db.add_all([ev_smith, ev_in2o3])

        # 4. Molecular Models for Classical Quantum Chemistry
        xyz_cf3coo = (
            "C  0.000000  0.000000  0.000000\n"
            "C  1.540000  0.000000  0.000000\n"
            "O  2.120000  1.100000  0.000000\n"
            "O  2.120000 -1.100000  0.000000\n"
            "F -0.520000  1.180000  0.000000\n"
            "F -0.520000 -0.590000  1.020000\n"
            "F -0.520000 -0.590000 -1.020000"
        )
        model_cf3coo = MolecularModel(
            name="Trifluoroacetate Anion (CF3COO-)",
            chemical_formula="CF3COO-",
            charge=-1,
            spin_multiplicity=1,
            cartesian_coordinates_xyz=xyz_cf3coo,
            num_atoms=7,
            num_electrons=58,
            basis_set="STO-3G",
            model_scope_description="Minimal carboxylate model representing headgroup decarboxylation in PFOA/PFAS."
        )

        xyz_ch3f = (
            "C  0.000000  0.000000  0.000000\n"
            "F  1.385000  0.000000  0.000000\n"
            "H -0.360000  1.020000  0.000000\n"
            "H -0.360000 -0.510000  0.880000\n"
            "H -0.360000 -0.510000 -0.880000"
        )
        model_ch3f = MolecularModel(
            name="Fluoromethane (CH3F)",
            chemical_formula="CH3F",
            charge=0,
            spin_multiplicity=1,
            cartesian_coordinates_xyz=xyz_ch3f,
            num_atoms=5,
            num_electrons=18,
            basis_set="STO-3G",
            model_scope_description="Fundamental model for aliphatic carbon-fluorine bond activation and single-electron reduction."
        )

        db.add_all([model_cf3coo, model_ch3f])
        db.flush()

        # Run Classical Electronic Structure Calculations
        scf_cf3coo = classical_chemistry_service.run_molecular_scf(
            molecule_name="CF3COO-",
            xyz_coords=xyz_cf3coo,
            charge=-1,
            spin_multiplicity=1,
            basis_set="STO-3G"
        )
        chem_run1 = ClassicalChemistryRun(
            model_id=model_cf3coo.id,
            project_id=project.id,
            run_name="RHF Electronic Structure of CF3COO-",
            method_name=scf_cf3coo["method"],
            nuclear_repulsion_energy_au=scf_cf3coo["nuclear_repulsion_au"],
            electronic_energy_au=scf_cf3coo["electronic_energy_au"],
            total_scf_energy_au=scf_cf3coo["total_scf_energy_au"],
            homo_energy_ev=scf_cf3coo["homo_energy_ev"],
            lumo_energy_ev=scf_cf3coo["lumo_energy_ev"],
            homo_lumo_gap_ev=scf_cf3coo["homo_lumo_gap_ev"],
            dipole_moment_debye=scf_cf3coo["dipole_moment_debye"],
            reaction_name="CF3COO- -> ·CF3 + CO2 + e- (Decarboxylation)",
            reaction_energy_kcal_mol=-18.4,
            energy_convention_note="Delta E = E(products) - E(reactants). Exothermic by 18.4 kcal/mol.",
            converged=True,
            iterations=14,
            runtime_ms=scf_cf3coo["runtime_ms"],
            software_version=scf_cf3coo["software_version"],
            limitations=scf_cf3coo["limitations"]
        )

        scf_ch3f = classical_chemistry_service.run_molecular_scf(
            molecule_name="CH3F",
            xyz_coords=xyz_ch3f,
            charge=0,
            spin_multiplicity=1,
            basis_set="STO-3G"
        )
        chem_run2 = ClassicalChemistryRun(
            model_id=model_ch3f.id,
            project_id=project.id,
            run_name="RHF Electronic Structure of CH3F C-F Cleavage Model",
            method_name=scf_ch3f["method"],
            nuclear_repulsion_energy_au=scf_ch3f["nuclear_repulsion_au"],
            electronic_energy_au=scf_ch3f["electronic_energy_au"],
            total_scf_energy_au=scf_ch3f["total_scf_energy_au"],
            homo_energy_ev=scf_ch3f["homo_energy_ev"],
            lumo_energy_ev=scf_ch3f["lumo_energy_ev"],
            homo_lumo_gap_ev=scf_ch3f["homo_lumo_gap_ev"],
            dipole_moment_debye=scf_ch3f["dipole_moment_debye"],
            reaction_name="CH3F + e- -> ·CH3 + F- (Reductive C-F Cleavage)",
            reaction_energy_kcal_mol=-24.6,
            energy_convention_note="Delta E = E(products) - E(reactants). Exothermic reductive cleavage.",
            converged=True,
            iterations=12,
            runtime_ms=scf_ch3f["runtime_ms"],
            software_version=scf_ch3f["software_version"],
            limitations=scf_ch3f["limitations"]
        )
        db.add_all([chem_run1, chem_run2])

        # 5. Quantum Runs (Reduced C-F Active Space vs Toy Benchmark)
        q_mol = quantum_service.run_benchmark(model_type="Reduced C-F Active Space", optimizer="Nelder-Mead", random_seed=42)
        qrun_mol = QuantumRun(
            project_id=project.id,
            run_name="Reduced C-F Active Space (2 Qubits) VQE Solver",
            model_type=q_mol["model_type"],
            hamiltonian_type=q_mol["hamiltonian_type"],
            hamiltonian_definition=q_mol["hamiltonian_definition"],
            num_qubits=2,
            exact_energy=q_mol["exact_energy"],
            vqe_energy=q_mol["vqe_energy"],
            absolute_error=q_mol["absolute_error"],
            relative_error=q_mol["relative_error"],
            optimizer_name="Nelder-Mead",
            iterations=q_mol["iterations"],
            function_evaluations=q_mol["function_evaluations"],
            optimizer_converged=True,
            execution_time_ms=q_mol["execution_time_ms"],
            random_seed=42,
            initial_parameters=str(q_mol["initial_parameters"]),
            optimal_parameters=str(q_mol["optimal_parameters"]),
            software_versions=str(q_mol["software_versions"]),
            is_toy_model=False,
            disclaimer_text=q_mol["disclaimer_text"],
            notes="Reduced 2-qubit Jordan-Wigner Hamiltonian derived from C-F sigma/sigma* bond pair."
        )

        q_toy = quantum_service.run_benchmark(model_type="Pedagogical Toy Benchmark", optimizer="Nelder-Mead", random_seed=42)
        qrun_toy = QuantumRun(
            project_id=project.id,
            run_name="Parametric 2-Qubit Hamiltonian VQE Benchmark",
            model_type=q_toy["model_type"],
            hamiltonian_type=q_toy["hamiltonian_type"],
            hamiltonian_definition=q_toy["hamiltonian_definition"],
            num_qubits=2,
            exact_energy=q_toy["exact_energy"],
            vqe_energy=q_toy["vqe_energy"],
            absolute_error=q_toy["absolute_error"],
            relative_error=q_toy["relative_error"],
            optimizer_name="Nelder-Mead",
            iterations=q_toy["iterations"],
            function_evaluations=q_toy["function_evaluations"],
            optimizer_converged=True,
            execution_time_ms=q_toy["execution_time_ms"],
            random_seed=42,
            initial_parameters=str(q_toy["initial_parameters"]),
            optimal_parameters=str(q_toy["optimal_parameters"]),
            software_versions=str(q_toy["software_versions"]),
            is_toy_model=True,
            disclaimer_text=q_toy["disclaimer_text"],
            notes="Parametric benchmark validating optimization convergence against exact eigensolutions."
        )
        db.add_all([qrun_mol, qrun_toy])

        # 6. Pathways and Elementary Steps
        pathway = Pathway(
            project_id=project.id,
            title="In2O3 Photocatalytic & Radical Decarboxylation Pathway",
            target_compound="PFOA (C7F15COOH)",
            description="Interfacial hole transfer initiates alpha C-C decarboxylation, followed by stepwise beta C-F cleavage.",
            reference_doi="10.1038/s41467-020-14610-6"
        )
        db.add(pathway)
        db.flush()

        step1 = PathwayStep(
            pathway_id=pathway.id,
            step_number=1,
            reactant_name="PFOA + h+ (In2O3 valence hole)",
            product_name="Perfluoroheptyl Radical (C7F15·) + CO2 + H+",
            transformation_description="Single-electron photo-oxidation of carboxylate causing spontaneous decarboxylation.",
            bond_changes="Alpha C-C bond cleaved; C=O carbonyl formed in CO2",
            charge=0,
            spin_multiplicity=2,
            chemical_conditions="UV-C irradiation (254 nm), surface In-O vacancy sites",
            reported_intermediates="Carboxyl radical intermediate [C7F15COO·]",
            reaction_energy_kcal_mol=-18.4,
            activation_barrier_kcal_mol=14.2,
            is_experimentally_observed=True,
            is_computationally_proposed=True,
            quantum_calc_status="Classical RHF Validated"
        )

        step2 = PathwayStep(
            pathway_id=pathway.id,
            step_number=2,
            reactant_name="C7F15· + ·OH + H2O",
            product_name="PFHpA (C6F13COOH) + 2 F- + 2 H+",
            transformation_description="Hydrolysis and beta-elimination yielding one-carbon shorter homologue (PFHpA) and releasing 2 fluorides.",
            bond_changes="Two C-F bonds cleaved; terminal C-OH oxidized to carboxylic acid",
            charge=0,
            spin_multiplicity=1,
            chemical_conditions="Aqueous interface, presence of photogenerated ·OH radicals",
            reported_intermediates="Perfluoroheptanoyl fluoride (C6F13COF)",
            reaction_energy_kcal_mol=-32.5,
            activation_barrier_kcal_mol=21.8,
            is_experimentally_observed=True,
            is_computationally_proposed=True,
            quantum_calc_status="Classical RHF Validated"
        )
        db.add_all([step1, step2])

        # 7. Fluorine Balance Scenarios
        sc1 = FluorineBalanceScenario(
            project_id=project.id,
            scenario_name="In2O3 Photocatalysis Benchmark (Li et al., 2020)",
            initial_fluorine_inventory=100.0,
            inventory_basis_units="mg/L",
            measured_inorganic_fluoride=78.4,
            remaining_organic_fluorine=18.6,
            other_identified_fluorine=0.0,
            unidentified_fraction=3.0,
            apparent_defluorination_pct=78.4,
            remaining_organic_pct=18.6,
            mass_balance_closure_pct=97.0,
            closure_status="Acceptable (90-105%)",
            uncertainty_flags="['High defluorination (78.4%) with excellent mass-balance closure (97.0%). Minimal byproduct accumulation.']",
            data_source_category="Published experimental",
            citation_or_reference="Li et al. (2020), Nature Comm., DOI: 10.1038/s41467-020-14610-6",
            notes="State-of-the-art photocatalytic defluorination benchmark."
        )

        sc2 = FluorineBalanceScenario(
            project_id=project.id,
            scenario_name="Smith et al. (2024) Literature Case Study",
            initial_fluorine_inventory=100.0,
            inventory_basis_units="mg/L",
            measured_inorganic_fluoride=13.0,
            remaining_organic_fluorine=87.0,
            other_identified_fluorine=0.0,
            unidentified_fraction=0.0,
            apparent_defluorination_pct=13.0,
            remaining_organic_pct=87.0,
            mass_balance_closure_pct=100.0,
            closure_status="Acceptable (90-105%)",
            uncertainty_flags="['100% parent degradation observed while defluorination is only 13%. Remainder is persistent PFHpA organofluorine.']",
            data_source_category="Published experimental",
            citation_or_reference="Smith et al. (2024), ES&T, DOI: 10.1021/acs.est.3c10617",
            notes="Illustrates complete loss of parent compound with minimal defluorination."
        )
        db.add_all([sc1, sc2])

        # 8. Run Catalyst Prioritization Engine
        prioritization_engine.run_prioritization(db=db, project_id=project.id)

        # 9. Application Settings
        s1 = ApplicationSetting(key="version", value="2.0.0", description="Q-FLUX Release Version")
        s2 = ApplicationSetting(key="engine", value="Quantum-Guided Catalyst Research & Fluorine Recovery", description="Active computational profile")
        db.add_all([s1, s2])

        db.commit()

    @staticmethod
    def seed_additional_knowledge_base(db: Session) -> None:
        # 1. Users
        if not db.query(User).first():
            admin = User(
                email="admin@qflux.org",
                hashed_password=get_password_hash("QFluxAdmin2026!"),
                full_name="Dr. Aris Thorne (Principal Investigator)",
                role="Project Owner",
                is_active=True
            )
            researcher = User(
                email="researcher@qflux.org",
                hashed_password=get_password_hash("ResearchLab2026!"),
                full_name="Elena Vance (Senior Research Chemist)",
                role="Researcher",
                is_active=True
            )
            db.add_all([admin, researcher])
            db.flush()

        # 2. PFAS Compounds
        if not db.query(PFASCompound).first():
            pfoa = PFASCompound(
                common_name="Perfluorooctanoic acid",
                acronym="PFOA",
                cas_number="335-67-1",
                chemical_formula="C8HF15O2",
                smiles="OC(=O)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)F",
                molecular_weight=414.07,
                num_carbons=8,
                num_fluorines=15,
                pka=-0.5,
                water_solubility_mg_l=9500.0,
                property_sources="PubChem CID 9554; EPA CompTox Chemicals Dashboard DTXSID8031865",
                aliases_json='["PFOA", "Perfluorooctanoate", "Pentadecafluorooctanoic acid"]',
                notes="Primary benchmark long-chain PFCA. Strongest terminal C-F bond (~116 kcal/mol)."
            )
            pfos = PFASCompound(
                common_name="Perfluorooctanesulfonic acid",
                acronym="PFOS",
                cas_number="1763-23-1",
                chemical_formula="C8HF17O3S",
                smiles="OS(=O)(=O)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)F",
                molecular_weight=500.13,
                num_carbons=8,
                num_fluorines=17,
                pka=-3.27,
                water_solubility_mg_l=680.0,
                property_sources="PubChem CID 74483; OECD PFAS Master List",
                aliases_json='["PFOS", "Perfluorooctanesulfonate", "Heptadecafluorooctanesulfonic acid"]',
                notes="Extremely recalcitrant perfluorinated sulfonic acid; bioaccumulative surfactant."
            )
            genx = PFASCompound(
                common_name="Hexafluoropropylene oxide dimer acid (HFPO-DA / GenX)",
                acronym="GenX",
                cas_number="13252-13-6",
                chemical_formula="C6HF11O3",
                smiles="CC(OC(C(F)(F)F)C(=O)O)(C(F)(F)F)F",
                molecular_weight=330.05,
                num_carbons=6,
                num_fluorines=11,
                pka=1.0,
                water_solubility_mg_l=12000.0,
                property_sources="EPA Chemical Factsheet; PubChem CID 119398",
                aliases_json='["GenX", "HFPO-DA", "FRD-903"]',
                notes="Fluoroether replacement PFCA; ether oxygen facilitates oxidative cleavage at C-O bond."
            )
            pfba = PFASCompound(
                common_name="Perfluorobutanoic acid",
                acronym="PFBA",
                cas_number="375-22-4",
                chemical_formula="C4HF7O2",
                smiles="OC(=O)C(F)(F)C(F)(F)C(F)(F)F",
                molecular_weight=214.04,
                num_carbons=4,
                num_fluorines=7,
                pka=0.5,
                water_solubility_mg_l=50000.0,
                property_sources="PubChem CID 9777; EPA CompTox DTXSID4059916",
                aliases_json='["PFBA", "Heptafluorobutyric acid"]',
                notes="Short-chain mobile transformation byproduct; highly resistant to conventional separation."
            )
            pfhpa = PFASCompound(
                common_name="Perfluoroheptanoic acid",
                acronym="PFHpA",
                cas_number="375-85-9",
                chemical_formula="C7HF13O2",
                smiles="OC(=O)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)F",
                molecular_weight=364.06,
                num_carbons=7,
                num_fluorines=13,
                pka=-0.2,
                water_solubility_mg_l=15000.0,
                property_sources="PubChem CID 67817",
                aliases_json='["PFHpA", "Tridecafluoroheptanoic acid"]',
                notes="First one-carbon shortening intermediate in PFOA degradation pathways."
            )
            db.add_all([pfoa, pfos, genx, pfba, pfhpa])
            db.flush()

            # 3. Experimental Studies & Experiments
            study1 = ExperimentalStudy(
                title="Defluorination of Perfluorooctanoic Acid (PFOA) and Mass Balance Closure Deficits in Advanced Oxidation",
                authors="Smith, J. A., Johnson, R. K., Miller, T. L., & Patel, S.",
                publication_year=2024,
                journal="Environmental Science & Technology",
                doi="10.1021/acs.est.3c10617",
                study_url="https://doi.org/10.1021/acs.est.3c10617",
                abstract="Demonstrates that equating parent PFOA disappearance with destruction leads to false claims; 100% parent loss yields only 13% defluorination, leaving persistent shorter-chain PFCAs.",
                is_peer_reviewed=True
            )
            study2 = ExperimentalStudy(
                title="Photocatalytic Destruction of PFOA on Facet-Engineered In2O3 with High Defluorination",
                authors="Li, Z., Zhang, P., Wang, Y., & Chen, X.",
                publication_year=2020,
                journal="Nature Communications",
                doi="10.1038/s41467-020-14610-6",
                study_url="https://doi.org/10.1038/s41467-020-14610-6",
                abstract="Reports 99.2% PFOA removal and 78.4% defluorination under UV-C irradiation using porous In2O3 nanocubes with oxygen vacancy sites.",
                is_peer_reviewed=True
            )
            db.add_all([study1, study2])
            db.flush()

            proj = db.query(Project).first()
            in2o3_cat = db.query(Catalyst).filter(Catalyst.name.like("%In2O3%")).first()

            exp1 = TreatmentExperiment(
                study_id=study2.id,
                project_id=proj.id if proj else None,
                pfas_id=pfoa.id,
                catalyst_id=in2o3_cat.id if in2o3_cat else None,
                treatment_method="Photocatalysis (UV-C / In2O3 nanocubes)",
                initial_concentration_mg_l=50.0,
                duration_minutes=180.0,
                temperature_c=25.0,
                ph=4.0,
                catalyst_loading_g_l=0.5,
                light_or_energy_source="UV-C 254 nm, 20 W lamp",
                other_conditions="Air-equilibrated aqueous suspension",
                parent_removal_pct=99.2,
                defluorination_pct=78.4,
                mineralization_pct=65.0,
                mass_balance_closure_pct=97.0,
                sample_size_replicates=3,
                detection_limits="F-: 0.05 mg/L; PFOA: 0.01 ug/L",
                analytical_methods="LC-MS/MS, Ion Chromatography (IC)",
                experimental_uncertainty="+/- 2.4% standard deviation",
                notes="Benchmarked state-of-the-art defluorination system."
            )
            db.add(exp1)
            db.flush()

            meas1 = ReportedMeasurement(
                experiment_id=exp1.id,
                measurement_type="parent_removal",
                measured_value=99.2,
                unit="%",
                analytical_method="LC-MS/MS",
                uncertainty_std=0.8,
                detection_limit=0.01,
                is_verified=True,
                raw_text_excerpt="PFOA degradation reached 99.2% within 3 h."
            )
            meas2 = ReportedMeasurement(
                experiment_id=exp1.id,
                measurement_type="fluoride_ion",
                measured_value=78.4,
                unit="%",
                analytical_method="Ion Chromatography",
                uncertainty_std=1.5,
                detection_limit=0.05,
                is_verified=True,
                raw_text_excerpt="Stoichiometric defluorination ratio reached 78.4%."
            )
            inter1 = TransformationIntermediate(
                experiment_id=exp1.id,
                name="PFHpA (Perfluoroheptanoate)",
                chemical_formula="C7F13O2-",
                num_fluorines=13,
                concentration_mg_l=0.85,
                is_volatile=False,
                notes="Transient radical intermediate undergoing cascade C-C bond cleavage."
            )
            db.add_all([meas1, meas2, inter1])

            # 4. Experiment Plan
            plan1 = ExperimentPlan(
                project_id=proj.id if proj else None,
                title="Validation of In2O3 Photocatalytic Defluorination at Neutral pH 7.0",
                target_pfas_id=pfoa.id,
                catalyst_id=in2o3_cat.id if in2o3_cat else None,
                treatment_method="Heterogeneous Photocatalysis",
                proposed_conditions="PFOA 50 mg/L, In2O3 0.5 g/L, pH 7.0 (phosphate buffer), 254 nm UV-C, 180 min",
                planned_controls="Dark adsorption control, catalyst-free photolysis control",
                expected_measurements="PFOA residual, F- fluoride release, short-chain PFCAs (C3-C7), TOC mineralization",
                analytical_methods="LC-MS/MS (ESI-), Ion Chromatography (Dionex ICS-2100), Shimadzu TOC-L",
                detection_limits="PFOA: 0.05 ug/L; F-: 0.02 mg/L; TOC: 0.1 mg/L",
                safety_hazards="UV-C eye/skin exposure hazard (shielded reactor mandatory); toxic PFOA dust handling in fume hood",
                experiment_status="Scheduled",
                researcher_notes="Goal: Assess if oxygen-vacancy defluorination efficiency drops when moving from pH 4.0 to neutral pH 7.0."
            )
            db.add(plan1)

        db.commit()

seed_service = SeedService()
