# app/routes/analytics.py - Routes for data analysis and optimization features

from flask import Blueprint, render_template, request, jsonify, flash
from flask_login import login_required, current_user
from app import db
from app.models.pricing import Drug, DrugPrice
from app.models.resources import ResourceAllocation
from app.models.outcomes import OutcomeMeasurement, Treatment
from app.models.recommendations import Recommendation, OptimizationInsight
from app.utils.analytics import calculate_price_outcome_ratio, identify_waste, generate_recommendations
import pandas as pd
import json

analytics = Blueprint('analytics', __name__, url_prefix='/analytics')

@analytics.route('/')
@login_required
def index():
    """Analytics dashboard main page"""
    insights = OptimizationInsight.query.order_by(OptimizationInsight.created_at.desc()).limit(10).all()
    
    return render_template('analytics/index.html', insights=insights)

@analytics.route('/price-outcome-analysis')
@login_required
def price_outcome_analysis():
    """Price vs. Outcome Analysis page"""
    treatments = Treatment.query.all()
    outcomes = OutcomeMeasurement.query.distinct(OutcomeMeasurement.outcome_id).all()
    
    return render_template('analytics/price_outcome_analysis.html',
                          treatments=treatments,
                          outcomes=outcomes)

@analytics.route('/price-outcome-data')
@login_required
def price_outcome_data():
    """API endpoint for price vs. outcome data"""
    treatment_id = request.args.get('treatment_id')
    outcome_id = request.args.get('outcome_id')
    
    # Calculate price-outcome ratios based on provided filters
    ratios = calculate_price_outcome_ratio(treatment_id, outcome_id)
    
    return jsonify(ratios)

@analytics.route('/waste-analysis')
@login_required
def waste_analysis():
    """Resource waste analysis page"""
    organizations = ResourceAllocation.query.distinct(ResourceAllocation.organization_id).all()
    
    return render_template('analytics/waste_analysis.html', organizations=organizations)

@analytics.route('/waste-data')
@login_required
def waste_data():
    """API endpoint for waste identification data"""
    organization_id = request.args.get('organization_id')
    
    # Identify waste based on resource allocation patterns
    waste_items = identify_waste(organization_id)
    
    return jsonify(waste_items)

@analytics.route('/generate-recommendations')
@login_required
def generate_recs():
    """Generate optimization recommendations"""
    organization_id = request.args.get('organization_id')
    
    # Generate recommendations based on data analysis
    new_recommendations = generate_recommendations(organization_id)
    
    if new_recommendations:
        flash(f'{len(new_recommendations)} new recommendations generated!', 'success')
    else:
        flash('No new recommendations identified at this time.', 'info')
    
    return jsonify({'success': True, 'count': len(new_recommendations)})

@analytics.route('/insights')
@login_required
def insights():
    """Analytics insights page"""
    insights = OptimizationInsight.query.order_by(OptimizationInsight.created_at.desc()).all()
    
    return render_template('analytics/insights.html', insights=insights)

@analytics.route('/insight/<int:insight_id>')
@login_required
def insight_detail(insight_id):
    """Detail view for a specific analytics insight"""
    insight = OptimizationInsight.query.get_or_404(insight_id)
    
    return render_template('analytics/insight_detail.html', insight=insight)

@analytics.route('/export-data/<data_type>')
@login_required
def export_data(data_type):
    """Export data for analysis"""
    if data_type == 'pricing':
        # Export pricing data
        prices = DrugPrice.query.all()
        data = [
            {
                'drug_id': price.drug_id,
                'drug_name': price.drug.name,
                'region_id': price.region_id,
                'region_name': price.region.name,
                'price': float(price.price),
                'currency': price.currency,
                'date': price.price_date.strftime('%Y-%m-%d')
            }
            for price in prices
        ]
    elif data_type == 'outcomes':
        # Export outcome measurement data
        measurements = OutcomeMeasurement.query.all()
        data = [
            {
                'treatment_id': measurement.treatment_id,
                'treatment_name': measurement.treatment.name if measurement.treatment else '',
                'outcome_id': measurement.outcome_id,
                'outcome_name': measurement.outcome.name,
                'value': float(measurement.value),
                'date': measurement.measurement_date.strftime('%Y-%m-%d') if measurement.measurement_date else ''
            }
            for measurement in measurements
        ]
    elif data_type == 'allocations':
        # Export resource allocation data
        allocations = ResourceAllocation.query.all()
        data = [
            {
                'organization_id': allocation.organization_id,
                'organization_name': allocation.organization.name if allocation.organization else '',
                'department_id': allocation.department_id,
                'department_name': allocation.department.name if allocation.department else '',
                'resource_id': allocation.resource_id,
                'resource_name': allocation.resource.name,
                'quantity': float(allocation.quantity),
                'total_cost': float(allocation.total_cost),
                'date': allocation.allocation_date.strftime('%Y-%m-%d')
            }
            for allocation in allocations
        ]
    else:
        return jsonify({'error': 'Invalid data type'}), 400
    
    return jsonify(data)