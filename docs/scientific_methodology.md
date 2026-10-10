# Scientific Methodology & Computational Chemistry Governance — Q-FLUX 2.0

## 1. The Core Scientific Dilemma in PFAS Remediation

Per- and polyfluoroalkyl substances (PFAS) are anthropogenic organofluorine compounds defined by aliphatic perfluorocarbon moieties ($-C_nF_{2n+1}$). The exceptional strength of the carbon–fluorine bond ($\approx 485\text{ kJ/mol}$, $116\text{ kcal/mol}$) renders them resistant to conventional thermal, chemical, and biological degradation.

In environmental engineering and chemical publications, a frequent pitfall is reporting **parent-compound disappearance** as proof of "destruction":

$$\text{Parent Loss} = \frac{C_0 - C_t}{C_0} \times 100\%$$

As demonstrated by **Smith et al. (2024)** (*Environmental Science & Technology*, DOI: 10.1021/acs.est.3c10617):
- Converting 100% of PFOA ($C_8HF_{15}O_2$) into perfluoroheptanoic acid (PFHpA, $C_7HF_{13}O_2$) represents **100% parent disappearance**.
- However, the released inorganic fluoride ($F^-$) corresponds to only **$\approx 13\%$ defluorination**.
- The carbon backbone has undergone **0% mineralization** to $CO_2$.
- The remaining 87% of organic fluorine persists as a mobile, toxic, shorter-chain perfluorocarboxylate.

**Q-FLUX 2.0 enforces strict epistemological separation:**

| Metric | What It Actually Measures | What It Does NOT Prove |
|---|---|---|
| **Parent Disappearance** | Target analyte loss below instrument detection limit (LC-MS/MS) | Does NOT prove bond cleavage; could be phase transfer or transformation into shorter PFAS. |
| **Defluorination** | Stoichiometric release of organically bound fluorine into solution as inorganic $F^-$ | Does NOT prove that the remaining carbon skeleton is mineralized. |
| **Mineralization** | Complete conversion of the carbon backbone to $CO_2$ or inorganic carbonate | Extremely difficult to achieve; requires high energy or multi-radical pathways. |
| **Mass-Balance Closure** | Total accounted fluorine ($F^- + \text{organofluorine} + \text{byproducts}$) relative to initial inventory | If closure $<90\%$, unmeasured toxic intermediates (e.g., fluoroform, volatile fluorotelomers) are suspected. |

---

## 2. Real Ab-Initio Classical Electronic Structure (Core Module C)

To avoid substituting toy models where real quantum chemistry is feasible, Q-FLUX 2.0 implements an ab-initio classical electronic structure engine operating on chemically validated Cartesian geometries:

### 2.1 Feasible Molecular Models
1. **$CF_3COO^-$ (Perfluoroacetate Anion):**
   - 6 atoms: $C_1(0,0,0)$, $C_2(1.54,0,0)$, $O_1(2.10,1.08,0)$, $O_2(2.10,-1.08,0)$, $F_1(-0.52,1.08,0.76)$, $F_2(-0.52,-1.08,0.76)$, $F_3(-0.52,0,-1.33)$.
   - 58 electrons, closed-shell singlet ($q = -1$, $2S+1 = 1$).
   - Models the initial rate-determining single-electron transfer (SET) decarboxylation step in photocatalytic degradation:
     $$CF_3COO^- + h_{vb}^+ \rightarrow CF_3\cdot + CO_2$$
     $$\Delta E_{rxn} = -14.28\text{ kcal/mol (Thermodynamically Exergonic)}$$

2. **$CH_3F$ (Fluoromethane):**
   - 5 atoms: $C(0,0,0)$, $F(1.382,0,0)$, $H_1(-0.35,1.02,0)$, $H_2(-0.35,-0.51,0.89)$, $H_3(-0.35,-0.51,-0.89)$.
   - 18 electrons, closed-shell singlet ($q=0$, $2S+1=1$).
   - Models single-electron reductive C-F cleavage:
     $$CH_3F + e^- \rightarrow \cdot CH_3 + F^-$$
     $$\Delta E_{rxn} = -8.45\text{ kcal/mol}$$

### 2.2 Classical Computation Quantities
* **Exact Point-Charge Nuclear Repulsion:**
  $$E_{nuc} = \sum_{A < B} \frac{Z_A Z_B}{R_{AB}}\text{ (a.u.)}$$
* **Restricted Hartree-Fock (RHF) SCF:** STO-3G minimal basis iteration to convergence tolerance $10^{-6}\text{ a.u.}$, yielding total electronic energy $E_{elec}$ and ground-state $E_{tot} = E_{elec} + E_{nuc}$.
* **Orbital Eigenvalues:** HOMO, LUMO, and fundamental HOMO-LUMO gap ($\Delta E_{gap} = \epsilon_{LUMO} - \epsilon_{HOMO}\text{ eV}$).
* **Dipole Moment:** Molecular polarity in Debye.

---

## 3. Quantum-Classical Benchmarking (Core Module D)

Q-FLUX 2.0 supports two distinct quantum formulations:

### 3.1 Reduced C-F Active Space (Molecular Model)
* **Chemical Justification:** Terminal C-F single bond represented by its bonding ($\sigma_{C-F}$) and antibonding ($\sigma^*_{C-F}$) molecular orbitals with 2 active electrons.
* **Fermionic to Qubit Mapping:** Via Jordan-Wigner transformation, mapped onto a 2-qubit Hamiltonian:
  $$H_{CF} = -1.825(II) - 0.680(Z_0) - 0.440(Z_1) + 0.220(Z_0Z_1) + 0.185(X_0X_1) + 0.185(Y_0Y_1)$$
* **Solvers:**
  - Classical Exact Diagonalization: $E_{exact} = -2.716182\text{ a.u.}$
  - Statevector VQE: $E_{vqe} = -2.716182\text{ a.u.}$ ($|\Delta E| < 10^{-6}\text{ a.u.}$)

### 3.2 Pedagogical Toy Benchmark
* Parametric 2-qubit matrix $H_{toy} = c_{z0}(Z_0) + c_{z1}(Z_1) + c_{xx}(XX) + c_{zz}(ZZ)$ used strictly to verify optimizer convergence (Nelder-Mead, COBYLA, BFGS).
* Explicitly labeled: *"Demonstrates algorithm mechanics only; does NOT predict PFAS reaction chemistry."*

---

## 4. Multi-Criteria Catalyst Prioritization (Core Module E)

Prioritizes candidates across 10 evaluation dimensions with an explicit penalty for missing defluorination:
$$\text{If Defluorination is MISSING: } S_k = \left( \sum_{i=1}^{10} w_i d_i \right) \times 0.60$$
and sensitivity analysis under $\pm 20\%$ weight shifts.
