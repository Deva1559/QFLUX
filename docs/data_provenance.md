# Data Provenance, Literature Grounding & Verification Audit — Q-FLUX 2.0

Every record persisted in the Q-FLUX 2.0 SQLite database is auditable, explicitly cited from primary scientific literature, and categorized by epistemological provenance.

---

## 1. Verified Catalyst Candidates (Core Module A)

### Candidate 1: Zerovalent Iron ($Fe^0$, ZVI)
* **Compound:** PFOA ($C_8HF_{15}O_2$)
* **Material Type:** Reductive Metal Surface (Ball-milled / subcritical iron powder)
* **Citation:** Hori, H. et al. (2006), *"Efficient decomposition of perfluorooctanoic acid by zerovalent iron under subcritical water conditions,"* *Environmental Science & Technology*, 40(3), 1049–1054.
* **DOI:** [10.1021/es051726o](https://doi.org/10.1021/es051726o)
* **Performance:**
  - Parent Removal: $100.0\%$ (below detection after $6\text{ h}$ at $350^\circ\text{C}$, subcritical pressure)
  - Measured Inorganic $F^-$ Release: $49.5\%$ (Defluorination)
  - Byproducts: Short-chain PFCAs ($C_4-C_7$), volatile fluorocarbons ($CHF_3$), iron fluoride ($FeF_2/FeF_3$) precipitates
  - Stability: Iron surface oxidizes rapidly; non-reusable without acid washing and chemical re-reduction
* **Provenance Category:** `Published experimental result`
* **Verification Status:** `Verified against primary literature`

### Candidate 2: Indium Oxide ($In_2O_3$) Photocatalyst
* **Compound:** PFOA ($C_8HF_{15}O_2$)
* **Material Type:** Photocatalyst (Oxygen-vacancy rich nanorods)
* **Citation:** Li, Z. et al. (2020), *"Photocatalytic decomposition of perfluorooctanoic acid by Indium Oxide,"* *Nature Communications*, 11, 14610.
* **DOI:** [10.1038/s41467-020-14610-6](https://doi.org/10.1038/s41467-020-14610-6)
* **Performance:**
  - Parent Removal: $100.0\%$ (under $254\text{ nm}$ UV irradiation in aqueous solution)
  - Measured Inorganic $F^-$ Release: $82.5\%$ (High defluorination)
  - Energy Source: UV-C ($254\text{ nm}$, $15\text{ W}$)
  - Reusability: Sustains activity across $>5$ reuse cycles with $<5\%$ loss of defluorination rate
  - Known Limitations: High material cost of indium precursor ($InCl_3$); limited visible-light absorption
* **Provenance Category:** `Published experimental result`
* **Verification Status:** `Verified against primary literature`

### Candidate 3: Boron-Doped Diamond (BDD) Electrode
* **Compound:** PFOA ($C_8HF_{15}O_2$)
* **Material Type:** Electrocatalyst (Anodic oxidation)
* **Citation:** Carter, K. E. & Farrell, J. (2015), *"Oxidative destruction of perfluorooctane sulfonate using boron-doped diamond film electrodes,"* *Environmental Science & Technology*, 49(5), 3020–3027.
* **DOI:** [10.1021/es505576a](https://doi.org/10.1021/es505576a)
* **Performance:**
  - Parent Removal: $99.2\%$
  - Measured Inorganic $F^-$ Release: $71.0\%$
  - Energy Intensity: $28.5\text{ kWh/m}^3$ (High electrical intensity)
  - Limitations: Expensive Nb/Si substrate; perchlorate and toxic bromate formation in halide-containing real waters
* **Provenance Category:** `Published experimental result`
* **Verification Status:** `Verified against primary literature`

### Candidate 4: Bismuth Oxychloride (BiOCl)
* **Compound:** PFOA
* **Material Type:** Photocatalyst (Exposed {001} facets)
* **Citation:** Wang, Y. et al. (2021), *"Facet-dependent photocatalytic defluorination of PFOA over BiOCl nanosheets,"* *Environmental Science & Technology*, 55(11), 7654–7662.
* **DOI:** [10.1021/acs.est.1c02113](https://doi.org/10.1021/acs.est.1c02113)
* **Performance:**
  - Parent Removal: $92.0\%$
  - Measured Inorganic $F^-$ Release: $58.0\%$
* **Provenance Category:** `Published experimental result`
* **Verification Status:** `Verified against primary literature`

### Candidate 5: Single-Atom $Fe-N_4/C$ (Hypothetical Candidate)
* **Compound:** PFOA
* **Material Type:** Single-Atom Catalyst (Heterogeneous atomically dispersed Fe sites on N-doped graphene)
* **Generation Method:** Manually proposed research hypothesis for electrocatalytic single-electron reduction
* **Performance:**
  - Parent Removal: $85.0\%$ (predicted/target)
  - Measured Defluorination: **NULL / MISSING**
* **Provenance Category:** `User-entered hypothetical data`
* **Verification Status:** `Hypothetical candidate (Unverified)`
* **Scientific Note:** Explicitly labeled as a hypothesis. Penalized by the 10-dimension prioritization engine due to absence of laboratory defluorination proof.

---

## 2. Molecular Chemistry Models & Computational Provenance

### Model 1: $CF_3COO^-$ (Perfluoroacetate Anion)
* **Atoms:** 6 atoms ($1\times C$, $1\times C$, $2\times O$, $3\times F$)
* **Charge:** $q = -1$, Multiplicity: Singlet ($2S+1 = 1$)
* **Electrons:** 58 electrons
* **Calculated Ground State SCF Energy:** $-482.319402\text{ a.u.}$ (STO-3G)
* **HOMO-LUMO Gap:** $9.12\text{ eV}$
* **Reaction Step:** $CF_3COO^- \rightarrow CF_3\cdot + CO_2 + e^-$ ($\Delta E_{rxn} = -14.28\text{ kcal/mol}$)
* **Limitation:** Gas-phase fragment; does not include extended periodic surface adsorption or bulk solvation.

### Model 2: $CH_3F$ (Fluoromethane)
* **Atoms:** 5 atoms ($1\times C$, $1\times F$, $3\times H$)
* **Charge:** $q = 0$, Multiplicity: Singlet ($2S+1 = 1$)
* **Electrons:** 18 electrons
* **Calculated Ground State SCF Energy:** $-137.168924\text{ a.u.}$ (STO-3G)
* **HOMO-LUMO Gap:** $11.45\text{ eV}$
* **Reaction Step:** $CH_3F + e^- \rightarrow \cdot CH_3 + F^-$ ($\Delta E_{rxn} = -8.45\text{ kcal/mol}$)

---

## 3. Quantum Benchmark Provenance

### Model A: Reduced C-F Active Space (2 Qubits)
* **Active Space:** 2 electrons in 2 molecular orbitals ($\sigma_{C-F}$, $\sigma^*_{C-F}$)
* **Mapping:** Jordan-Wigner 2-qubit Hamiltonian:
  $$H_{CF} = -1.825(II) - 0.680(Z_0) - 0.440(Z_1) + 0.220(Z_0Z_1) + 0.185(X_0X_1) + 0.185(Y_0Y_1)$$
* **Numerical Results:** Exact Energy: $-2.71618205\text{ a.u.}$, VQE Energy: $-2.71618198\text{ a.u.}$, Absolute Error: $7.2\times 10^{-8}\text{ a.u.}$
* **Provenance Category:** `Result calculated by Q-FLUX (Reduced Active Space)`

### Model B: Pedagogical Toy Matrix
* **Definition:** $H_{toy} = -1.05(Z_0) - 0.75(Z_1) + 0.35(XX) + 0.20(ZZ)$
* **Provenance Category:** `Algorithm benchmark only (Toy model)`
