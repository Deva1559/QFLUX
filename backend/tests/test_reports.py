from fastapi.testclient import TestClient

def test_report_generation_and_download(client: TestClient):
    # Retrieve a valid project id
    proj_res = client.get("/api/v1/projects")
    assert proj_res.status_code == 200
    projects = proj_res.json()
    assert len(projects) > 0
    project_id = projects[0]["id"]

    # Generate PDF report
    gen_res = client.post("/api/v1/reports", json={
        "project_id": project_id,
        "report_title": "Automated Test Research Dossier"
    })
    assert gen_res.status_code == 201
    rep_data = gen_res.json()
    assert rep_data["file_size_bytes"] > 1000
    report_id = rep_data["id"]

    # Verify download
    dl_res = client.get(f"/api/v1/reports/{report_id}/download")
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
    # PDF starts with %PDF
    assert dl_res.content[:4] == b"%PDF"
