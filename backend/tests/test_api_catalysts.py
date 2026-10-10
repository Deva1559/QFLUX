from fastapi.testclient import TestClient

def test_list_and_filter_catalysts(client: TestClient):
    res = client.get("/api/v1/catalysts")
    assert res.status_code == 200
    cats = res.json()
    assert len(cats) >= 4
    # Check In2O3 and ZVI exist
    names = [c["name"] for c in cats]
    assert any("In2O3" in n for n in names)
    assert any("Zerovalent Iron" in n for n in names)

def test_catalyst_comparison_endpoint(client: TestClient):
    cats = client.get("/api/v1/catalysts").json()
    ids = [cats[0]["id"], cats[1]["id"]]

    comp_res = client.post("/api/v1/catalysts/compare", json={"catalyst_ids": ids})
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert len(comp_data["comparison_table"]) >= 2
    assert "property" in comp_data["comparison_table"][0]
    assert "values" in comp_data["comparison_table"][0]
    assert "tradeoff_summary" in comp_data

def test_classical_chemistry_run_api(client: TestClient):
    models = client.get("/api/v1/chemistry/models").json()
    assert len(models) >= 1
    model_id = models[0]["id"]

    run_res = client.post("/api/v1/chemistry/runs", json={
        "model_id": model_id,
        "run_name": "API Automated SCF Test",
        "basis_set": "STO-3G"
    })
    assert run_res.status_code == 201
    run_data = run_res.json()
    assert run_data["converged"] is True
    assert run_data["total_scf_energy_au"] < 0.0

def test_quantum_cf_active_space_run(client: TestClient):
    res = client.post("/api/v1/quantum/benchmarks", json={
        "run_name": "API Test C-F Active Space",
        "model_type": "Reduced C-F Active Space",
        "optimizer": "Nelder-Mead",
        "max_iter": 1500,
        "random_seed": 42
    })
    assert res.status_code == 201
    data = res.json()
    assert data["model_type"] == "Reduced C-F Active Space"
    assert data["num_qubits"] == 2
    assert data["absolute_error"] < 0.05
    assert data["is_toy_model"] is False
    assert "Reduced C-F Active Space" in data["disclaimer_text"]
