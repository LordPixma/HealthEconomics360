# app/utils/analytics.py - Analytics and calculation functions for data processing

from app import db
from app.models.pricing import Drug, DrugPrice
from app.models.resources import ResourceAllocation, Organization, Department
from app.models.outcomes import OutcomeMeasurement, Treatment
from app.models.recommendations import Recommendation, RecommendationType, RecommendedAction, OptimizationInsight
import pandas as pd
import numpy as np
from sqlalchemy import func
from datetime import datetime

def calculate_price_outcome_ratio(treatment_id=None, outcome_id=None):
    """
    Calculate price-to-outcome ratios for treatments
    
    Args:
        treatment_id: Optional filter for specific treatment
        outcome_id: Optional filter for specific outcome
    
    Returns:
        List of price-outcome ratio dictionaries
    """
    # Build query for outcomes
    outcome_query = OutcomeMeasurement.query
    
    if treatment_id:
        outcome_query = outcome_query.filter(OutcomeMeasurement.treatment_id == treatment_id)
    
    if outcome_id:
        outcome_query = outcome_query.filter(OutcomeMeasurement.outcome_id == outcome_id)
    
    outcomes = outcome_query.all()
    
    # Calculate ratios
    ratios = []
    for outcome in outcomes:
        if outcome.treatment and outcome.treatment.average_cost and outcome.value:
            ratio = float(outcome.treatment.average_cost) / float(outcome.value)
            
            # Check if higher value is better, if not, invert the ratio
            if not outcome.outcome.higher_is_better:
                ratio = 1 / ratio if ratio != 0 else float('inf')
            
            ratios.append({
                'treatment': outcome.treatment.name,
                'outcome': outcome.outcome.name,
                'measurement': float(outcome.value),
                'cost': float(outcome.treatment.average_cost),
                'ratio': ratio,
                'organization': outcome.organization.name if outcome.organization else None
            })
    
    # Sort by ratio (lower is better)
    ratios.sort(key=lambda x: x['ratio'])
    
    return ratios

def identify_waste(organization_id=None):
    """
    Identify potential waste in resource allocation
    
    Args:
        organization_id: Optional filter for specific organization
    
    Returns:
        List of waste identification dictionaries
    """
    # Build query for resource allocations
    query = ResourceAllocation.query
    
    if organization_id:
        query = query.filter(ResourceAllocation.organization_id == organization_id)
    
    allocations = query.all()
    
    # Convert to DataFrame for analysis
    df = pd.DataFrame([
        {
            'organization_id': a.organization_id,
            'organization_name': a.organization.name if a.organization else None,
            'department_id': a.department_id,
            'department_name': a.department.name if a.department else None,
            'resource_id': a.resource_id,
            'resource_name': a.resource.name,
            'quantity': float(a.quantity),
            'total_cost': float(a.total_cost),
            'unit_cost': float(a.total_cost) / float(a.quantity) if a.quantity else 0,
            'fiscal_year': a.fiscal_year
        }
        for a in allocations
    ])
    
    waste_items = []
    
    if not df.empty:
        # Identify potential waste based on deviation from average unit cost
        resource_groups = df.groupby(['resource_id', 'resource_name'])
        
        for (resource_id, resource_name), group in resource_groups:
            avg_unit_cost = group['unit_cost'].mean()
            std_unit_cost = group['unit_cost'].std()
            
            # Find allocations with unit cost significantly higher than average
            if std_unit_cost > 0:
                high_cost_allocations = group[group['unit_cost'] > (avg_unit_cost + 1.5 * std_unit_cost)]
                
                for _, row in high_cost_allocations.iterrows():
                    excess_cost = (row['unit_cost'] - avg_unit_cost) * row['quantity']
                    waste_items.append({
                        'organization': row['organization_name'],
                        'department': row['department_name'],
                        'resource': resource_name,
                        'actual_unit_cost': row['unit_cost'],
                        'average_unit_cost': avg_unit_cost,
                        'quantity': row['quantity'],
                        'excess_cost': excess_cost,
                        'fiscal_year': row['fiscal_year']
                    })
    
    # Sort by excess cost (higher potential waste first)
    waste_items.sort(key=lambda x: x['excess_cost'], reverse=True)
    
    return waste_items

def generate_recommendations(organization_id=None):
    """
    Generate optimization recommendations based on data analysis
    
    Args:
        organization_id: Optional filter for specific organization
    
    Returns:
        List of newly created recommendation objects
    """
    new_recommendations = []
    
    # Generate price-based recommendations
    price_recs = generate_price_recommendations(organization_id)
    new_recommendations.extend(price_recs)
    
    # Generate resource allocation recommendations
    resource_recs = generate_resource_recommendations(organization_id)
    new_recommendations.extend(resource_recs)
    
    # Generate outcome-based recommendations
    outcome_recs = generate_outcome_recommendations(organization_id)
    new_recommendations.extend(outcome_recs)
    
    return new_recommendations

def generate_price_recommendations(organization_id=None):
    """Generate recommendations based on price analysis"""
    recommendations = []
    
    # Find drugs with high price variance
    drug_prices = db.session.query(
        Drug.id,
        Drug.name,
        func.min(DrugPrice.price).label('min_price'),
        func.max(DrugPrice.price).label('max_price'),
        func.avg(DrugPrice.price).label('avg_price')
    ).join(DrugPrice).group_by(Drug.id, Drug.name).all()
    
    for drug in drug_prices:
        price_range = drug.max_price - drug.min_price
        
        # If significant price range, create recommendation
        if price_range > (drug.avg_price * 0.5):  # More than 50% variation
            # Get recommendation type for price optimization
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
                title=f"Optimize procurement for {drug.name}",
                description=f"Significant price variance detected for {drug.name}. Prices range from "
                           f"{drug.min_price:.2f} to {drug.max_price:.2f} ({price_range/drug.avg_price:.0%} variation).",
                type_id=rec_type.id,
                organization_id=organization_id,
                estimated_impact=price_range,
                impact_unit='$ per unit',
                confidence_level='High' if price_range > drug.avg_price else 'Medium',
                implementation_difficulty='Low'
            )
            db.session.add(recommendation)
            db.session.flush()
            
            # Add recommended actions
            action1 = RecommendedAction(
                recommendation_id=recommendation.id,
                action=f"Identify lowest-cost supplier for {drug.name}",
                order=1,
                responsible_role="Procurement Manager",
                timeframe="1-2 weeks"
            )
            db.session.add(action1)
            
            action2 = RecommendedAction(
                recommendation_id=recommendation.id,
                action=f"Negotiate with current suppliers using price benchmark data",
                order=2,
                responsible_role="Procurement Manager",
                timeframe="2-4 weeks"
            )
            db.session.add(action2)
            
            # Add optimization insight
            insight = OptimizationInsight(
                title=f"Price disparity for {drug.name}",
                description=f"Analysis has identified significant price variation for {drug.name} across suppliers.",
                insight_type="pricing",
                data={
                    'drug_id': drug.id,
                    'drug_name': drug.name,
                    'min_price': float(drug.min_price),
                    'max_price': float(drug.max_price),
                    'avg_price': float(drug.avg_price),
                    'variation_pct': float(price_range/drug.avg_price)
                },
                organization_id=organization_id
            )
            db.session.add(insight)
            
            recommendations.append(recommendation)
    
    db.session.commit()
    return recommendations

def generate_resource_recommendations(organization_id=None):
    """Generate recommendations based on resource allocation analysis"""
    recommendations = []
    
    # Identify waste items
    waste_items = identify_waste(organization_id)
    
    # Group waste by organization and department
    waste_by_dept = {}
    for item in waste_items:
        org = item['organization']
        dept = item['department']
        key = f"{org}|{dept}"
        
        if key not in waste_by_dept:
            waste_by_dept[key] = []
        
        waste_by_dept[key].append(item)
    
    # Create recommendations for departments with significant waste
    for key, items in waste_by_dept.items():
        if len(items) >= 2:  # If multiple waste items for same department
            org_name, dept_name = key.split('|')
            
            # Calculate total excess cost
            total_excess = sum(item['excess_cost'] for item in items)
            
            if total_excess > 0:
                # Get organization and department IDs
                org = Organization.query.filter_by(name=org_name).first()
                dept = Department.query.filter_by(name=dept_name, organization_id=org.id).first() if org else None
                
                # Get recommendation type for resource optimization
                rec_type = RecommendationType.query.filter_by(name='Resource Optimization').first()
                if not rec_type:
                    rec_type = RecommendationType(
                        name='Resource Optimization',
                        description='Recommendations for optimizing resource allocation',
                        impact_area='efficiency'
                    )
                    db.session.add(rec_type)
                    db.session.flush()
                
                # Create recommendation
                recommendation = Recommendation(
                    title=f"Optimize resource allocation in {dept_name if dept_name else org_name}",
                    description=f"Identified potential excess spending of ${total_excess:.2f} across "
                               f"{len(items)} resource categories.",
                    type_id=rec_type.id,
                    organization_id=org.id if org else None,
                    department_id=dept.id if dept else None,
                    estimated_impact=total_excess,
                    impact_unit='$',
                    confidence_level='Medium',
                    implementation_difficulty='Medium',
                    implementation_time='Medium-term'
                )
                db.session.add(recommendation)
                db.session.flush()
                
                # Add recommended actions
                action1 = RecommendedAction(
                    recommendation_id=recommendation.id,
                    action=f"Review procurement practices for identified resources",
                    order=1,
                    responsible_role="Department Manager",
                    timeframe="2-4 weeks"
                )
                db.session.add(action1)
                
                action2 = RecommendedAction(
                    recommendation_id=recommendation.id,
                    action=f"Consolidate purchasing to leverage volume discounts",
                    order=2,
                    responsible_role="Procurement Manager",
                    timeframe="1-3 months"
                )
                db.session.add(action2)
                
                # Add resource-specific actions for top waste items
                for i, item in enumerate(sorted(items, key=lambda x: x['excess_cost'], reverse=True)[:3]):
                    action = RecommendedAction(
                        recommendation_id=recommendation.id,
                        action=f"Optimize procurement of {item['resource']} (potential savings: ${item['excess_cost']:.2f})",
                        order=i+3,
                        responsible_role="Resource Manager",
                        timeframe="1-2 months"
                    )
                    db.session.add(action)
                
                # Add optimization insight
                insight = OptimizationInsight(
                    title=f"Resource allocation inefficiencies in {dept_name if dept_name else org_name}",
                    description=f"Analysis has identified potential excess spending of ${total_excess:.2f} across multiple resource categories.",
                    insight_type="resource",
                    data={
                        'organization': org_name,
                        'department': dept_name,
                        'total_excess_cost': float(total_excess),
                        'resource_count': len(items),
                        'resources': [{'name': item['resource'], 'excess_cost': float(item['excess_cost'])} 
                                     for item in sorted(items, key=lambda x: x['excess_cost'], reverse=True)]
                    },
                    organization_id=org.id if org else None
                )
                db.session.add(insight)
                
                recommendations.append(recommendation)
    
    db.session.commit()
    return recommendations

def generate_outcome_recommendations(organization_id=None):
    """Generate recommendations based on outcome analysis"""
    recommendations = []
    
    # Calculate price-outcome ratios
    ratios = calculate_price_outcome_ratio()
    
    # Group by outcome
    outcome_groups = {}
    for ratio in ratios:
        outcome = ratio['outcome']
        if outcome not in outcome_groups:
            outcome_groups[outcome] = []
        outcome_groups[outcome].append(ratio)
    
    # Find outcomes with significant treatment variations
    for outcome, treatments in outcome_groups.items():
        if len(treatments) > 1:
            # Sort by ratio (assuming lower is better)
            sorted_treatments = sorted(treatments, key=lambda x: x['ratio'])
            
            # If significant difference between best and worst
            if len(sorted_treatments) >= 2:
                best = sorted_treatments[0]
                worst = sorted_treatments[-1]
                
                if worst['ratio'] > (best['ratio'] * 2):  # At least 100% worse
                    # Get organization if specified
                    org = None
                    if organization_id:
                        org = Organization.query.get(organization_id)
                        
                        # Only create recommendation if relevant to this organization
                        if not any(t.get('organization') == org.name for t in treatments):
                            continue
                    
                    # Get recommendation type for outcome optimization
                    rec_type = RecommendationType.query.filter_by(name='Outcome Optimization').first()
                    if not rec_type:
                        rec_type = RecommendationType(
                            name='Outcome Optimization',
                            description='Recommendations for optimizing treatment outcomes',
                            impact_area='outcome'
                        )
                        db.session.add(rec_type)
                        db.session.flush()
                    
                    # Calculate potential impact
                    potential_savings = (worst['cost'] - best['cost']) * 10  # Assume 10 treatments
                    
                    # Create recommendation
                    recommendation = Recommendation(
                        title=f"Optimize treatment selection for {outcome}",
                        description=f"Significant variation in cost-effectiveness detected for {outcome} treatments. "
                                   f"{best['treatment']} provides better value than {worst['treatment']}.",
                        type_id=rec_type.id,
                        organization_id=organization_id,
                        estimated_impact=potential_savings,
                        impact_unit='$',
                        confidence_level='Medium',
                        implementation_difficulty='Medium',
                        implementation_time='Medium-term'
                    )
                    db.session.add(recommendation)
                    db.session.flush()
                    
                    # Add recommended actions
                    action1 = RecommendedAction(
                        recommendation_id=recommendation.id,
                        action=f"Review clinical protocols for {outcome} treatments",
                        order=1,
                        responsible_role="Clinical Director",
                        timeframe="1-2 months"
                    )
                    db.session.add(action1)
                    
                    action2 = RecommendedAction(
                        recommendation_id=recommendation.id,
                        action=f"Evaluate switching from {worst['treatment']} to {best['treatment']} where clinically appropriate",
                        order=2,
                        responsible_role="Medical Committee",
                        timeframe="2-3 months"
                    )
                    db.session.add(action2)
                    
                    # Add optimization insight
                    insight = OptimizationInsight(
                        title=f"Treatment optimization opportunity for {outcome}",
                        description=f"Analysis has identified significant cost-effectiveness variation among treatments for {outcome}.",
                        insight_type="outcome",
                        data={
                            'outcome': outcome,
                            'best_treatment': {
                                'name': best['treatment'],
                                'cost': float(best['cost']),
                                'effectiveness': float(best['measurement']),
                                'ratio': float(best['ratio'])
                            },
                            'worst_treatment': {
                                'name': worst['treatment'],
                                'cost': float(worst['cost']),
                                'effectiveness': float(worst['measurement']),
                                'ratio': float(worst['ratio'])
                            },
                            'potential_savings': float(potential_savings)
                        },
                        organization_id=organization_id
                    )
                    db.session.add(insight)
                    
                    recommendations.append(recommendation)
    
    db.session.commit()
    return recommendations