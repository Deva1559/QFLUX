# Scientific Methodology & Computational Chemistry Governance — Q-FLUX 2.0 (Phase B)

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

## 2. Classical Electronic Structure Engines & Methodological Integrity

To prevent overstated computational claims, Q-FLUX 2.0 clearly distinguishes its underlying calculation methods:

### 2.1 Native Ab-Initio Roothaan-Hall SCF Driver
For s-basis molecular systems ($H_2$, $HeH^+$), Q-FLUX 2.0 implements an exact, closed-form analytical Gaussian integral Roothaan-Hall solver:
- Contracted STO-3G basis functions: $\phi_\mu(\mathbf{r}) = \sum_p d_{p\mu} g_p(\mathbf{r})$
- Analytical overlap integrals $S_{\mu\nu}$ and kinetic integrals $T_{\mu\nu}$.
- Analytical electron-nuclear attraction $V_{\mu\nu}$ via the zeroth-order Boys function $F_0(t) = \frac{1}{2}\sqrt{\pi/t}\text{erf}(\sqrt{t})$.
- Analytical 4-center two-electron repulsion tensor $(\mu\nu|\lambda\sigma)$ with 8-fold index permutation symmetry.
- Validated against Szabo & Ostlund Table 3.3 for $H_2$ ($R = 1.400\text{ Bohr}$):
  $$E_{tot} = -1.116714\text{ a.u. (error } < 10^{-4}\text{ a.u.)},\quad E_{nuc} = 0.714286\text{ a.u.},\quad E_{elec} = -1.8310\text{ a.u.}$$

### 2.2 Semi-Empirical Frontier Model (Polyatomic Fragments)
When full ab initio Cartesian Gaussian packages (such as PySCF) are not available, multi-atom fluorinated fragments ($CF_3COO^-$, $CH_3F$) are solved via an explicitly labeled Semi-Empirical Frontier Model:
- Uses core binding energies and parameterized Wolfsberg-Helmholtz resonance integrals.
- Uses distance-screened Coulomb interaction $G(P)$ for density-matrix iteration.
- Explicitly labeled in output metadata as `SEMI_EMPIRICAL_APPROXIMATE` to prevent confusing it with full-integral ab initio calculations.

---

## 3. Reaction Energetics: $\Delta E$ vs Activation Barrier $E_a$

Reaction electronic energies are computed strictly as:
$$\Delta E_{rxn} = \sum E_{products} - \sum E_{reactants}$$

**Mandatory Scientific Governance Rules:**
1. **No Inference of Activation Energy:** A negative reaction energy ($\Delta E < 0$, exothermic) indicates thermodynamic favorability of products relative to reactants under vacuum, but provides **zero information** on kinetic activation barriers ($E_a$) or reaction rates ($k$).
2. **Missing Fragment Unavailability:** If electronic energies for any reactant or product fragment are uncomputed or missing, reaction energy is returned as `UNAVAILABLE` rather than fabricating values.
3. **Stoichiometric and Charge Balance:** Elemental and charge balancing are strictly verified before calculating $\Delta E$.
4. **No Placeholder Transition States:** Transition-state searches and Gibbs free energies ($\Delta G$) are reported as `NOT_AVAILABLE` because second-derivative analytical Hessians and saddle-point searches are not implemented.
