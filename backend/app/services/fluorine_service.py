from typing import Dict, Any, List, Optional
from app.schemas import FluorineBalanceCalculateRequest, FluorineBalanceCalculateResponse

class FluorineAccountingService:
    @staticmethod
    def calculate(request: FluorineBalanceCalculateRequest) -> FluorineBalanceCalculateResponse:
        initial = request.initial_fluorine_inventory
        units = request.inventory_basis_units
        inorganic = request.measured_inorganic_fluoride
        organic = request.remaining_organic_fluorine
        other = request.other_identified_fluorine or 0.0

        if initial <= 0:
            raise ValueError("Initial fluorine inventory must be strictly greater than zero.")
        
        if inorganic is not None and inorganic < 0:
            raise ValueError("Measured inorganic fluoride cannot be negative.")
        
        if organic is not None and organic < 0:
            raise ValueError("Remaining organic fluorine cannot be negative.")
            
        if other < 0:
            raise ValueError("Other identified fluorine cannot be negative.")

        uncertainty_flags: List[str] = []
        defluor_pct: Optional[float] = None
        organic_pct: Optional[float] = None
        closure_pct: Optional[float] = None
        closure_status: str = "Incomplete data"

        # 1. Defluorination Calculation
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

        # 2. Remaining Organic Fluorine Calculation
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

        # 3. Mass-Balance Closure Calculation
        accounted_total: float = 0.0
        can_calculate_closure = True

        if inorganic is not None:
            accounted_total += inorganic
        else:
            can_calculate_closure = False

        if organic is not None:
            accounted_total += organic
        else:
            can_calculate_closure = False

        accounted_total += other

        if can_calculate_closure:
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

        # Mineralization and byproduct caution
        if defluor_pct is not None and defluor_pct < 30.0 and (inorganic is not None and inorganic > 0):
            uncertainty_flags.append(
                "Low defluorination observed. Note: Parent compound disappearance alone does NOT equate to mineralization or safe destruction (Smith et al., 2024)."
            )

        # Scientific Interpretation
        interpretation_lines = []
        interpretation_lines.append(f"Basis: {initial:.2f} {units} starting fluorine inventory.")
        if defluor_pct is not None:
            interpretation_lines.append(f"• Apparent defluorination: {defluor_pct:.1f}%.")
        if organic_pct is not None:
            interpretation_lines.append(f"• Remaining organic fluorine: {organic_pct:.1f}%.")
        if closure_pct is not None:
            interpretation_lines.append(f"• Total mass-balance closure: {closure_pct:.1f}% ({closure_status}).")
        else:
            interpretation_lines.append("• Mass-balance closure is incomplete due to unmeasured fractions.")
        
        interpretation_lines.append(
            "Important: Defluorination measures F- release into solution; it does not measure carbon-backbone mineralization. Unaccounted fluorine must not be assumed destroyed."
        )

        scientific_interpretation = "\n".join(interpretation_lines)

        # Chart Data
        chart_data = {
            "categories": ["Inorganic F-", "Remaining Organic F", "Other Identified F", "Unaccounted F"],
            "values": [
                inorganic if inorganic is not None else 0.0,
                organic if organic is not None else 0.0,
                other,
                max(0.0, initial - (accounted_total if can_calculate_closure else 0.0))
            ],
            "units": units,
            "percentages": [
                defluor_pct if defluor_pct is not None else 0.0,
                organic_pct if organic_pct is not None else 0.0,
                (other / initial) * 100.0,
                max(0.0, 100.0 - (closure_pct if closure_pct is not None else 0.0))
            ]
        }

        return FluorineBalanceCalculateResponse(
            initial_fluorine_inventory=initial,
            inventory_basis_units=units,
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
