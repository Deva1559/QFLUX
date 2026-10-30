import math
import numpy as np
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from scipy.stats import norm
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, WhiteKernel

from app.models import TreatmentExperiment, Catalyst, PFASCompound

class BayesianExperimentPlannerService:
    """Scientific Bayesian Optimization service for research experiment planning.
    
    Fits a Gaussian Process (GP) surrogate model over existing verified experimental
    observations (pH, temperature, loading, duration, catalyst class) to suggest the next
    most informative experiment using Expected Improvement (EI).
    
    If fewer than 3 observations exist, returns an explicit INSUFFICIENT_DATA status
    with structured factorial initial conditions rather than fabricating results."""

    @classmethod
    def optimize_next_experiment(
        cls,
        db: Session,
        target_pfas_id: Optional[int] = None,
        catalyst_id: Optional[int] = None,
        objective: str = "maximize_defluorination",
        exploration_weight_xi: float = 0.01
    ) -> Dict[str, Any]:
        """Evaluates GP acquisition function over candidate design space."""
        # 1. Query existing empirical experiments
        query = db.query(TreatmentExperiment)
        if target_pfas_id:
            query = query.filter(TreatmentExperiment.pfas_id == target_pfas_id)
        if catalyst_id:
            query = query.filter(TreatmentExperiment.catalyst_id == catalyst_id)

        experiments = query.all()

        # Extract features and targets
        x_obs = []
        y_obs = []
        obs_details = []

        for exp in experiments:
            val = exp.defluorination_pct if objective == "maximize_defluorination" else exp.parent_removal_pct
            exp_ph = getattr(exp, "ph", None)
            exp_temp = getattr(exp, "temperature_c", None)
            exp_duration = getattr(exp, "duration_minutes", None) or 120.0
            if val is not None and exp_ph is not None and exp_temp is not None:
                x_obs.append([
                    float(exp_ph),
                    float(exp_temp),
                    float(exp.catalyst_loading_g_l or 1.0),
                    float(exp_duration)
                ])
                y_obs.append(float(val))
                obs_details.append({
                    "experiment_id": exp.id,
                    "ph": exp_ph,
                    "temp_c": exp_temp,
                    "target_value": float(val)
                })

        # 2. Check for sufficient observations
        if len(x_obs) < 3:
            return {
                "status": "INSUFFICIENT_DATA",
                "observations_count": len(x_obs),
                "message": (
                    f"Bayesian optimization requires at least 3 verified empirical observations with complete "
                    f"pH and temperature conditions (currently {len(x_obs)} available). "
                    f"To prevent fabricated model guidance, an initial exploration grid is recommended."
                ),
                "suggested_initial_grid": [
                    {"operating_ph": 3.0, "operating_temperature_c": 25.0, "catalyst_loading_g_l": 1.0, "reaction_time_minutes": 120, "rationale": "Acidic baseline (screening for low-pH radical kinetics)"},
                    {"operating_ph": 7.0, "operating_temperature_c": 25.0, "catalyst_loading_g_l": 1.0, "reaction_time_minutes": 120, "rationale": "Neutral matrix condition (mimicking ambient groundwater)"},
                    {"operating_ph": 10.0, "operating_temperature_c": 50.0, "catalyst_loading_g_l": 2.0, "reaction_time_minutes": 180, "rationale": "Alkaline / elevated thermal condition (testing base-activated pathways)"}
                ],
                "recommended_candidate": None
            }

        X = np.array(x_obs)
        y = np.array(y_obs)

        # 3. Fit Gaussian Process Surrogate Model
        # Matern 5/2 kernel allows smooth physical responses with localized uncertainty
        kernel = Matern(nu=2.5, length_scale=[1.5, 10.0, 0.5, 30.0]) + WhiteKernel(noise_level=1e-2)
        gp = GaussianProcessRegressor(kernel=kernel, n_restarts_optimizer=5, normalize_y=True, random_state=42)
        gp.fit(X, y)

        y_best = float(np.max(y))

        # 4. Generate candidate design grid
        ph_grid = np.linspace(3.0, 10.0, 8)
        temp_grid = np.linspace(20.0, 70.0, 6)
        loading_grid = [0.5, 1.0, 2.0]
        time_grid = [60.0, 120.0, 240.0]

        candidates = []
        for p in ph_grid:
            for t in temp_grid:
                for l in loading_grid:
                    for tm in time_grid:
                        candidates.append([p, t, l, tm])

        X_cand = np.array(candidates)
        mu, sigma = gp.predict(X_cand, return_std=True)

        # 5. Expected Improvement (EI) Acquisition Function
        # EI(x) = (mu(x) - y_best - xi) * Phi(Z) + sigma(x) * phi(Z)
        ei = np.zeros(len(X_cand))
        for i in range(len(X_cand)):
            s = sigma[i]
            if s > 1e-6:
                diff = mu[i] - y_best - exploration_weight_xi
                z = diff / s
                ei[i] = diff * norm.cdf(z) + s * norm.pdf(z)
            else:
                ei[i] = 0.0

        best_idx = int(np.argmax(ei))
        best_cand = X_cand[best_idx]
        best_mu = float(mu[best_idx])
        best_sigma = float(sigma[best_idx])
        best_ei = float(ei[best_idx])

        # Rationale formulation
        if best_sigma > 10.0:
            tradeoff = "high epistemic uncertainty (exploration of uncharacterized reaction space)"
        else:
            tradeoff = "predicted high defluorination kinetic yield (exploitation of promising condition regime)"

        rationale = (
            f"Recommended pH {best_cand[0]:.1f} at {best_cand[1]:.0f}°C with {best_cand[2]:.1f} g/L loading. "
            f"Balances {tradeoff} with Expected Improvement score {best_ei:.3f} (prior best: {y_best:.1f}%)."
        )

        return {
            "status": "OPTIMIZED_RECOMMENDATION",
            "observations_count": len(x_obs),
            "surrogate_model": "Gaussian Process Regressor (Matern 5/2 Kernel)",
            "prior_best_observed_pct": y_best,
            "recommended_conditions": {
                "operating_ph": round(float(best_cand[0]), 1),
                "operating_temperature_c": round(float(best_cand[1]), 1),
                "catalyst_loading_g_l": round(float(best_cand[2]), 2),
                "reaction_time_minutes": int(best_cand[3])
            },
            "predicted_mean_pct": round(best_mu, 2),
            "predictive_uncertainty_sigma": round(best_sigma, 2),
            "expected_improvement": round(best_ei, 4),
            "acquisition_rationale": rationale,
            "baseline_comparison": f"Evaluated against {len(X_cand)} grid candidates; yields maximum expected gain over prior observation {y_best:.1f}%."
        }

bayesian_planner = BayesianExperimentPlannerService()
