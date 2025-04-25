# app/routes/resources.py - Routes for resource allocation and management

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from app import db
from app.models.resources import Organization, Department, Resource, ResourceCategory, ResourceAllocation

resources = Blueprint('resources', __name__, url_prefix='/resources')

@resources.route('/')
@login_required
def index():
    """Resource allocation overview page"""
    organizations = Organization.query.all()
    resource_categories = ResourceCategory.query.all()
    
    return render_template('resources/index.html',
                          organizations=organizations,
                          resource_categories=resource_categories)

@resources.route('/organizations')
@login_required
def organizations():
    """Organizations list and management page"""
    organizations = Organization.query.all()
    
    return render_template('resources/organizations.html',
                          organizations=organizations)

@resources.route('/add-organization', methods=['GET', 'POST'])
@login_required
def add_organization():
    """Add new organization record"""
    if request.method == 'POST':
        name = request.form.get('name')
        org_type = request.form.get('type')
        description = request.form.get('description')
        address = request.form.get('address')
        city = request.form.get('city')
        state = request.form.get('state')
        country = request.form.get('country')
        postal_code = request.form.get('postal_code')
        
        new_organization = Organization(
            name=name,
            type=org_type,
            description=description,
            address=address,
            city=city,
            state=state,
            country=country,
            postal_code=postal_code
        )
        
        db.session.add(new_organization)
        db.session.commit()
        
        flash('Organization added successfully!', 'success')
        return redirect(url_for('resources.organizations'))
    
    return render_template('resources/add_organization.html')

@resources.route('/departments')
@login_required
def departments():
    """Departments list and management page"""
    departments = Department.query.all()
    organizations = Organization.query.all()
    
    return render_template('resources/departments.html',
                          departments=departments,
                          organizations=organizations)

@resources.route('/add-department', methods=['GET', 'POST'])
@login_required
def add_department():
    """Add new department record"""
    organizations = Organization.query.all()
    
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        organization_id = request.form.get('organization_id')
        budget = request.form.get('budget')
        staff_count = request.form.get('staff_count')
        
        new_department = Department(
            name=name,
            description=description,
            organization_id=organization_id,
            budget=budget,
            staff_count=staff_count
        )
        
        db.session.add(new_department)
        db.session.commit()
        
        flash('Department added successfully!', 'success')
        return redirect(url_for('resources.departments'))
    
    return render_template('resources/add_department.html', organizations=organizations)

@resources.route('/allocations')
@login_required
def allocations():
    """Resource allocations list and management page"""
    allocations = ResourceAllocation.query.all()
    organizations = Organization.query.all()
    departments = Department.query.all()
    resources_list = Resource.query.all()
    
    return render_template('resources/allocations.html',
                          allocations=allocations,
                          organizations=organizations,
                          departments=departments,
                          resources=resources_list)

@resources.route('/add-allocation', methods=['GET', 'POST'])
@login_required
def add_allocation():
    """Add new resource allocation record"""
    organizations = Organization.query.all()
    departments = Department.query.all()
    resources_list = Resource.query.all()
    
    if request.method == 'POST':
        organization_id = request.form.get('organization_id')
        department_id = request.form.get('department_id')
        resource_id = request.form.get('resource_id')
        quantity = request.form.get('quantity')
        total_cost = request.form.get('total_cost')
        allocation_date = request.form.get('allocation_date')
        fiscal_year = request.form.get('fiscal_year')
        
        new_allocation = ResourceAllocation(
            organization_id=organization_id,
            department_id=department_id,
            resource_id=resource_id,
            quantity=quantity,
            total_cost=total_cost,
            allocation_date=allocation_date,
            fiscal_year=fiscal_year
        )
        
        db.session.add(new_allocation)
        db.session.commit()
        
        flash('Resource allocation added successfully!', 'success')
        return redirect(url_for('resources.allocations'))
    
    return render_template('resources/add_allocation.html', 
                          organizations=organizations,
                          departments=departments,
                          resources=resources_list)

@resources.route('/allocation-data')
@login_required
def allocation_data():
    """API endpoint for resource allocation data"""
    organization_id = request.args.get('organization_id')
    
    if organization_id:
        # Get allocations for specific organization
        allocations = ResourceAllocation.query.filter_by(organization_id=organization_id).all()
    else:
        # Get all allocations
        allocations = ResourceAllocation.query.all()
    
    allocation_data = [
        {
            'organization': allocation.organization.name if allocation.organization else '',
            'department': allocation.department.name if allocation.department else '',
            'resource': allocation.resource.name,
            'quantity': float(allocation.quantity),
            'total_cost': float(allocation.total_cost),
            'date': allocation.allocation_date.strftime('%Y-%m-%d'),
            'fiscal_year': allocation.fiscal_year
        }
        for allocation in allocations
    ]
    
    return jsonify(allocation_data)