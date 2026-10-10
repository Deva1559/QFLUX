import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.optimize import minimize

st.set_page_config(page_title="Q-FLUX | PFAS Research Prototype", page_icon="⚛️", layout="wide")
st.title("⚛️ Q-FLUX")
st.caption("Quantum-assisted PFAS pathway analysis | Hackathon research prototype")
st.warning("Research prototype only. The quantum benchmark below uses a small illustrative Hamiltonian, NOT an electronic-structure model of PFAS. The pathway example is literature-derived and is not an experimental result produced by this app.")

with st.sidebar:
    st.header("Study configuration")
    pfas = st.selectbox("Target PFAS", ["PFOA (perfluorooctanoic acid)"])
    pathway = st.selectbox("Illustrative pathway", ["PFOA → PFHpA (one-carbon shortening example)"])
    st.markdown("---")
    st.markdown("**Prototype modules**")
    st.write("1. Quantum VQE benchmark")
    st.write("2. Fluorine accounting")
    st.write("3. Evidence & validation checklist")

tab1, tab2, tab3 = st.tabs(["Quantum benchmark", "Fluorine accounting", "Validation plan"])

# A two-qubit Hamiltonian with a known ground state. This is a pedagogical VQE test,
# not a PFAS molecular Hamiltonian.
I=np.eye(2,dtype=complex)
X=np.array([[0,1],[1,0]],dtype=complex)
Y=np.array([[0,-1j],[1j,0]],dtype=complex)
Z=np.array([[1,0],[0,-1]],dtype=complex)
H = -1.05*np.kron(Z,I) - 0.75*np.kron(I,Z) + 0.35*np.kron(X,X) + 0.2*np.kron(Z,Z)

def ry(t):
    return np.array([[np.cos(t/2),-np.sin(t/2)],[np.sin(t/2),np.cos(t/2)]],dtype=complex)
def rz(t):
    return np.array([[np.exp(-1j*t/2),0],[0,np.exp(1j*t/2)]],dtype=complex)
def state(params):
    a,b,c,d=params
    psi=np.array([1,0,0,0],dtype=complex)
    psi=np.kron(ry(a)@rz(b), ry(c)@rz(d)) @ psi
    # entangle with CNOT control q0, target q1
    CNOT=np.array([[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]],dtype=complex)
    return CNOT@psi
def energy(params):
    psi=state(params)
    return float(np.real(np.vdot(psi,H@psi)))
def run_vqe():
    res=minimize(energy, np.array([0.4,0.2,0.6,0.3]), method="Nelder-Mead",
                 options={"maxiter":2500,"xatol":1e-10,"fatol":1e-10})
    return res
with tab1:
    st.subheader("VQE vs exact diagonalization")
    st.write("This module demonstrates the hybrid optimization loop on a small, explicitly defined two-qubit Hamiltonian. It validates the software workflow only; it does not calculate PFAS chemistry.")
    if st.button("Run VQE benchmark", type="primary"):
        res=run_vqe()
        exact=float(np.linalg.eigvalsh(H)[0])
        vqe=float(res.fun)
        err=abs(vqe-exact)
        c1,c2,c3=st.columns(3)
        c1.metric("VQE energy (model units)",f"{vqe:.8f}")
        c2.metric("Exact ground energy",f"{exact:.8f}")
        c3.metric("Absolute error",f"{err:.3e}")
        st.success("Benchmark completed. Inspect the error before claiming agreement; this is a toy-model validation.")
        st.code(f"Optimizer success: {res.success}\nIterations: {res.nit}\nAbsolute error: {err:.8e}")
        st.session_state["vqe_result"]={"vqe":vqe,"exact":exact,"error":err,"nit":int(res.nit)}
    if "vqe_result" in st.session_state:
        r=st.session_state["vqe_result"]
        st.markdown("**Interpretation:** The VQE estimate is compared against exact diagonalization for the *same toy Hamiltonian*. A future research version must replace this toy model with a chemically justified active-space Hamiltonian for a selected PFAS reaction step.")
    st.markdown("**Next scientific upgrade**")
    st.markdown("- Define a specific PFAS-related reaction and geometry with a chemistry mentor.\n- Derive an active-space Hamiltonian using a supported chemistry driver.\n- Compare VQE, exact diagonalization (where tractable), and a suitable classical chemistry reference.\n- Report units, basis set, charge, spin, active orbitals, convergence, and uncertainty.")

with tab2:
    st.subheader("Why parent-compound disappearance is not enough")
    st.write("A published illustrative example notes that converting all PFOA (C₈) to perfluoroheptanoic acid (PFHpA, C₇) can mean 100% degradation of the parent compound, while only about 13% defluorination and 0% mineralization. This is an explanatory literature example, not a measurement from this application.")
    st.info("Source: Smith et al., Environmental Science & Technology (2024), “The Need to Include a Fluorine Mass Balance in the Development of Effective Technologies for PFAS Destruction.” DOI: 10.1021/acs.est.3c10617")
    a,b,c=st.columns(3)
    a.metric("Parent PFOA degradation", "100%", help="Illustrative literature scenario")
    b.metric("Defluorination", "≈13%", help="Illustrative literature scenario")
    c.metric("Mineralization", "0%", help="Illustrative literature scenario")
    st.markdown("#### User-defined fluorine accounting")
    st.write("Enter measured or hypothetical fluorine quantities to calculate how much of the starting fluorine is accounted for. Keep simulated inputs clearly labelled.")
    initial=st.number_input("Initial total fluorine (arbitrary consistent units)", min_value=0.0, value=100.0, step=1.0)
    inorganic=st.number_input("Measured inorganic fluoride after treatment", min_value=0.0, value=13.0, step=1.0)
    organic=st.number_input("Measured remaining organic fluorine", min_value=0.0, value=87.0, step=1.0)
    if initial>0:
        defluor=100*inorganic/initial
        recovery=100*(inorganic+organic)/initial
        st.metric("Apparent defluorination",f"{defluor:.1f}%")
        st.metric("Fluorine mass-balance closure",f"{recovery:.1f}%")
        if recovery>105 or recovery<90:
            st.warning("Mass balance is outside a provisional 90–105% check range. Investigate analytical uncertainty, background fluoride, unmeasured species, and sampling.")
        else:
            st.success("Mass balance is within the provisional check range. This alone does not prove complete PFAS destruction or safety.")
    st.caption("Values entered here are user inputs. Do not describe them as experimental results unless measured in a real study.")

with tab3:
    st.subheader("Evidence checklist before any real-world claim")
    items=[
        "Identify the exact PFAS and documented reaction pathway.",
        "Cite a primary paper for the proposed mechanism.",
        "Distinguish parent-compound degradation from defluorination and mineralization.",
        "Record whether each number is measured, literature-derived, computed, or hypothetical.",
        "For quantum chemistry, report geometry, charge, spin, basis, active space, and energy units.",
        "Compare VQE against exact diagonalization on the same Hamiltonian.",
        "Use a suitable classical chemistry reference for the actual molecular system.",
        "Do not claim catalyst effectiveness, safety, or commercial readiness without experimental evidence."
    ]
    for item in items:
        st.checkbox(item, key="check_"+str(items.index(item)))
    st.markdown("#### Suggested references")
    st.markdown("- [Qiskit Nature: Ground-state solvers](https://qiskit-community.github.io/qiskit-nature/tutorials/03_ground_state_solvers.html)\n- [Qiskit Nature: Getting started](https://qiskit-community.github.io/qiskit-nature/getting_started.html)\n- [Smith et al. (2024): Fluorine mass balance for PFAS destruction](https://pmc.ncbi.nlm.nih.gov/articles/PMC10867837/)")
    st.markdown("#### Honest prototype claim")
    st.write("“Q-FLUX demonstrates a quantum variational optimization workflow on a toy Hamiltonian and provides an evidence-aware PFAS fluorine-accounting case study. PFAS-specific quantum reaction energies and experimental destruction performance remain future validation work.”")
