# app/models/resources.py - Models for healthcare resource allocation and utilization

from datetime import datetime
from app import db

class Organization(db.Model):
    """Healthcare organization entity"""
    __tablename__ = 'organizations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(50))  # hospital, clinic, pharmacy, etc.
    description = db.Column(db.Text)
    address = db.Column(db.String(255))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    country = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    departments = db.relationship('Department', backref='organization', lazy='dynamic')
    resource_allocations = db.relationship('ResourceAllocation', backref='organization', lazy='dynamic')
    
    def __repr__(self):
        return f'<Organization {self.name}>'

class Department(db.Model):
    """Departments within healthcare organizations"""
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    budget = db.Column(db.Numeric(14, 2))
    staff_count = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    resource_allocations = db.relationship('ResourceAllocation', backref='department', lazy='dynamic')
    
    def __repr__(self):
        return f'<Department {self.name} at {self.organization_id}>'

class ResourceCategory(db.Model):
    """Categories of healthcare resources"""
    __tablename__ = 'resource_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    resources = db.relationship('Resource', backref='category', lazy='dynamic')
    
    def __repr__(self):
        return f'<ResourceCategory {self.name}>'

class Resource(db.Model):
    """Healthcare resources (staff, equipment, supplies, etc.)"""
    __tablename__ = 'resources'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('resource_categories.id'))
    unit_cost = db.Column(db.Numeric(10, 2))
    unit_type = db.Column(db.String(50))  # hour, item, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    allocations = db.relationship('ResourceAllocation', backref='resource', lazy='dynamic')
    
    def __repr__(self):
        return f'<Resource {self.name}>'

class ResourceAllocation(db.Model):
    """Allocation of resources to departments/organizations"""
    __tablename__ = 'resource_allocations'
    
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'))
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    resource_id = db.Column(db.Integer, db.ForeignKey('resources.id'))
    quantity = db.Column(db.Numeric(10, 2))
    total_cost = db.Column(db.Numeric(14, 2))
    allocation_date = db.Column(db.Date, default=datetime.utcnow)
    fiscal_year = db.Column(db.String(9))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ResourceAllocation {self.resource_id} to {self.department_id if self.department_id else self.organization_id}>'