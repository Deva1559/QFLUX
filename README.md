# ⚛️ Q-FLUX 2.0: Quantum-Guided PFAS Research, Reaction Pathway Analysis, and Fluorine Recovery

> **Domain:** Quantum Computing, Computational Chemistry & Environmental Forensics  
> **Classification:** Research-Grade Computational Chemistry Platform & Governance Engine  
> **Architecture:** 100% Local Execution (Strictly No Docker or Paid Cloud Quantum Hardware Required)  
> **Repository:** [https://github.com/Deva1559/QFLUX.git](https://github.com/Deva1559/QFLUX.git)

---

## 📌 Executive Overview

Per- and polyfluoroalkyl substances (**PFAS**) are toxic anthropogenic organofluorine contaminants characterized by exceptionally strong carbon–fluorine bonds (~485 kJ/mol, 116 kcal/mol).

A central flaw in published environmental degradation literature is equating **parent-compound disappearance** with actual destruction. As rigorously demonstrated by **Smith et al. (2024)** (*Environmental Science & Technology*, [DOI: 10.1021/acs.est.3c10617](https://doi.org/10.1021/acs.est.3c10617)), converting 100% of PFOA into shorter-chain perfluoroheptanoic acid (PFHpA) yields **100% parent loss**, but only **~13% defluorination** and **0% carbon mineralization**—leaving 87% of toxic fluorine in mobile, persistent shorter-chain forms.

**Q-FLUX 2.0** provides an evidence-based, four-stage computational discovery and forensic governance pipeline:

1. **Stage 1: Forensic Audit & Fluorine Accounting**
   - Mathematical mass-balance recovery verification ($90\% \le \text{Closure} \le 105\%$).
   - Flags unmeasured volatile organofluorine deficits before false claims of destruction can propagate.
2. **Stage 2: Quantum & Mechanistic Chemistry Workbench**
   - **Reaction Pathway Explorer:** Graphs elementary radical cleavage steps and verified degradation intermediates.
   - **Ab-Initio Electronic Structure:** Real Restricted Hartree-Fock (RHF/STO-3G) SCF solver computing ground-state electronic energies, HOMO-LUMO gaps, and reaction energetics ($\Delta E_{\text{rxn}}$).
   - **Quantum Algorithm Workbench:** Statevector Variational Quantum Eigensolver (VQE) mapped with a 2-qubit Jordan-Wigner Hamiltonian, validated against exact classical diagonalization.
3. **Stage 3: Catalyst Screening & Multi-Criteria Prioritization**
   - **Audited Literature Catalogue:** Curated benchmark database comparing $Fe^0$ (nZVI), $\text{In}_2\text{O}_3$, UV/Sulfite, $BiOCl$, and $\text{Ga}_2\text{O}_3$.
   - **10-Dimension Decision Engine:** Multi-criteria decision analysis (MCDA) enforcing a mandatory penalty for missing defluorination, paired with $\pm 20\%$ weight-shift sensitivity analysis.
4. **Stage 4: Synthesis & Publication Deliverables**
   - **Research Governance Engine:** Deterministic rule-based advice on analytical gaps and remaining uncertainties.
   - **Audit-Grade Dossiers:** Automated PDF report compilation using ReportLab Platypus with embedded charts, tables, and provenance disclosures.

---

## 🏗️ System Architecture & Source Code Layout

```
QFLUX/
├── backend/                       # Python 3.10+ / FastAPI / SQLite / SQLAlchemy
│   ├── app/
│   │   ├── api/v1/endpoints/     # REST Endpoints: catalysts, chemistry, quantum, prioritization, fluorine, reports
│   │   ├── core/                 # Application settings and CORS policy
│   │   ├── db/                   # Database session management
│   │   ├── models/               # 10 Normalized SQLAlchemy models
│   │   ├── schemas/              # Strongly-typed Pydantic v2 schemas
│   │   └── services/             # Classical SCF, VQE, Prioritization, Fluorine Balance, ReportLab
│   ├── tests/                    # 27 Automated scientific validation tests (100% passing)
│   ├── scripts/                  # Database initialization & verified literature seeder
│   ├── generated_reports/        # Saved publication-grade PDF dossiers
│   ├── q_flux.db                 # Persisted SQLite literature database
│   └── requirements.txt          # Pinned Python dependencies
│
├── frontend/                      # High-Performance Web Application (Vite / React 18 / TypeScript)
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, PipelineStepper, WorkflowFooter, Toast, WarningBanner
│   │   ├── views/                # 8 Scientific Views: Overview, FluorineBalance, Pathways, Chemistry,
│   │   │                         # Quantum, Catalysts, Prioritization, Evidence
│   │   ├── services/             # Strongly-typed API client communicating with FastAPI
│   │   ├── types.ts              # TypeScript interface definitions
│   │   ├── App.tsx               # Pipeline layout coordinator & state manager
│   │   └── index.css             # Fluid responsive design system with light modern palette
│   ├── package.json              # Frontend scripts and dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   └── vite.config.ts            # Vite bundler configuration
│
├── docs/                          # Scientific & Technical Methodology Documentation
│   ├── architecture.md           # End-to-end data pipelines & flowcharts
│   ├── scientific_methodology.md # Ab-initio SCF and VQE mathematical formulations
│   ├── catalyst_prioritization.md# 10-D MCDA scoring matrix and penalty functions
│   ├── data_provenance.md        # Experimental literature sources and validation audits
│   ├── limitations.md            # Boundary conditions and future physical experiments
│   └── demo_script.md            # Live walkthrough script
│
├── .gitignore                     # Git ignore rules for Python, Node, and Expo
└── README.md                      # Project documentation and setup guide
```

---

## 🔬 Scientific Implementation Details

### 1. Forensic Fluorine Accounting (Mass Balance Closure)
$$\text{Recovery (\%)} = \frac{[\text{F}^-]_{\text{inorganic}} + [\text{F}]_{\text{remaining organic}} + [\text{F}]_{\text{other}}}{[\text{F}]_{\text{initial}}} \times 100$$
- **Closure Window:** $90\% \le \text{Recovery} \le 105\%$
- **Volatile Deficit Detection:** Flags unexplained organofluorine losses (e.g., volatile fluorinated alkanes) to prevent premature claims of mineralization.

### 2. Ab-Initio Restricted Hartree-Fock (RHF/STO-3G) Engine
- Implemented in [`backend/app/services/classical_chemistry_service.py`](backend/app/services/classical_chemistry_service.py).
- Evaluates nuclear repulsion $V_{nn} = \sum_{A < B} \frac{Z_A Z_B}{R_{AB}}$ from Cartesian coordinates.
- Solves the Roothaan-Hall equations $FC = SC\epsilon$ iteratively using a minimal STO-3G basis representation to determine electronic ground-state energies, orbital eigenvalues, and reaction energetics:
$$\Delta E_{\text{rxn}} = \sum E_{\text{products}} - \sum E_{\text{reactants}}$$

### 3. Variational Quantum Eigensolver (VQE) with Jordan-Wigner Mapping
- Implemented in [`backend/app/services/quantum_service.py`](backend/app/services/quantum_service.py).
- Constructs a 2-qubit Jordan-Wigner mapped Hamiltonian representing the $\sigma$ and $\sigma^*$ orbitals of a terminal C-F bond:
$$H = g_0 I + g_1 Z_0 + g_2 Z_1 + g_3 Z_0 Z_1 + g_4 X_0 X_1 + g_5 Y_0 Y_1$$
- Hardware-efficient parameterized ansatz:
$$|\psi(\vec{\theta})\rangle = \text{CNOT}_{01} \cdot \left(R_y(\theta_0) R_z(\theta_1) \otimes R_y(\theta_2) R_z(\theta_3)\right) |00\rangle$$
- Classical optimizers (Nelder-Mead, COBYLA) minimize $\langle \psi(\vec{\theta}) | H | \psi(\vec{\theta}) \rangle$, verified against exact classical diagonalization eigenvalues within $10^{-8}$ Hartree tolerance.

### 4. 10-Dimensional Catalyst Prioritization & Defluorination Penalty
- Implemented in [`backend/app/services/prioritization_service.py`](backend/app/services/prioritization_service.py).
- Scores systems across: Defluorination, Parent Removal, Byproduct Safety, Mechanism Evidence, Catalyst Stability, Energy Feasibility, Evidence Completeness, Cost, Scalability, and Kinetics.
- **Defluorination Penalty Function:** If a candidate achieves high parent degradation but lacks stoichiometric fluoride recovery or reports volatile intermediates without mass balance, its final rank is penalized:
$$S_{\text{final}} = S_{\text{weighted}} \times \left(1.0 - P_{\text{defluorination}}\right)$$

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Python:** Version 3.10 or higher
- **Node.js:** Version 18.0 or higher
- **Environment:** Windows PowerShell, macOS, or Linux (No Docker or paid cloud services needed)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Deva1559/QFLUX.git
cd QFLUX
```

---

### Step 2: Backend Setup (FastAPI + SQLite)

Open a terminal in the project root:

```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1    # On Linux/macOS: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Initialize and re-seed the literature database
python scripts/init_db.py

# Run the 27 scientific validation tests
pytest tests -v

# Launch the FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API:** `http://localhost:8000`
- **Interactive OpenAPI Documentation:** `http://localhost:8000/docs`

---

### Step 3: Frontend Setup (Vite + React + TypeScript)

Open a second terminal in the project root:

```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite local development server
npm run dev
```

- **Frontend Application:** Open your browser at `http://localhost:5173`

---

## 🧪 Automated Scientific Validation Suite

The backend contains a test suite verifying every computational and forensic algorithm:

```powershell
pytest backend/tests -v
```

### Test Coverage Highlights:
- **`test_classical_chemistry.py`**: XYZ coordinate parser, nuclear point charge repulsion, RHF/STO-3G SCF ground states, coincident atom checks, and $\Delta E_{\text{rxn}}$ calculations.
- **`test_quantum_benchmark.py`**: Hermiticity verification, exact diagonalized eigensolutions vs VQE convergence, and seed reproducibility.
- **`test_fluorine_balance.py`**: Smith et al. (2024) audit benchmark, deficit & surplus detections, missing analytical fractions, and zero-division edge cases.
- **`test_catalyst_prioritization.py`**: 10-D normalization, missing-defluorination penalty enforcement, and $\pm 20\%$ weight-shift sensitivity analysis.
- **`test_reports.py`**: Automated ReportLab Platypus PDF compilation and binary streaming.

**Result:** `27 passed in 4.92s (100% SUCCESS)`

---

## 📄 License & Attribution

- Built as part of the **Quantum in Biotechnology & Chemistry** initiative.
- Literature data curated from peer-reviewed publications (*ES&T*, *Applied Catalysis B*, *ACS ES&T Engineering*).
- References and data provenance detailed in [`docs/data_provenance.md`](docs/data_provenance.md).
