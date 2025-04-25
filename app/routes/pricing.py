# app/routes/pricing.py - Routes for pharmaceutical pricing features

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from app import db
from app.models.pricing import Drug, DrugCategory, Region, DrugPrice, PriceAnalysis

pricing = Blueprint('pricing', __name__, url_prefix='/pricing')

@pricing.route('/')
@login_required
def index():
    """Pricing overview page"""
    drugs = Drug.query.all()
    regions = Region.query.all()
    
    return render_template('pricing/index.html',
                          drugs=drugs,
                          regions=regions)

@pricing.route('/drugs')
@login_required
def drugs():
    """Drug list and management page"""
    drugs = Drug.query.all()
    categories = DrugCategory.query.all()
    
    return render_template('pricing/drugs.html',
                          drugs=drugs,
                          categories=categories)

@pricing.route('/add-drug', methods=['GET', 'POST'])
@login_required
def add_drug():
    """Add new drug record"""
    categories = DrugCategory.query.all()
    
    if request.method == 'POST':
        name = request.form.get('name')
        generic_name = request.form.get('generic_name')
        description = request.form.get('description')
        manufacturer = request.form.get('manufacturer')
        category_id = request.form.get('category_id')
        
        new_drug = Drug(
            name=name,
            generic_name=generic_name,
            description=description,
            manufacturer=manufacturer,
            category_id=category_id
        )
        
        db.session.add(new_drug)
        db.session.commit()
        
        flash('Drug added successfully!', 'success')
        return redirect(url_for('pricing.drugs'))
    
    return render_template('pricing/add_drug.html', categories=categories)

@pricing.route('/prices')
@login_required
def prices():
    """Drug price list and management page"""
    prices = DrugPrice.query.all()
    drugs = Drug.query.all()
    regions = Region.query.all()
    
    return render_template('pricing/prices.html',
                          prices=prices,
                          drugs=drugs,
                          regions=regions)

@pricing.route('/add-price', methods=['GET', 'POST'])
@login_required
def add_price():
    """Add new drug price record"""
    drugs = Drug.query.all()
    regions = Region.query.all()
    
    if request.method == 'POST':
        drug_id = request.form.get('drug_id')
        region_id = request.form.get('region_id')
        price = request.form.get('price')
        currency = request.form.get('currency')
        price_date = request.form.get('price_date')
        price_type = request.form.get('price_type')
        source = request.form.get('source')
        
        new_price = DrugPrice(
            drug_id=drug_id,
            region_id=region_id,
            price=price,
            currency=currency,
            price_date=price_date,
            price_type=price_type,
            source=source
        )
        
        db.session.add(new_price)
        db.session.commit()
        
        flash('Price data added successfully!', 'success')
        return redirect(url_for('pricing.prices'))
    
    return render_template('pricing/add_price.html', drugs=drugs, regions=regions)

@pricing.route('/analysis')
@login_required
def analysis():
    """Price analysis and comparisons page"""
    analyses = PriceAnalysis.query.all()
    
    return render_template('pricing/analysis.html', analyses=analyses)

@pricing.route('/price-data')
@login_required
def price_data():
    """API endpoint for price data"""
    drug_id = request.args.get('drug_id')
    
    if drug_id:
        # Get prices for specific drug
        prices = DrugPrice.query.filter_by(drug_id=drug_id).all()
    else:
        # Get all prices
        prices = DrugPrice.query.all()
    
    price_data = [
        {
            'drug': price.drug.name,
            'drug': price.drug.name,
            'region': price.region.name,
            'price': float(price.price),
            'currency': price.currency,
            'date': price.price_date.strftime('%Y-%m-%d'),
            'type': price.price_type
        }
        for price in prices
    ]
    
    return jsonify(price_data)