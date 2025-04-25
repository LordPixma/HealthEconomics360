# app/routes/dashboard.py - Main dashboard and home routes

from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from app.models.pricing import Drug, DrugPrice, PriceAnalysis
from app.models.resources import Organization, ResourceAllocation
from app.models.outcomes import OutcomeMeasurement
from app.models.recommendations import Recommendation

dashboard = Blueprint('dashboard', __name__)

@dashboard.route('/')
@dashboard.route('/index')
@login_required
def index():
    """Main dashboard page"""
    # Get summary statistics for dashboard
    drug_count = Drug.query.count()
    organization_count = Organization.query.count()
    recommendation_count = Recommendation.query.count()
    
    # Get recent price analyses
    recent_analyses = PriceAnalysis.query.order_by(PriceAnalysis.created_at.desc()).limit(5).all()
    
    # Get top recommendations by impact
    top_recommendations = Recommendation.query.order_by(Recommendation.estimated_impact.desc()).limit(5).all()
    
    return render_template('dashboard/index.html',
                          drug_count=drug_count,
                          organization_count=organization_count,
                          recommendation_count=recommendation_count,
                          recent_analyses=recent_analyses,
                          top_recommendations=top_recommendations)

@dashboard.route('/price-outcome')
@login_required
def price_outcome():
    """Price vs. Outcome Analysis page"""
    drugs = Drug.query.all()
    outcomes = OutcomeMeasurement.query.all()
    
    return render_template('dashboard/price_outcome.html',
                          drugs=drugs,
                          outcomes=outcomes)

@dashboard.route('/resource-optimizer')
@login_required
def resource_optimizer():
    """Resource Allocation Optimizer page"""
    organizations = Organization.query.all()
    resource_allocations = ResourceAllocation.query.all()
    
    return render_template('dashboard/resource_optimizer.html',
                          organizations=organizations,
                          resource_allocations=resource_allocations)

@dashboard.route('/waste-identification')
@login_required
def waste_identification():
    """Waste Identification page"""
    return render_template('dashboard/waste_identification.html')

@dashboard.route('/recommendations')
@login_required
def recommendations():
    """Recommendations Dashboard page"""
    recommendations = Recommendation.query.all()
    
    return render_template('dashboard/recommendations.html',
                          recommendations=recommendations)

@dashboard.route('/dashboard-data')
@login_required
def dashboard_data():
    """API endpoint for dashboard data"""
    # Get data for charts and visualizations
    drug_prices = DrugPrice.query.all()
    outcome_measurements = OutcomeMeasurement.query.all()
    
    # Process data for frontend visualization
    price_data = [{'drug': price.drug.name, 'region': price.region.name, 'price': float(price.price)} 
                  for price in drug_prices]
    outcome_data = [{'treatment': measurement.treatment.name, 
                     'outcome': measurement.outcome.name, 
                     'value': float(measurement.value)} 
                    for measurement in outcome_measurements]
    
    return jsonify({
        'price_data': price_data,
        'outcome_data': outcome_data
    })