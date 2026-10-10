import pytest
import numpy as np
from app.services.quantum_service import quantum_service, build_hamiltonian
from app.schemas import QuantumBenchmarkRequest

def test_hamiltonian_construction():
    """Verify 2-qubit toy Hamiltonian is Hermitian with dimension 4x4."""
    H, h_def, desc, is_toy = build_hamiltonian("Pedagogical Toy Benchmark", -1.05, -0.75, 0.35, 0.20)
    assert H.shape == (4, 4)
    # Check Hermiticity H = H^dagger
    assert np.allclose(H, H.conj().T)
    assert is_toy is True

def test_molecular_reduced_hamiltonian_construction():
    """Verify 2-qubit Reduced C-F Active Space Hamiltonian is Hermitian with dimension 4x4."""
    H, h_def, desc, is_toy = build_hamiltonian("Reduced C-F Active Space")
    assert H.shape == (4, 4)
    assert np.allclose(H, H.conj().T)
    assert is_toy is False
    assert "Reduced C-F bond" in desc

def test_vqe_matches_exact_diagonalization():
    """Verify VQE converges close to the exact minimum eigenvalue of the SAME Hamiltonian."""
    res = quantum_service.run_benchmark(
        model_type="Pedagogical Toy Benchmark",
        optimizer="Nelder-Mead",
        max_iter=3000,
        tolerance=1e-8,
        random_seed=42,
        coeff_z0=-1.05,
        coeff_z1=-0.75,
        coeff_xx=0.35,
        coeff_zz=0.20
    )

    # Both operate on the exact same Hamiltonian
    H, _, _, _ = build_hamiltonian("Pedagogical Toy Benchmark", -1.05, -0.75, 0.35, 0.20)
    exact_eig = float(np.linalg.eigvalsh(H)[0])

    assert res["exact_energy"] == pytest.approx(exact_eig, abs=1e-8)
    assert res["vqe_energy"] >= res["exact_energy"] - 1e-7  # Variational principle: E_vqe >= E_exact
    assert res["absolute_error"] < 0.05  # Within tight tolerance for Nelder-Mead on 4-parameter ansatz
    assert res["optimizer_converged"] is True
    assert res["num_qubits"] == 2
    assert res["is_toy_model"] is True
    assert "does NOT predict PFAS molecular ground states" in res["disclaimer_text"]

def test_reproducibility_with_seed():
    """Deterministic seed yields identical initial parameters and results."""
    res1 = quantum_service.run_benchmark(random_seed=123)
    res2 = quantum_service.run_benchmark(random_seed=123)

    assert res1["exact_energy"] == pytest.approx(res2["exact_energy"], abs=1e-9)
    assert res1["vqe_energy"] == pytest.approx(res2["vqe_energy"], abs=1e-9)
    assert res1["absolute_error"] == pytest.approx(res2["absolute_error"], abs=1e-9)

