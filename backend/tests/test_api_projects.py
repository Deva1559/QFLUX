from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True

def test_project_crud(client: TestClient):
    # Create project
    payload = {
        "title": "Perfluorohexane Sulfonate (PFHxS) Sonochemical Study",
        "target_pfas": "PFHxS (C6F13SO3H)",
        "research_question": "Can acoustic cavitation defluorinate PFHxS without forming shorter fluorinated carboxylic acids?",
        "destruction_approach": "Sonochemical Cavitation (358 kHz)",
        "status": "Active"
    }
    create_res = client.post("/api/v1/projects", json=payload)
    assert create_res.status_code == 201
    proj_id = create_res.json()["id"]

    # Read project
    get_res = client.get(f"/api/v1/projects/{proj_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == payload["title"]

    # Update project
    update_res = client.patch(f"/api/v1/projects/{proj_id}", json={"status": "Completed"})
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Completed"

    # List projects
    list_res = client.get("/api/v1/projects")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

def test_overview_stats(client: TestClient):
    res = client.get("/api/v1/projects/overview/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_projects"] >= 1
    assert data["total_evidence_records"] >= 1
    assert len(data["scientific_warnings"]) > 0
