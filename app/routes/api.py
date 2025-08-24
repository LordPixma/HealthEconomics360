# app/routes/api.py - API endpoints for external integration and data access

from flask import Blueprint, jsonify, request
from flask_login import login_required
from app import db
from app.models.pricing import Drug, DrugPrice, Region
from app.models.resources import Organization, ResourceAllocation
from app.models.outcomes import OutcomeMeasurement
from app.models.recommendations import Recommendation
import datetime

api = Blueprint('api', __name__, url_prefix='/api')

@api.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Basic database connectivity check
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'service': 'HealthEconomics360'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy', 
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'error': str(e)
        }), 500

@api.route('/drugs')
@login_required
def get_drugs():
    """API endpoint to retrieve drug data"""
    drugs = Drug.query.all()
    
    result = [
        {
            'id': drug.id,
            'name': drug.name,
            'generic_name': drug.generic_name,
            'manufacturer': drug.manufacturer,
            'category': drug.category.name if drug.category else None
        }
        for drug in drugs
    ]
    
    return jsonify(result)

@api.route('/drug/<int:drug_id>')
@login_required
def get_drug(drug_id):
    """API endpoint to retrieve a specific drug"""
    drug = Drug.query.get_or_404(drug_id)
    
    result = {
        'id': drug.id,
        'name': drug.name,
        'generic_name': drug.generic_name,
        'description': drug.description,
        'manufacturer': drug.manufacturer,
        'category': drug.category.name if drug.category else None
    }
    
    return jsonify(result)

@api.route('/drug-prices')
@login_required
def get_drug_prices():
    """API endpoint to retrieve drug price data"""
    # Parse query parameters
    drug_id = request.args.get('drug_id', type=int)
    region_id = request.args.get('region_id', type=int)
    
    # Build query based on parameters
    query = DrugPrice.query
    
    if drug_id:
        query = query.filter(DrugPrice.drug_id == drug_id)
    
    if region_id:
        query = query.filter(DrugPrice.region_id == region_id)
    
    prices = query.all()
    
    result = [
        {
            'id': price.id,
            'drug': {
                'id': price.drug.id,
                'name': price.drug.name
            },
            'region': {
                'id': price.region.id,
                'name': price.region.name,
                'country': price.region.country
            },
            'price': float(price.price),
            'currency': price.currency,
            'date': price.price_date.strftime('%Y-%m-%d')
        }
        for price in prices
    ]
    
    return jsonify(result)

@api.route('/organizations')
@login_required
def get_organizations():
    """API endpoint to retrieve organization data"""
    organizations = Organization.query.all()
    
    result = [
        {
            'id': org.id,
            'name': org.name,
            'type': org.type,
            'location': f"{org.city}, {org.state}, {org.country}" if org.city and org.state and org.country else None
        }
        for org in organizations
    ]
    
    return jsonify(result)

@api.route('/allocations')
@login_required
def get_allocations():
    """API endpoint to retrieve resource allocation data"""
    # Parse query parameters
    organization_id = request.args.get('organization_id', type=int)
    
    # Build query based on parameters
    query = ResourceAllocation.query
    
    if organization_id:
        query = query.filter(ResourceAllocation.organization_id == organization_id)
    
    allocations = query.all()
    
    result = [
        {
            'id': alloc.id,
            'organization': alloc.organization.name if alloc.organization else None,
            'department': alloc.department.name if alloc.department else None,
            'resource': alloc.resource.name,
            'quantity': float(alloc.quantity),
            'total_cost': float(alloc.total_cost),
            'fiscal_year': alloc.fiscal_year
        }
        for alloc in allocations
    ]
    
    return jsonify(result)

@api.route('/outcomes')
@login_required
def get_outcomes():
    """API endpoint to retrieve outcome measurement data"""
    measurements = OutcomeMeasurement.query.all()
    
    result = [
        {
            'id': measure.id,
            'outcome': measure.outcome.name,
            'treatment': measure.treatment.name if measure.treatment else None,
            'organization': measure.organization.name if measure.organization else None,
            'value': float(measure.value),
            'sample_size': measure.sample_size,
            'date': measure.measurement_date.strftime('%Y-%m-%d') if measure.measurement_date else None
        }
        for measure in measurements
    ]
    
    return jsonify(result)

@api.route('/recommendations')
@login_required
def get_recommendations():
    """API endpoint to retrieve optimization recommendations"""
    # Parse query parameters
    organization_id = request.args.get('organization_id', type=int)
    
    # Build query based on parameters
    query = Recommendation.query
    
    if organization_id:
        query = query.filter(Recommendation.organization_id == organization_id)
    
    recommendations = query.all()
    
    result = [
        {
            'id': rec.id,
            'title': rec.title,
            'description': rec.description,
            'type': rec.type.name if rec.type else None,
            'organization': rec.organization.name if rec.organization else None,
            'department': rec.department.name if rec.department else None,
            'estimated_impact': float(rec.estimated_impact) if rec.estimated_impact else None,
            'impact_unit': rec.impact_unit,
            'implementation_difficulty': rec.implementation_difficulty
        }
        for rec in recommendations
    ]
    
    return jsonify(result)

@api.route('/dashboard-summary')
@login_required
def dashboard_summary():
    """API endpoint for dashboard summary data"""
    # Get counts for summary statistics
    drug_count = Drug.query.count()
    organization_count = Organization.query.count()
    recommendation_count = Recommendation.query.count()
    
    # Get average price comparison
    regions = Region.query.all()
    price_comparisons = []
    
    for region in regions:
        avg_price = db.session.query(db.func.avg(DrugPrice.price)) \
                           .filter(DrugPrice.region_id == region.id) \
                           .scalar()
        if avg_price:
            price_comparisons.append({
                'region': region.name,
                'avg_price': float(avg_price)
            })
    
    # Get resource allocation summary
    total_allocation = db.session.query(db.func.sum(ResourceAllocation.total_cost)).scalar()
    total_allocation = float(total_allocation) if total_allocation else 0
    
    result = {
        'counts': {
            'drugs': drug_count,
            'organizations': organization_count,
            'recommendations': recommendation_count
        },
        'price_comparisons': price_comparisons,
        'total_allocation': total_allocation,
        'timestamp': datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    return jsonify(result)