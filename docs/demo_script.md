# Q-FLUX 2.0 Hackathon Live Demonstration Script (2 Minutes)

**Theme:** Quantum in Biotechnology & Chemistry  
**Product:** Q-FLUX 2.0 — Quantum-Guided Catalyst Research, Reaction Pathway Analysis, and Fluorine Recovery  
**Target Duration:** 120 Seconds Live Walkthrough  

---

### [0:00 - 0:25] The Research Problem & Catalyst Catalogue (Catalysts Screen)
1. **Show:** Tap **"Catalysts"** tab.
2. **Narration:**
   > *"Judges, in PFAS catalyst research, over 60% of publications make a fatal mistake: claiming 100% destruction based solely on parent-compound removal. Here in our Evidence-Backed Catalyst Catalogue, look at Zerovalent Iron (ZVI): Parent removal is 100%, but measured defluorination is only 49.5%, leaving half the fluorine intact. Conversely, In2O3 achieves 82.5% fluoride release under UV. Q-FLUX 2.0 exposes the gap between removal and true defluorination."*
3. **Action:** Expand the $Fe^0$ card to show the automatic **"Missing Defluorination Warning"** and source citation (Hori et al., 2006).

---

### [0:25 - 0:45] Cross-System Comparison & 10-Dimension Prioritization (Compare & Prioritization Screens)
1. **Switch Tab:** Tap **"Comparison"** tab.
2. **Show:** Side-by-side comparison matrix of $In_2O_3$ photocatalyst vs $Fe^0$ reductive metal vs $BDD$ electrocatalyst.
3. **Switch Tab:** Tap **"Prioritization"** tab.
4. **Action:** Tap **"⚡ Recalculate Rankings & Sensitivity Analysis"**.
5. **Narration:**
   > *"Our 10-dimension multi-criteria decision engine penalizes candidates that lack verified fluoride release. Notice In2O3 ranks #1 with a score of 81.3, while Fe-N4/C is penalized by 40% because its defluorination is unverified. Our automated sensitivity analysis shows this ranking is stable across ±20% weight shifts."*

---

### [0:45 - 1:10] Real Ab-Initio Electronic Structure (Molecular SCF Screen)
1. **Switch Tab:** Tap **"Molecular SCF"** tab.
2. **Show:** Cartesian XYZ coordinates of $CF_3COO^-$ (6 atoms, 58 electrons, charge -1).
3. **Action:** Tap **"⚡ Compute Ab-Initio RHF Energy & Reaction ΔE"**.
4. **Show Results:** Nuclear repulsion ($+188.75\text{ a.u.}$), Total SCF Energy ($-482.32\text{ a.u.}$), HOMO-LUMO gap ($9.12\text{ eV}$), and reaction energy ($\Delta E_{rxn} = -14.28\text{ kcal/mol}$).
5. **Narration:**
   > *"Unlike generic dashboards, Q-FLUX computes real ab-initio Restricted Hartree-Fock electronic structure for PFAS fragments. Here, for the PFOA decarboxylation intermediate, it calculates an exergonic reaction energy of -14.28 kcal/mol, while transparently disclosing that this gas-phase model does not include extended catalyst surface adsorption."*

---

### [1:10 - 1:35] Quantum Algorithm Active-Space Workbench (Quantum VQE Screen)
1. **Switch Tab:** Tap **"Quantum VQE"** tab.
2. **Show:** Selector showing **"Reduced C-F Bond (Molecular)"** (2-qubit Jordan-Wigner mapped Hamiltonian).
3. **Action:** Tap **"⚡ Execute VQE vs Exact Benchmark"**.
4. **Show Results:** Exact energy ($-2.716182\text{ a.u.}$), VQE energy, and absolute error ($<10^{-6}\text{ a.u.}$).
5. **Narration:**
   > *"In our Quantum Workbench, we map the 2-electron, 2-orbital C-F bond active space to 2 qubits via Jordan-Wigner transformation. We solve the ground state with a hardware-efficient VQE ansatz and compare against classical exact diagonalization with sub-microhartree agreement. We don't claim quantum advantage on 2 qubits—we provide a verified, scalable hybrid quantum pipeline."*

---

### [1:35 - 2:00] Fluorine Accounting & One-Click PDF Dossier (Fluorine & Reports Screens)
1. **Switch Tab:** Tap **"Fluorine Balance"** tab. Show Smith et al. (2024) benchmark and deficit detection.
2. **Switch Tab:** Tap **"Reports"** tab.
3. **Action:** Tap **"📄 Compile & Generate PDF Dossier"**.
4. **Show:** PDF created via ReportLab Platypus. Open download link.
5. **Conclusion:**
   > *"With one tap, Q-FLUX compiles an audit-grade scientific PDF dossier containing catalyst specifications, ab-initio electronic structure, quantum convergence benchmarks, and mass-balance accounting. Q-FLUX turns PFAS research from wishful thinking into rigorous, verifiable computational science. Thank you!"*
