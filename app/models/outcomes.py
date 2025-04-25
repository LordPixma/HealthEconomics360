# app/models/outcomes.py - Models for healthcare outcomes and effectiveness data

from datetime import datetime
from app import db

class OutcomeCategory(db.Model):
    """Categories of healthcare outcomes"""
    __tablename__ = 'outcome_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    outcomes = db.relationship('Outcome', backref='category', lazy='dynamic')
    
    def __repr__(self):
        return f'<OutcomeCategory {self.name}>'

class Outcome(db.Model):
    """Healthcare outcome metrics"""
    __tablename__ = 'outcomes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('outcome_categories.id'))
    measurement_unit = db.Column(db.String(50))
    higher_is_better = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    measurements = db.relationship('OutcomeMeasurement', backref='outcome', lazy='dynamic')
    
    def __repr__(self):
        return f'<Outcome {self.name}>'

class Treatment(db.Model):
    """Medical treatments and procedures"""
    __tablename__ = 'treatments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    drug_id = db.Column(db.Integer, db.ForeignKey('drugs.id'))
    average_cost = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    measurements = db.relationship('OutcomeMeasurement', backref='treatment', lazy='dynamic')
    
    def __repr__(self):
        return f'<Treatment {self.name}>'

class OutcomeMeasurement(db.Model):
    """Measurements of healthcare outcomes for specific treatments"""
    __tablename__ = 'outcome_measurements'
    
    id = db.Column(db.Integer, primary_key=True)
    outcome_id = db.Column(db.Integer, db.ForeignKey('outcomes.id'), nullable=False)
    treatment_id = db.Column(db.Integer, db.ForeignKey('treatments.id'))
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'))
    value = db.Column(db.Numeric(10, 2), nullable=False)
    confidence_interval = db.Column(db.String(50))
    sample_size = db.Column(db.Integer)
    measurement_date = db.Column(db.Date)
    source = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<OutcomeMeasurement {self.outcome_id} for {self.treatment_id}: {self.value}>'