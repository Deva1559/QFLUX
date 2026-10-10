# Scientific Limitations, Model Scope & Next Research Steps — Q-FLUX 2.0

## 1. What Q-FLUX 2.0 Legitimately Demonstrates

1. **Evidence-Backed Catalyst Screening:** Distinguishes parent-compound removal, chemical transformation, defluorination ($F^-$ release), and complete mineralization across 5 diverse catalyst paradigms ($Fe^0$, $In_2O_3$, $BDD$, $BiOCl$, and $Fe-N_4/C$) grounded in peer-reviewed primary literature.
2. **Transparent Multi-Criteria Prioritization:** Executes a 10-dimension deterministic decision engine with explicit weighting, a mandatory penalty for missing defluorination, and automated $\pm 20\%$ weight-shift sensitivity analysis.
3. **Ab-Initio Classical Electronic Structure:** Evaluates Cartesian XYZ geometries, nuclear point-charge repulsion ($E_{nuc}$), RHF/STO-3G SCF ground-state electronic energy ($E_{elec}$), HOMO-LUMO gap, dipole moments, and reaction energetics ($\Delta E_{rxn}$) for realistic PFAS molecular fragments ($CF_3COO^-$, $CH_3F$).
4. **Jordan-Wigner Mapped Quantum Active Space:** Formulates a 2-electron, 2-orbital C-F bond active-space Hamiltonian mapped to 2 qubits via Jordan-Wigner transformation, demonstrating statevector VQE convergence against classical exact diagonalization with numerical agreement ($|\Delta E| < 10^{-4}\text{ a.u.}$).
5. **Rigorous Fluorine Mass-Balance Accounting:** Mathematically enforces closure checks ($90\%\le \text{Closure} \le 105\%$), flagging missing fractions, apparent defluorination $>100\%$, and organofluorine deficits.
6. **Downloadable Cryptographically Provenanced PDF Reports:** Generates publication-grade scientific dossiers compiled via ReportLab Platypus directly from SQLite research data.

---

## 2. Explicit Scientific Limitations: What Cannot Be Claimed

To preserve research integrity, researchers and presentation teams must strictly adhere to the following negative claims:

### 2.1 Molecular Model & Surface Effects
* **Cluster vs Periodic Surface:** The classical electronic-structure calculations are performed on isolated, gas-phase molecular models ($CF_3COO^-$ decarboxylation and $CH_3F$ C-F cleavage). They **do not** model periodic catalyst crystal surfaces (e.g. $In_2O_3(111)$ or $\alpha-Fe(110)$), adsorption energies, surface defect states, or electric double-layer polarization.
* **Solvation & Electrolytes:** Calculations do not incorporate explicit water hydration shells or Poisson-Boltzmann continuum solvation (PCM). Solution-phase free energies ($\Delta G_{aq}^\circ$) will differ from gas-phase $\Delta E_{rxn}$.
* **Kinetics vs Thermodynamics:** A favorable reaction energy ($\Delta E_{rxn} < 0$) indicates thermodynamic favorability under the chosen convention, but does **not** prove that the reaction occurs rapidly at ambient conditions. Transition-state barriers ($E_a$) require validated nudged elastic band (NEB) searches.

### 2.2 Quantum Relevance & Hardware Scope
* **No Quantum Advantage:** The 2-qubit Jordan-Wigner mapped Hamiltonian is solved on classical statevector simulators. Classical exact diagonalization computes the ground state instantaneously ($<1\text{ ms}$). VQE demonstrates algorithmic convergence and circuit ansatz validity, **not** quantum computational advantage.
* **Toy Benchmark Distinction:** When running the pedagogical toy model, it serves solely to test optimizer loops and must never be labeled as predicting PFAS chemistry.

### 2.3 Catalyst Prioritization & Commercial Viability
* **No Autonomous Discovery:** Q-FLUX 2.0 prioritizes existing and manually proposed hypotheses. It does not claim autonomous AI discovery of commercial catalysts.
* **Bench-Scale vs Pilot Scale:** High rankings reflect favorable laboratory evidence under defined experimental conditions. They do not predict continuous-flow industrial wastewater durability, resistance to organic matter fouling, or economic feasibility.

---

## 3. Recommended Next Physical Experiments for Laboratory Researchers

Based on Q-FLUX 2.0 screening and fluorine mass balance deficits:

1. **Quantitative Defluorination on Zerovalent Iron ($Fe^0$):**
   * *Urgency:* Critical.
   * *Experiment:* Re-evaluate subcritical and ball-milled $Fe^0$ systems using ion chromatography (IC) to measure inorganic $F^-$ alongside parent PFOA removal, determining whether parent disappearance is driven by surface iron oxyhydroxide adsorption.
2. **Identification of Missing Organofluorine Intermediates in Photocatalytic $In_2O_3$:**
   * *Urgency:* High.
   * *Experiment:* Run $^{19}\text{F}\text{-NMR}$ and non-target high-resolution LC-QToF-MS on $In_2O_3$ reaction effluent to account for the $17.5\%$ unrecovered fluorine inventory identified in the Smith et al. benchmark scenario.
3. **Synthesis & Leaching Validation of Single-Atom $Fe-N_4/C$:**
   * *Urgency:* Exploratory / Hypothesis testing.
   * *Experiment:* Synthesize $Fe-N_4/C$ electrocatalysts, quantify active site density via CO-stripping, and verify whether reductive defluorination occurs without homogeneous Fenton-type iron leaching into the aqueous phase.
