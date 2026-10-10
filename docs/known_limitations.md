# Known Limitations & Next Research Steps

## 1. Scientific Claims Q-FLUX Can Legitimately Make
1. **Algorithmic Validation:** Q-FLUX demonstrates a working hybrid Variational Quantum Eigensolver (VQE) optimization loop on a 2-qubit toy Hamiltonian, confirming convergence within tight numerical tolerance ($|E_{vqe} - E_{exact}| < 10^{-4}\text{ a.u.}$) compared to classical exact diagonalization on the same matrix.
2. **Fluorine Accounting Rigor:** Q-FLUX correctly distinguishes parent-compound degradation, defluorination, and mineralization, enforcing mathematical mass-balance closure and flagging analytical deficits or surpluses outside 90–105%.
3. **Evidence-Aware Integrity:** Every literature datapoint is tagged with source provenance, original units, and verification status, preventing hypothetical baselines from being confused with peer-reviewed laboratory measurements.

---

## 2. Claims Q-FLUX CANNOT Legitimately Make
1. **No PFAS Electronic Structure Prediction:** The toy Hamiltonian is not an ab-initio molecular Hamiltonian of PFOA or any fluorosurfactant. It does not calculate molecular bond energies, reaction barriers, or electronic states.
2. **No Catalyst or Destruction Discovery:** Q-FLUX has not designed or experimentally verified a catalyst capable of destroying PFAS.
3. **No Commercial Treatment Certification:** Achieving a satisfactory mass balance closure in a simulated or bench-scale batch reactor does not imply commercial or industrial wastewater readiness.
4. **No Quantum Advantage:** The 2-qubit statevector simulation demonstrates algorithmic mechanics on classical hardware. It does not claim supremacy or speedup over classical quantum chemistry packages.

---

## 3. Technical Limitations in the Current Prototype
* **Simulation Mode:** VQE operates on an exact statevector simulator; noisy intermediate-scale quantum (NISQ) shot-noise and quantum hardware backend execution (e.g., IBM Quantum / Rigetti via Qiskit Runtime) are not yet integrated into the local offline workflow.
* **Single-User Local SQLite Database:** SQLite is intended for local developer prototyping, not multi-tenant concurrent enterprise deployments.
* **Rule Engine Scope:** The decision support engine uses deterministic heuristic rules rather than dynamic reaction-pathway kinetic modeling.

---

## 4. Roadmap & Next Technical Steps
1. **Ab-Initio Electronic Structure Integration:** Connect an active-space quantum chemistry driver (PySCF / Qiskit Nature) to generate molecular Hamiltonians for selected single-electron transfer (SET) decarboxylation steps of PFOA.
2. **Non-Targeted Organofluorine Data Integration:** Expand mass-balance schema to support high-resolution combustion ion chromatography (CIC) and total organic fluorine (TOF) instrument imports.
3. **Multi-Step Kinetic Modeling:** Implement differential equation solvers for sequential $C_8 \rightarrow C_7 \rightarrow C_6 \dots \rightarrow CO_2 + F^-$ reaction networks.
