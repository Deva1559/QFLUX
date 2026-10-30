import time
import json
import threading
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import CalculationJob
from app.services.classical_chemistry_service import classical_chemistry_service
from app.services.quantum_service import quantum_service
from app.schemas import QuantumBenchmarkRequest

class CalculationJobService:
    MAX_ACTIVE_JOBS_PER_USER = 5

    def __init__(self):
        self._cancel_flags = set()

    def _validate_job_params(self, job_type: str, input_params: Dict[str, Any]):
        if not isinstance(input_params, dict):
            raise ValueError("Input parameters must be provided as a key-value dictionary.")
        
        # Guard against abusive payload sizes
        params_str = json.dumps(input_params)
        if len(params_str) > 50000:
            raise ValueError("Calculation input parameters exceed maximum allowed size of 50,000 bytes.")

        if job_type == "scf_classical":
            xyz_coords = input_params.get("xyz_coords", "")
            if isinstance(xyz_coords, str) and len(xyz_coords) > 10000:
                raise ValueError("Molecular coordinates exceed maximum allowed length of 10,000 characters.")
        elif job_type == "vqe_quantum":
            max_iter = input_params.get("max_iter", 100)
            if isinstance(max_iter, (int, float)) and max_iter > 5000:
                raise ValueError("VQE max_iter cannot exceed 5,000 to prevent computational denial-of-service.")
        else:
            raise ValueError(f"Unsupported job_type '{job_type}'. Must be 'scf_classical' or 'vqe_quantum'.")

    def submit_job(
        self,
        db: Session,
        job_type: str,
        input_params: Dict[str, Any],
        project_id: Optional[int] = None,
        user_id: Optional[int] = None,
    ) -> CalculationJob:
        """Enqueues a new calculation job in 'Queued' state and launches background worker."""
        self._validate_job_params(job_type, input_params)

        if user_id is not None:
            active_count = db.query(CalculationJob).filter(
                CalculationJob.user_id == user_id,
                CalculationJob.status.in_(["Queued", "Running"])
            ).count()
            if active_count >= self.MAX_ACTIVE_JOBS_PER_USER:
                raise ValueError(
                    f"Resource limit reached: You have {active_count} active calculation jobs. "
                    f"Maximum allowed is {self.MAX_ACTIVE_JOBS_PER_USER} concurrent jobs."
                )

        job = CalculationJob(
            project_id=project_id,
            user_id=user_id,
            job_type=job_type,
            status="Queued",
            progress_pct=0.0,
            input_params_json=json.dumps(input_params),
            log_output="[Job Enqueued] Waiting for computation worker...\n"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        thread = threading.Thread(target=self._run_job_worker, args=(job.id,), daemon=True)
        thread.start()
        return job

    def cancel_job(self, db: Session, job_id: int) -> CalculationJob:
        """Marks a job as cancelled if still queued or running."""
        job = db.query(CalculationJob).filter(CalculationJob.id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        if job.status in ["Completed", "Failed", "Cancelled"]:
            return job

        self._cancel_flags.add(job_id)
        job.status = "Cancelled"
        job.log_output = (job.log_output or "") + "\n[Job Cancelled] Execution stopped by user request."
        db.commit()
        db.refresh(job)
        return job

    def _run_job_worker(self, job_id: int):
        """Worker executing calculation in background thread with progress logging."""
        db = SessionLocal()
        try:
            job = db.query(CalculationJob).filter(CalculationJob.id == job_id).first()
            if not job:
                return

            if job_id in self._cancel_flags:
                job.status = "Cancelled"
                db.commit()
                return

            job.status = "Running"
            job.progress_pct = 15.0
            job.log_output += f"[{datetime.utcnow().isoformat()}] Worker picked up job. Parsing inputs...\n"
            db.commit()

            start_t = time.time()
            try:
                input_params = json.loads(job.input_params_json) if job.input_params_json else {}
            except Exception as e:
                raise ValueError(f"Invalid input_params JSON: {str(e)}")

            if not isinstance(input_params, dict):
                raise ValueError(f"input_params must be a dictionary, got {type(input_params).__name__}")

            if job.job_type == "scf_classical":
                job.log_output += f"[{datetime.utcnow().isoformat()}] Initializing Cartesian STO-3G molecular integrals...\n"
                job.progress_pct = 40.0
                db.commit()

                molecule_name = input_params.get("molecule_name", "CF3COO-")
                xyz_coords = input_params.get("xyz_coords", "C 0.0 0.0 0.0\nC 1.5 0.0 0.0\nO 2.1 1.0 0.0\nO 2.1 -1.0 0.0\nF -0.5 1.1 0.0\nF -0.5 -0.5 1.0\nF -0.5 -0.5 -1.0")
                charge = input_params.get("charge", -1)
                spin = input_params.get("spin_multiplicity", 1)

                res = classical_chemistry_service.run_molecular_scf(
                    molecule_name=molecule_name,
                    xyz_coords=xyz_coords,
                    charge=charge,
                    spin_multiplicity=spin
                )

                job.progress_pct = 85.0
                job.log_output += f"[{datetime.utcnow().isoformat()}] Electronic structure equations ({res['method']}) converged in {res['iterations']} iterations.\n"
                job.log_output += f"Total Electronic Energy: {res['total_scf_energy_au']:.6f} Hartree\nHOMO-LUMO Gap: {res['homo_lumo_gap_ev']:.3f} eV\n"
                db.commit()

                job.output_results_json = json.dumps(res)

            elif job.job_type == "vqe_quantum":
                if job_id in self._cancel_flags:
                    job.status = "Cancelled"
                    db.commit()
                    return

                job.log_output += f"[{datetime.utcnow().isoformat()}] Generating Jordan-Wigner 2-qubit mapped Hamiltonian...\n"
                job.progress_pct = 35.0
                db.commit()

                # Validate input params against QuantumBenchmarkRequest schema
                req = QuantumBenchmarkRequest(**input_params)
                bench_res = quantum_service.run_benchmark(
                    model_type=req.model_type,
                    optimizer=req.optimizer,
                    max_iter=req.max_iter,
                    tolerance=req.tolerance,
                    random_seed=req.random_seed,
                    coeff_z0=req.coeff_z0,
                    coeff_z1=req.coeff_z1,
                    coeff_xx=req.coeff_xx,
                    coeff_zz=req.coeff_zz,
                )

                if job_id in self._cancel_flags:
                    job.status = "Cancelled"
                    db.commit()
                    return

                vqe_energy = bench_res["vqe_energy"]
                exact_energy = bench_res["exact_energy"]
                abs_error = bench_res["absolute_error"]

                job.progress_pct = 85.0
                job.log_output += f"[{datetime.utcnow().isoformat()}] VQE converged with {req.optimizer}. VQE ground energy: {vqe_energy:.8f} Hartree vs exact: {exact_energy:.8f} Hartree\n"
                job.log_output += f"Absolute error: {abs_error:.8e} Hartree (tolerance: {req.tolerance})\n"
                db.commit()

                job.output_results_json = json.dumps(bench_res)

            else:
                raise ValueError(
                    f"Unsupported calculation job type '{job.job_type}'. "
                    f"Supported types are 'scf_classical' and 'vqe_quantum'."
                )

            if job_id in self._cancel_flags:
                job.status = "Cancelled"
                db.commit()
                return

            elapsed = time.time() - start_t
            job.status = "Completed"
            job.progress_pct = 100.0
            job.runtime_seconds = round(elapsed, 4)
            job.log_output += f"[{datetime.utcnow().isoformat()}] Job completed successfully in {elapsed:.3f} s.\n"
            db.commit()

        except Exception as e:
            if job_id not in self._cancel_flags:
                job.status = "Failed"
                job.error_message = str(e)
                job.log_output += f"[{datetime.utcnow().isoformat()}] ERROR: {str(e)}\n"
                db.commit()
        finally:
            self._cancel_flags.discard(job_id)
            db.close()

job_service = CalculationJobService()
