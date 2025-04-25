# app/models/recommendations.py - Models for optimization recommendations and insights

from datetime import datetime
from app import db

class RecommendationType(db.Model):
    """Types of optimization recommendations"""
    __tablename__ = 'recommendation_types'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    impact_area = db.Column(db.String(100))  # cost, outcome, efficiency
    
    # Relationships
    recommendations = db.relationship('Recommendation', backref='type', lazy='dynamic')
    
    def __repr__(self):
        return f'<RecommendationType {self.name}>'

class Recommendation(db.Model):
    """Healthcare cost and resource optimization recommendations"""
    __tablename__ = 'recommendations'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    type_id = db.Column(db.Integer, db.ForeignKey('recommendation_types.id'))
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'))
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    estimated_impact = db.Column(db.Numeric(14, 2))
    impact_unit = db.Column(db.String(50))  # $, %, etc.
    confidence_level = db.Column(db.String(50))  # high, medium, low
    implementation_difficulty = db.Column(db.String(50))  # high, medium, low
    implementation_time = db.Column(db.String(50))  # short-term, medium-term, long-term
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    actions = db.relationship('RecommendedAction', backref='recommendation', lazy='dynamic')
    
    def __repr__(self):
        return f'<Recommendation {self.title}>'

class RecommendedAction(db.Model):
    """Specific actions to implement recommendations"""
    __tablename__ = 'recommended_actions'
    
    id = db.Column(db.Integer, primary_key=True)
    recommendation_id = db.Column(db.Integer, db.ForeignKey('recommendations.id'), nullable=False)
    action = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer)
    responsible_role = db.Column(db.String(100))
    timeframe = db.Column(db.String(100))
    
    def __repr__(self):
        return f'<RecommendedAction for {self.recommendation_id}>'

class OptimizationInsight(db.Model):
    """Insights derived from data analysis for optimization"""
    __tablename__ = 'optimization_insights'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    insight_type = db.Column(db.String(50))  # pricing, resource, outcome
    data = db.Column(db.JSON)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<OptimizationInsight {self.title}>'