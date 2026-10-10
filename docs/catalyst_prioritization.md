# Catalyst Prioritization Engine & Multi-Criteria Decision Framework

## 1. Overview & Objective

The **Q-FLUX 2.0 Catalyst Prioritization Engine** addresses a fundamental flaw in PFAS remediation literature: equating *parent-compound disappearance* with *destructive mineralization*. In many published studies, high parent removal (e.g. >95%) is driven by surface adsorption, partitioning, or partial defluorination to persistent shorter-chain perfluoroalkyl acids (PFCAs), rather than complete breakdown.

The engine implements a **deterministic, transparent multi-criteria decision analysis (MCDA)** across 10 evaluation dimensions, paired with automated sensitivity analysis and strict evidence penalties.

---

## 2. The 10 Evaluation Dimensions

Each candidate $k$ is evaluated across 10 normalized dimensions $d_i \in [0.0, 1.0]$:

| # | Dimension | Weight Default ($w_i$) | Evaluation Method & Scientific Rationale |
|---|---|---|---|
| 1 | **Defluorination ($F^-$ Release)** | 0.25 | Quantitative inorganic fluoride recovery relative to total fluorine inventory. Candidates lacking measured defluorination receive an automatic penalty flag. |
| 2 | **Parent-PFAS Transformation** | 0.10 | Removal of parent PFAS compound (e.g. PFOA, PFOS) from solution. |
| 3 | **Byproduct Characterization** | 0.15 | Rigorous chromatographic identification (HRMS/LC-MS) of intermediate PFCAs, fluorotelomers, or toxic volatiles. Incomplete byproduct analysis is penalized. |
| 4 | **Reaction Mechanism Evidence** | 0.15 | Level of mechanistic support (radical quenching, EPR spectroscopy, isotope labeling, surface intermediate trapping). |
| 5 | **Catalyst Stability & Reusability** | 0.10 | Sustained activity over multiple reuse cycles without surface passivation, iron dissolution, or active site poisoning. |
| 6 | **Energy Efficiency & Operating Intensity** | 0.10 | Electrical or thermal energy consumption per unit mass degraded ($kWh/m^3$ or $kWh/g$). |
| 7 | **Material Availability & Scalability** | 0.05 | Abundance, commercial availability, synthetic complexity, and cost of catalyst precursor materials. |
| 8 | **Reaction Energetics ($\Delta E_{rxn}$)** | 0.05 | Thermodynamic favorability of the rate-determining elementary reaction step (e.g. C-F bond cleavage or decarboxylation). |
| 9 | **Experimental Confirmation of Elementary Step** | 0.05 | Whether proposed intermediates have been spectroscopically observed in situ or remain computational hypotheses. |
| 10 | **Evidence Completeness & Reproducibility** | 0.05 | Peer-reviewed experimental validation vs unverified hypothetical claims. |

$$\sum_{i=1}^{10} w_i = 1.00$$

---

## 3. Mathematical Scoring & The Missing Defluorination Penalty

### 3.1 Unweighted Normalization
Each raw measurement is mapped to $[0, 1]$ using empirical and thermodynamic bounding functions. For missing metrics, the value is not treated as zero (which would distort averages) nor fabricated, but treated as unverified.

### 3.2 The Mandatory Defluorination Penalty
If a candidate reports parent removal $R_{parent} > 0$ but quantitative defluorination $F_{defluor}$ is **MISSING** or unmeasured:

$$\text{Composite Score } S_k = \left( \sum_{i=1}^{10} w_i d_i \right) \times 0.60$$

Furthermore, the candidate's status is capped:
- **Maximum Status:** `Promising but incomplete evidence`
- **Disqualification:** A candidate lacking defluorination data **cannot** receive the classification `Evidence-supported candidate`, regardless of parent removal efficiency.

---

## 4. Output Status Classifications

| Classification | Criteria | Meaning for Researchers |
|---|---|---|
| **Evidence-Supported Candidate** | $S_k \ge 0.70$, defluorination quantified $\ge 60\%$, byproducts characterized. | Strong literature grounding for destructive defluorination; high priority for scale-up validation. |
| **Promising but Incomplete Evidence** | $0.45 \le S_k < 0.70$, or missing defluorination / byproduct balance. | Requires immediate analytical verification of inorganic fluoride release before pilot investment. |
| **Mechanistically Interesting Candidate** | Favorable thermodynamics or novel active sites, but low parent removal or harsh conditions. | Useful for mechanistic insight and catalyst engineering, but not currently practical. |
| **Insufficient Evidence to Rank** | Unverified claims, hypothetical materials without baseline data, or contradictory publications. | Demands fundamental bench-scale replication. |

---

## 5. Robustness & Sensitivity Analysis

To prevent researcher bias from arbitrary weighting:
1. The engine shifts each dimension weight by $\pm 20\%$ while renormalizing remaining weights.
2. The candidate rank order is recomputed under each perturbation.
3. If the top candidate remains unchanged across $\ge 80\%$ of weight shifts, the ranking is declared **ROBUST**.
4. If candidate ranks invert under minor shifts (e.g. prioritizing energy efficiency flips $In_2O_3$ vs $BDD$), the engine flags the critical decision trade-off for the researcher.

---

## 6. Novel & Hypothetical Candidate Extension Policy

Q-FLUX 2.0 explicitly permits testing hypothetical catalyst designs (such as single-atom $Fe-N_4/C$ catalysts):
1. **Mandatory Provenance Tag:** Must be marked as `Hypothetical candidate (Unverified)`.
2. **Chemically Plausible Rationale:** Must specify the hypothesized active site and coordination environment.
3. **Separate Shortlist:** Hypothetical candidates are grouped under an exploratory tab and are never presented as proven solutions.
