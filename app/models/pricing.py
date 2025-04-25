# app/models/pricing.py - Models for pharmaceutical pricing data and analysis

from datetime import datetime
from app import db

class DrugCategory(db.Model):
    """Categories of pharmaceutical drugs"""
    __tablename__ = 'drug_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    drugs = db.relationship('Drug', backref='category', lazy='dynamic')
    
    def __repr__(self):
        return f'<DrugCategory {self.name}>'

class Drug(db.Model):
    """Pharmaceutical drug information"""
    __tablename__ = 'drugs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    generic_name = db.Column(db.String(120))
    description = db.Column(db.Text)
    manufacturer = db.Column(db.String(120))
    category_id = db.Column(db.Integer, db.ForeignKey('drug_categories.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    prices = db.relationship('DrugPrice', backref='drug', lazy='dynamic')
    
    def __repr__(self):
        return f'<Drug {self.name}>'

class Region(db.Model):
    """Geographic regions for price comparison"""
    __tablename__ = 'regions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    country = db.Column(db.String(100))
    code = db.Column(db.String(20))
    
    # Relationships
    prices = db.relationship('DrugPrice', backref='region', lazy='dynamic')
    
    def __repr__(self):
        return f'<Region {self.name}>'

class DrugPrice(db.Model):
    """Price data for drugs across different regions"""
    __tablename__ = 'drug_prices'
    
    id = db.Column(db.Integer, primary_key=True)
    drug_id = db.Column(db.Integer, db.ForeignKey('drugs.id'), nullable=False)
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id'), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    price_date = db.Column(db.Date, nullable=False)
    price_type = db.Column(db.String(50))  # retail, wholesale, negotiated, etc.
    source = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<DrugPrice {self.drug_id} in {self.region_id}: {self.price}>'

class PriceAnalysis(db.Model):
    """Analysis of price disparities and trends"""
    __tablename__ = 'price_analyses'
    
    id = db.Column(db.Integer, primary_key=True)
    drug_id = db.Column(db.Integer, db.ForeignKey('drugs.id'))
    analysis_type = db.Column(db.String(50))  # disparity, trend, markup
    analysis_data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<PriceAnalysis {self.analysis_type} for drug {self.drug_id}>'