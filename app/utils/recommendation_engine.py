# app/utils/recommendation_engine.py - Recommendation generation engine

from app import db
from app.models.pricing import Drug, DrugPrice
from app.models.resources import ResourceAllocation, Organization, Department, Resource
from app.models.outcomes import OutcomeMeasurement, Treatment, Outcome
from app.models.recommendations import Recommendation, RecommendationType, RecommendedAction, OptimizationInsight
from app.utils.analytics import identify_waste, calculate_price_outcome_ratio
import pandas as pd
import numpy as np
from sqlalchemy import func
from datetime import datetime
import json

def generate_price_optimization_recommendations(organization_id=None):
    """
    Generate price optimization recommendations
    
    Args:
        organization_id: Optional organization filter
    
    Returns:
        list: Generated recommendation objects
    """
    recommendations = []
    
    # Find drugs with significant price variations
    drug_prices = db.session.query(
        Drug.id,
        Drug.name,
        func.count(DrugPrice.id).label('price_count'),
        func.min(DrugPrice.price).label('min_price'),
        func.max(DrugPrice.price).label('max_price'),
        func.avg(DrugPrice.price).label('avg_price')
    ).join(DrugPrice).group_by(Drug.id, Drug.name).having(func.count(DrugPrice.id) > 1).all()
    
    for drug in drug_prices:
        # Calculate price range and variation
        price_range = drug.max_price - drug.min_price
        variation_pct = price_range / drug.avg_price if drug.avg_price > 0 else 0
        
        # Only create recommendation if significant variation exists
        if variation_pct > 0.25:  # More than 25% variation
            # Get recommendation type
            rec_type = RecommendationType.query.filter_by(name='Price Optimization').first()
            if not rec_type:
                rec_type = RecommendationType(
                    name='Price Optimization',
                    description='Recommendations for optimizing pharmaceutical pricing',
                    impact_area='cost'
                )
                db.session.add(rec_type)
                db.session.flush()
            
            # Create recommendation
            recommendation = Recommendation(
                title=f"Optimize pricing for {drug.name}",
                description=f"Significant price variation detected for {drug.name}. Prices range from "
                           f"${drug.min_price:.2f} to ${drug.max_price:.2f}, representing a {variation_pct:.0%} variation.",
                type_id=rec_type.id,
                organization_id=organization_id,
                estimated_impact=price_range * 100,  # Assume 100 units purchased
                impact_unit='$',
                confidence_level='High' if variation_pct > 0.5 else 'Medium',
                implementation_difficulty='Low'
            )
            db.session.add(recommendation)
            db.session.flush()
            
            # Add recommended actions
            action1 = RecommendedAction(
                recommendation_id=recommendation.id,
                action=f"Conduct benchmark pricing analysis for {drug.name}",
                order=1,
                responsible_role="Pricing Analyst",
                timeframe="1-2 weeks"
            )
            db.session.add(action1)
            
            action2 = RecommendedAction(
                recommendation_id=recommendation.id,
                action=f"Identify lowest-cost suppliers and negotiate contracts",
                order=2,
                responsible_role="Procurement Manager",
                timeframe="3-4 weeks"
            )
            db.session.add(action2)
            
            action3 = RecommendedAction(
                recommendation_id=recommendation.id,
                action=f"Implement price monitoring system for ongoing optimization",
                order=3,
                responsible_role="IT Department",
                timeframe="4-6 weeks"
            )
            db.session.add(action3)
            
            recommendations.append(recommendation)
    
    return recommendations

def generate_waste_reduction_recommendations(organization_id=None):
    """
    Generate waste reduction recommendations
    
    Args:
        organization_id: Optional organization filter
    
    Returns:
        list: Generated recommendation objects
    """
    recommendations = []
    
    # Get waste identification data
    waste_items = identify_waste(organization_id)
    
    # Group waste by organization/department
    waste_by_org_dept = {}
    for item in waste_items:
        org_name = item['organization']
        dept_name = item['department'] if item['department'] else 'General'
        key = f"{org_name}:{dept_name}"
        
        if key not in waste_by_org_dept:
            waste_by_org_dept[key] = {
                'organization': org_name,
                'department': dept_name,
                'items': [],
                'total_excess': 0
            }
        
        waste_by_org_dept[key]['items'].append(item)
        waste_by_org_dept[key]['total_excess'] += item['excess_cost']
    
    # Create recommendations for each organization/department with significant waste
    for key, waste_data in waste_by_org_dept.items():
        if waste_data['total_excess'] > 1000:  # Only if excess cost is significant
            # Get organization and department
            org = Organization.query.filter_by(name=waste_data['organization']).first()
            dept = None
            if waste_data['department'] != 'General':
                dept = Department.query.filter_by(name=waste_data['department'], organization_id=org.id).first() if org else None
            
            # Get recommendation type
            rec_type = RecommendationType.query.filter_by(name='Waste Reduction').first()
            if not rec_type:
                rec_type = RecommendationType(
                    name='Waste Reduction',
                    description='Recommendations for reducing waste in resource allocation',
                    impact_area='efficiency'
                )
                db.session.add(rec_type)
                db.session.flush()
            
            # Create recommendation
            department_text = f"in {waste_data['department']}" if waste_data['department'] != 'General' else ""
            recommendation = Recommendation(
                title=f"Reduce resource allocation waste {department_text}",
                description=f"Identified potential waste of ${waste_data['total_excess']:.2f} across "
                           f"{len(waste_data['items'])} resources at {waste_data['organization']} {department_text}.",
                type_id=rec_type.id,
                organization_id=org.id if org else None,
                department_id=dept.id if dept else None,
                estimated_impact=waste_data['total_excess'],
                impact_unit='$',
                confidence_level='Medium',
                implementation_difficulty='Medium'
            )
            db.session.add(recommendation)
            db.session.flush()
            
            # Add recommended actions
            action1 = RecommendedAction(
                recommendation_id=recommendation.id,
                action=f"Audit procurement processes for identified resources",
                order=1,
                responsible_role="Operations Manager",
                timeframe="2-3 weeks"
            )
            db.session.add(action1)
            
            # Add specific actions for top waste items
            for i, item in enumerate(sorted(waste_data['items'], 
                                           key=lambda x: x['excess_cost'], 
                                           reverse=True)[:3]):
                action = RecommendedAction(
                    recommendation_id=recommendation.id,
                    action=f"Optimize procurement of {item['resource']} (potential savings: ${item['excess_cost']:.2f})",
                    order=i+2,
                    responsible_role="Resource Manager",
                    timeframe="1-2 months"
                )
                db.session.add(action)
            
            recommendations.append(recommendation)
    
    return recommendations

def generate_outcome_optimization_recommendations(organization_id=None):
    """
    Generate outcome optimization recommendations
    
    Args:
        organization_id: Optional organization filter
    
    Returns:
        list: Generated recommendation objects
    """
    recommendations = []
    
    # Get price-outcome ratios
    ratios = calculate_price_outcome_ratio()
    
    # Group by outcome
    ratios_by_outcome = {}
    for ratio in ratios:
        outcome = ratio['outcome']
        if outcome not in ratios_by_outcome:
            ratios_by_outcome[outcome] = []
        ratios_by_outcome[outcome].append(ratio)
    
    # For each outcome, identify optimization opportunities
    for outcome, outcome_ratios in ratios_by_outcome.items():
        if len(outcome_ratios) >= 2:  # Need at least 2 treatments to compare
            # Sort by ratio (lower is better)
            sorted_ratios = sorted(outcome_ratios, key=lambda x: x['ratio'])
            
            # Get best and worst treatments
            best = sorted_ratios[0]
            worst = sorted_ratios[-1]
            
            # Only create recommendation if significant difference exists
            if worst['ratio'] > (best['ratio'] * 1.5):  # At least 50% worse
                # Get recommendation type
                rec_type = RecommendationType.query.filter_by(name='Outcome Optimization').first()
                if not rec_type:
                    rec_type = RecommendationType(
                        name='Outcome Optimization',
                        description='Recommendations for optimizing healthcare outcomes',
                        impact_area='outcome'
                    )
                    db.session.add(rec_type)
                    db.session.flush()
                
                # Calculate estimated impact (savings if switching from worst to best)
                avg_patients = 100  # Assume 100 patients
                cost_diff = float(worst['cost']) - float(best['cost'])
                estimated_impact = cost_diff * avg_patients
                
                # Create recommendation
                recommendation = Recommendation(
                    title=f"Optimize treatment selection for {outcome}",
                    description=f"Analysis shows {best['treatment']} is more cost-effective for {outcome} "
                               f"than {worst['treatment']}. Cost-effectiveness ratio is {best['ratio']:.2f} "
                               f"vs {worst['ratio']:.2f}.",
                    type_id=rec_type.id,
                    organization_id=organization_id,
                    estimated_impact=estimated_impact,
                    impact_unit='$',
                    confidence_level='Medium',
                    implementation_difficulty='Medium'
                )
                db.session.add(recommendation)
                db.session.flush()
                
                # Add recommended actions
                action1 = RecommendedAction(
                    recommendation_id=recommendation.id,
                    action=f"Review clinical guidelines for {outcome} treatment",
                    order=1,
                    responsible_role="Medical Director",
                    timeframe="1-2 months"
                )
                db.session.add(action1)
                
                action2 = RecommendedAction(
                    recommendation_id=recommendation.id,
                    action=f"Conduct cost-effectiveness analysis comparing {best['treatment']} and {worst['treatment']}",
                    order=2,
                    responsible_role="Health Economics Team",
                    timeframe="2-3 months"
                )
                db.session.add(action2)
                
                action3 = RecommendedAction(
                    recommendation_id=recommendation.id,
                    action=f"Update treatment protocols to prioritize {best['treatment']} where clinically appropriate",
                    order=3,
                    responsible_role="Clinical Committee",
                    timeframe="3-4 months"
                )
                db.session.add(action3)
                
                recommendations.append(recommendation)
    
    return recommendations