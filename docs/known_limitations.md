# Known Limitations & Next Research Steps — Q-FLUX 2.0 (Phase B)

## 1. Scientific Claims Q-FLUX Can Legitimately Make
1. **Algorithmic Validation:** Q-FLUX demonstrates a working hybrid Variational Quantum Eigensolver (VQE) optimization loop on a 2-qubit toy Hamiltonian and a molecule-derived reduced C-F active space model, confirming convergence within tight numerical tolerance ($|E_{vqe} - E_{exact}| < 10^{-4}\text{ a.u.}$) compared to classical exact diagonalization on the same matrix.
2. **Analytical Classical Ab-Initio Validation:** Q-FLUX implements an authentic, self-contained analytical Ab-Initio Roothaan-Hall SCF solver for s-basis molecular systems ($H_2$, $HeH^+$) using exact Gaussian integrals (overlap $S$, kinetic $T$, nuclear attraction $V$ via Boys function $F_0$, and 4-center electron repulsion $(ij|kl)$ with 8-fold symmetry), verified against published literature standards (Szabo & Ostlund Table 3.3 and 3.5) within $10^{-4}\text{ a.u.}$
3. **Epistemological Method Differentiation:** Q-FLUX explicitly distinguishes exact ab-initio calculations, semi-empirical approximate models (parameterized Wolfsberg-Helmholtz screening for polyatomic fluorinated fragments), literature-reported measurements, and hypothetical screening candidates. No approximate solver is falsely labeled as ab initio.
4. **Fluorine Accounting Rigor:** Q-FLUX correctly distinguishes parent-compound degradation, defluorination, and mineralization, enforcing mathematical mass-balance closure and flagging analytical deficits or surpluses outside 90–105%. Missing analytical measurements are treated as missing, never silently substituted as zero.
5. **Evidence-Aware Integrity:** Every literature datapoint is tagged with source provenance, original units, and verification status, preventing hypothetical in-silico proposals from being confused with peer-reviewed laboratory measurements.

---

## 2. Claims Q-FLUX CANNOT Legitimately Make
1. **No Full PFAS Ab-Initio Electronic Structure in Native Mode:** Without PySCF or an external quantum chemistry package, the native Python solver for polyatomic fragments ($CF_3COO^-$, $CH_3F$) uses a semi-empirical frontier approximation. It does not calculate full 4-index Cartesian Gaussian electron repulsion integrals over directional p-orbitals.
2. **No Kinetic Activation Barrier Prediction:** Thermodynamic reaction electronic energy changes ($\Delta E_{rxn} = \sum E_{prod} - \sum E_{react}$) do NOT provide activation barriers ($E_a$) or rate constants ($k$). Transition-state saddle-point searches (e.g. QST2, NEB) and vibrational Hessian frequency calculations are not implemented. An exothermic reaction ($\Delta E < 0$) does NOT prove that a degradation pathway is kinetically feasible.
3. **No Catalyst or Destruction Discovery:** Q-FLUX has not designed or experimentally verified a catalyst capable of destroying PFAS. All candidate performance numbers are extracted from external peer-reviewed publications.
4. **No Commercial Treatment Certification:** Achieving a satisfactory mass balance closure in a simulated or bench-scale batch reactor does not imply commercial or industrial wastewater readiness.
5. **No Quantum Advantage:** The 2-qubit statevector simulation demonstrates algorithmic mechanics on classical hardware. It does not claim supremacy or speedup over classical quantum chemistry packages.

---

## 3. Technical Limitations in the Current Implementation
* **Simulation Mode:** VQE operates on an exact statevector simulator; noisy intermediate-scale quantum (NISQ) shot-noise and quantum hardware backend execution (e.g., IBM Quantum / Rigetti via Qiskit Runtime) are not yet integrated into the local offline workflow.
* **Single-User Local SQLite Database:** SQLite is intended for local developer prototyping, not multi-tenant concurrent enterprise deployments.
* **Solvent Shells:** Gas-phase fragment calculations do not include explicit solvent water dielectric polarization or electrode double-layer electric fields.

---

## 4. Roadmap & Next Technical Steps
1. **High-Angular-Momentum Analytical Gaussian Integrals:** Expand the native analytical integral engine to support Cartesian p- and d-orbitals for all first-row elements without external dependencies.
2. **Analytical Hessian & Vibrational Frequencies:** Implement second-derivative nuclear gradients to compute harmonic zero-point vibrational energies (ZPVE) and thermal free energies ($\Delta G^\circ_{298}$).
3. **Transition-State Saddle-Point Optimization:** Implement nudged elastic band (NEB) or eigenvector-following algorithms for genuine transition-state barrier calculations.
4. **Non-Targeted Organofluorine Data Integration:** Expand mass-balance schema to support high-resolution combustion ion chromatography (CIC) and total organic fluorine (TOF) instrument imports.
