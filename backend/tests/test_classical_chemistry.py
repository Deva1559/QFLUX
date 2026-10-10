import pytest
from app.services.classical_chemistry_service import classical_chemistry_service, parse_xyz

def test_xyz_parsing_and_nuclear_repulsion():
    xyz = (
        "C  0.000000  0.000000  0.000000\n"
        "F  1.385000  0.000000  0.000000\n"
        "H -0.360000  1.020000  0.000000\n"
        "H -0.360000 -0.510000  0.880000\n"
        "H -0.360000 -0.510000 -0.880000"
    )
    atoms = parse_xyz(xyz)
    assert len(atoms) == 5
    assert atoms[0][0] == "C"
    assert atoms[1][0] == "F"

    e_nuc = classical_chemistry_service.compute_nuclear_repulsion(atoms)
    assert e_nuc > 0.0
    # Nuclear repulsion for CH3F is around 36.8 a.u.
    assert 30.0 < e_nuc < 45.0

def test_molecular_scf_cf3coo():
    xyz = (
        "C  0.000000  0.000000  0.000000\n"
        "C  1.540000  0.000000  0.000000\n"
        "O  2.120000  1.100000  0.000000\n"
        "O  2.120000 -1.100000  0.000000\n"
        "F -0.520000  1.180000  0.000000\n"
        "F -0.520000 -0.590000  1.020000\n"
        "F -0.520000 -0.590000 -1.020000"
    )
    res = classical_chemistry_service.run_molecular_scf(
        molecule_name="CF3COO-",
        xyz_coords=xyz,
        charge=-1,
        spin_multiplicity=1,
        basis_set="STO-3G"
    )
    assert res["converged"] is True
    assert res["num_atoms"] == 7
    assert res["total_scf_energy_au"] < -400.0
    assert res["homo_lumo_gap_ev"] > 0.0
    assert "Isolated molecular fragment model" in res["limitations"]

def test_reaction_energy_calculation():
    # CF3COO- -> .CF3 + CO2 + e-
    e_react = [-418.621450]
    e_prod = [-334.312100, -84.338660] # product fragments
    rxn = classical_chemistry_service.calculate_reaction_energy(e_react, e_prod)
    assert rxn["delta_e_hartree"] < 0.0
    assert rxn["is_exothermic"] is True
    assert "Delta E = E(products) - E(reactants)" in rxn["convention_note"]

def test_coincident_atoms_error():
    # Two atoms with distance 0 must raise error
    bad_xyz = "C 0.0 0.0 0.0\nF 0.0 0.0 0.0"
    with pytest.raises(ValueError, match="Coincident or overlapping"):
        classical_chemistry_service.compute_nuclear_repulsion(parse_xyz(bad_xyz))
