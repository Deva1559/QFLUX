from typing import Dict, Any, List, Optional
from app.schemas import FluorineBalanceCalculateRequest, FluorineBalanceCalculateResponse

VALID_UNITS = {
    "mg/l": 1.0,
    "mg/L": 1.0,
    "ug/l": 0.001,
    "ug/L": 0.001,
    "µg/l": 0.001,
    "µg/L": 0.001,
    "ppm": 1.0,
    "ppb": 0.001,
    "mg": 1.0,
    "ug": 0.001,
    "µg": 0.001,
    "%": 1.0,
    "mmol/l": 18.9984,  # mmol of F per liter to mg/L
    "mmol/L": 18.9984,
    "umol/l": 0.0189984,  # umol of F per liter to mg/L
    "umol/L": 0.0189984
}

class FluorineAccountingService:
    """Scientific mass-balance accounting engine for organofluorine degradation.
    Enforces strict mathematical closure, separates fluoride release from carbon mineralization,
    treats missing analytical measurements as missing rather than zero, and flags analytical anomalies."""

    @staticmethod
    def calculate(request: FluorineBalanceCalculateRequest) -> FluorineBalanceCalculateResponse:
        initial = request.initial_fluorine_inventory
        raw_units = (request.inventory_basis_units or "mg/L").strip()
        inorganic = request.measured_inorganic_fluoride
        organic = request.remaining_organic_fluorine
        other = request.other_identified_fluorine if request.other_identified_fluorine is not None else 0.0

        # 1. Validation of basis units and inventory bounds
        if raw_units.lower() not in [u.lower() for u in VALID_UNITS]:
            raise ValueError(
                f"Unsupported inventory basis unit '{raw_units}'. "
                f"Supported units include: mg/L, ug/L, ppm, ppb, mmol/L, umol/L, %, mg."
            )

        if initial <= 0.0:
            raise ValueError("Initial fluorine inventory must be strictly greater than zero.")
        
        if inorganic is not None and inorganic < 0.0:
            raise ValueError("Measured inorganic fluoride cannot be negative.")
        
        if organic is not None and organic < 0.0:
            raise ValueError("Remaining organic fluorine cannot be negative.")
            
        if other < 0.0:
            raise ValueError("Other identified fluorine cannot be negative.")

        uncertainty_flags: List[str] = []
        defluor_pct: Optional[float] = None
        organic_pct: Optional[float] = None
        closure_pct: Optional[float] = None
        closure_status: str = "Incomplete data"

        # 2. Defluorination Calculation
        if inorganic is not None:
            defluor_pct = (inorganic / initial) * 100.0
            if defluor_pct > 100.0:
                uncertainty_flags.append(
                    f"Apparent defluorination exceeds 100% ({defluor_pct:.1f}%). Possible background fluoride contamination, analytical calibration drift, or underestimated starting inventory."
                )
        else:
            uncertainty_flags.append(
                "Missing inorganic fluoride measurement: Apparent defluorination cannot be calculated."
            )

        # 3. Remaining Organic Fluorine Calculation
        if organic is not None:
            organic_pct = (organic / initial) * 100.0
            if organic_pct > 100.0:
                uncertainty_flags.append(
                    f"Remaining organic fluorine exceeds starting inventory ({organic_pct:.1f}%). Re-check combustion ion chromatography (CIC) or total organic fluorine (TOF) calibration."
                )
        else:
            uncertainty_flags.append(
                "Missing remaining organic fluorine measurement: Total mass-balance closure cannot be determined."
            )

        # 4. Mass-Balance Closure Calculation (both inorganic and organic must be present)
        can_calculate_closure = (inorganic is not None) and (organic is not None)
        accounted_total: float = 0.0

        if can_calculate_closure:
            accounted_total = float(inorganic) + float(organic) + float(other)
            closure_pct = (accounted_total / initial) * 100.0
            if 90.0 <= closure_pct <= 105.0:
                closure_status = "Acceptable (90-105%)"
            elif closure_pct < 90.0:
                closure_status = "Deficit (<90%)"
                deficit_pct = 100.0 - closure_pct
                uncertainty_flags.append(
                    f"Fluorine mass-balance deficit of {deficit_pct:.1f}%. Indicates potential unmeasured organofluorine intermediates (e.g. volatile PFCAs, fluorotelomers) or matrix sorption."
                )
            else:
                closure_status = "Surplus (>105%)"
                surplus_pct = closure_pct - 100.0
                uncertainty_flags.append(
                    f"Fluorine mass-balance surplus of {surplus_pct:.1f}%. Indicates potential analytical bias, sample concentration during treatment, or fluoride contamination."
                )
        else:
            closure_status = "Incomplete data"

        # 5. Scientific distinction: Defluorination vs Mineralization
        if defluor_pct is not None and defluor_pct < 30.0 and (inorganic is not None and inorganic > 0):
            uncertainty_flags.append(
                "Low defluorination observed. Note: Parent compound disappearance alone does NOT equate to mineralization or safe destruction (Smith et al., 2024)."
            )

        # 6. Scientific Interpretation
        interpretation_lines = []
        interpretation_lines.append(f"Basis: {initial:.2f} {raw_units} starting fluorine inventory.")
        if defluor_pct is not None:
            interpretation_lines.append(f"• Apparent defluorination: {defluor_pct:.1f}%.")
        else:
            interpretation_lines.append("• Apparent defluorination: MISSING (inorganic fluoride unmeasured).")

        if organic_pct is not None:
            interpretation_lines.append(f"• Remaining organic fluorine: {organic_pct:.1f}%.")
        else:
            interpretation_lines.append("• Remaining organic fluorine: MISSING (extractable/adsorbed organofluorine unmeasured).")

        if closure_pct is not None:
            interpretation_lines.append(f"• Total mass-balance closure: {closure_pct:.1f}% ({closure_status}).")
        else:
            interpretation_lines.append("• Total mass-balance closure: INCOMPLETE DATA (cannot assume unmeasured fractions are zero).")
        
        interpretation_lines.append(
            "Scientific Integrity Note: Mass-balance closure measures conservation of fluorine across analytical phases; "
            "it does NOT constitute proof of carbon-backbone mineralization. Unaccounted fluorine must never be assumed destroyed."
        )

        scientific_interpretation = "\n".join(interpretation_lines)

        # 7. Chart Data (treat missing as 0 only for visualization, with explicit flags)
        unaccounted_val = max(0.0, initial - (accounted_total if can_calculate_closure else 0.0))
        unaccounted_pct = max(0.0, 100.0 - (closure_pct if closure_pct is not None else 0.0))

        chart_data = {
            "categories": ["Inorganic F-", "Remaining Organic F", "Other Identified F", "Unaccounted F"],
            "values": [
                inorganic if inorganic is not None else 0.0,
                organic if organic is not None else 0.0,
                other,
                unaccounted_val if can_calculate_closure else 0.0
            ],
            "units": raw_units,
            "percentages": [
                defluor_pct if defluor_pct is not None else 0.0,
                organic_pct if organic_pct is not None else 0.0,
                (other / initial) * 100.0,
                unaccounted_pct if can_calculate_closure else 0.0
            ],
            "data_completeness": {
                "inorganic_measured": inorganic is not None,
                "organic_measured": organic is not None,
                "closure_evaluable": can_calculate_closure
            }
        }

        return FluorineBalanceCalculateResponse(
            initial_fluorine_inventory=initial,
            inventory_basis_units=raw_units,
            measured_inorganic_fluoride=inorganic,
            remaining_organic_fluorine=organic,
            other_identified_fluorine=other,
            apparent_defluorination_pct=defluor_pct,
            remaining_organic_pct=organic_pct,
            mass_balance_closure_pct=closure_pct,
            closure_status=closure_status,
            uncertainty_flags=uncertainty_flags,
            scientific_interpretation=scientific_interpretation,
            chart_data=chart_data
        )

fluorine_service = FluorineAccountingService()
