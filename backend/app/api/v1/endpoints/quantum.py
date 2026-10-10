import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import QuantumRun
from app.schemas import (
    QuantumBenchmarkRequest, QuantumBenchmarkResponse, QuantumRunResponse
)
from app.services.quantum_service import quantum_service

router = APIRouter()

@router.post("/benchmarks", response_model=QuantumBenchmarkResponse, status_code=status.HTTP_201_CREATED)
def run_quantum_benchmark(req: QuantumBenchmarkRequest, db: Session = Depends(get_db)):
    res = quantum_service.run_benchmark(
        model_type=req.model_type,
        optimizer=req.optimizer,
        max_iter=req.max_iter,
        tolerance=req.tolerance,
        random_seed=req.random_seed,
        coeff_z0=req.coeff_z0,
        coeff_z1=req.coeff_z1,
        coeff_xx=req.coeff_xx,
        coeff_zz=req.coeff_zz
    )

    qrun = QuantumRun(
        project_id=req.project_id,
        run_name=req.run_name,
        model_type=res["model_type"],
        hamiltonian_type=res["hamiltonian_type"],
        hamiltonian_definition=res["hamiltonian_definition"],
        num_qubits=res["num_qubits"],
        exact_energy=res["exact_energy"],
        vqe_energy=res["vqe_energy"],
        absolute_error=res["absolute_error"],
        relative_error=res["relative_error"],
        optimizer_name=res["optimizer_name"],
        iterations=res["iterations"],
        function_evaluations=res["function_evaluations"],
        optimizer_converged=res["optimizer_converged"],
        execution_time_ms=res["execution_time_ms"],
        random_seed=res["random_seed"],
        initial_parameters=json.dumps(res["initial_parameters"]),
        optimal_parameters=json.dumps(res["optimal_parameters"]),
        software_versions=json.dumps(res["software_versions"]),
        is_toy_model=res["is_toy_model"],
        disclaimer_text=res["disclaimer_text"],
        notes=res["classical_comparison_note"]
    )
    db.add(qrun)
    db.commit()
    db.refresh(qrun)

    return QuantumBenchmarkResponse(
        id=qrun.id,
        run_name=req.run_name,
        model_type=res["model_type"],
        hamiltonian_type=res["hamiltonian_type"],
        hamiltonian_definition=res["hamiltonian_definition"],
        num_qubits=res["num_qubits"],
        exact_energy=res["exact_energy"],
        vqe_energy=res["vqe_energy"],
        absolute_error=res["absolute_error"],
        relative_error=res["relative_error"],
        optimizer_name=res["optimizer_name"],
        iterations=res["iterations"],
        function_evaluations=res["function_evaluations"],
        optimizer_converged=res["optimizer_converged"],
        execution_time_ms=res["execution_time_ms"],
        random_seed=res["random_seed"],
        initial_parameters=res["initial_parameters"],
        optimal_parameters=res["optimal_parameters"],
        software_versions=res["software_versions"],
        is_toy_model=res["is_toy_model"],
        disclaimer_text=res["disclaimer_text"],
        classical_comparison_note=res["classical_comparison_note"]
    )

@router.get("/benchmarks", response_model=List[QuantumRunResponse])
def list_benchmarks(project_id: Optional[int] = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(QuantumRun)
    if project_id:
        query = query.filter((QuantumRun.project_id == project_id) | (QuantumRun.project_id.is_(None)))
    return query.order_by(QuantumRun.id.desc()).offset(skip).limit(limit).all()

@router.get("/benchmarks/{run_id}", response_model=QuantumRunResponse)
def get_benchmark(run_id: int, db: Session = Depends(get_db)):
    qrun = db.query(QuantumRun).filter(QuantumRun.id == run_id).first()
    if not qrun:
        raise HTTPException(status_code=404, detail="Quantum benchmark run not found")
    return qrun
