# app/utils/data_processing.py - Data processing and transformation utilities

import pandas as pd
import numpy as np
from app import db
from app.models.pricing import Drug, DrugPrice, Region
from app.models.resources import ResourceAllocation
from app.models.outcomes import OutcomeMeasurement
import json
from datetime import datetime

def process_drug_price_data(data_frame):
    """
    Process drug price data from DataFrame to database records
    
    Args:
        data_frame: Pandas DataFrame with drug price data
    
    Returns:
        tuple: (success_count, error_count)
    """
    success_count = 0
    error_count = 0
    
    for _, row in data_frame.iterrows():
        try:
            # Check if drug exists
            drug_name = row.get('drug_name')
            drug = Drug.query.filter_by(name=drug_name).first()
            
            if not drug:
                # Create new drug if not exists
                drug = Drug(
                    name=drug_name,
                    generic_name=row.get('generic_name', ''),
                    manufacturer=row.get('manufacturer', '')
                )
                db.session.add(drug)
                db.session.flush()
            
            # Check if region exists
            region_name = row.get('region_name')
            region = Region.query.filter_by(name=region_name).first()
            
            if not region:
                # Create new region if not exists
                region = Region(
                    name=region_name,
                    country=row.get('country', ''),
                    code=row.get('region_code', '')
                )
                db.session.add(region)
                db.session.flush()
            
            # Create drug price record
            price_date = pd.to_datetime(row.get('price_date')).date() if pd.notnull(row.get('price_date')) else datetime.now().date()
            
            price = DrugPrice(
                drug_id=drug.id,
                region_id=region.id,
                price=row.get('price', 0),
                currency=row.get('currency', 'USD'),
                price_date=price_date,
                price_type=row.get('price_type', 'retail'),
                source=row.get('source', 'data import')
            )
            
            db.session.add(price)
            success_count += 1
            
        except Exception as e:
            error_count += 1
            print(f"Error processing row: {e}")
            continue
    
    db.session.commit()
    return success_count, error_count

def process_outcome_data(data_frame):
    """
    Process outcome measurement data from DataFrame to database records
    
    Args:
        data_frame: Pandas DataFrame with outcome data
    
    Returns:
        tuple: (success_count, error_count)
    """
    success_count = 0
    error_count = 0
    
    for _, row in data_frame.iterrows():
        try:
            # Create outcome measurement record
            measurement = OutcomeMeasurement(
                outcome_id=row.get('outcome_id'),
                treatment_id=row.get('treatment_id') if pd.notnull(row.get('treatment_id')) else None,
                organization_id=row.get('organization_id') if pd.notnull(row.get('organization_id')) else None,
                value=row.get('value', 0),
                confidence_interval=row.get('confidence_interval', ''),
                sample_size=row.get('sample_size') if pd.notnull(row.get('sample_size')) else None,
                measurement_date=pd.to_datetime(row.get('measurement_date')).date() if pd.notnull(row.get('measurement_date')) else None,
                source=row.get('source', 'data import')
            )
            
            db.session.add(measurement)
            success_count += 1
            
        except Exception as e:
            error_count += 1
            print(f"Error processing row: {e}")
            continue
    
    db.session.commit()
    return success_count, error_count

def get_price_trend_data(drug_id, start_date=None, end_date=None):
    """
    Get price trend data for visualization
    
    Args:
        drug_id: ID of the drug
        start_date: Optional start date filter
        end_date: Optional end date filter
    
    Returns:
        dict: Processed data for visualization
    """
    # Build query
    query = DrugPrice.query.filter_by(drug_id=drug_id)
    
    if start_date:
        query = query.filter(DrugPrice.price_date >= start_date)
    
    if end_date:
        query = query.filter(DrugPrice.price_date <= end_date)
    
    # Order by date
    prices = query.order_by(DrugPrice.price_date).all()
    
    # Get drug name
    drug = Drug.query.get(drug_id)
    drug_name = drug.name if drug else f"Drug {drug_id}"
    
    # Process data for visualization
    data = {
        'drug': drug_name,
        'labels': [],
        'datasets': {}
    }
    
    # Group by region
    for price in prices:
        region_name = price.region.name
        
        if region_name not in data['datasets']:
            data['datasets'][region_name] = []
        
        # Add date to labels if not already present
        date_str = price.price_date.strftime('%Y-%m-%d')
        if date_str not in data['labels']:
            data['labels'].append(date_str)
        
        # Add price data
        data['datasets'][region_name].append({
            'date': date_str,
            'price': float(price.price),
            'currency': price.currency
        })
    
    # Convert datasets to format for chart.js
    formatted_datasets = []
    colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
    
    for i, (region, values) in enumerate(data['datasets'].items()):
        color = colors[i % len(colors)]
        
        # Create dataset
        dataset = {
            'label': region,
            'backgroundColor': color,
            'borderColor': color,
            'data': [next((v['price'] for v in values if v['date'] == label), None) for label in data['labels']]
        }
        
        formatted_datasets.append(dataset)
    
    result = {
        'drug': drug_name,
        'labels': data['labels'],
        'datasets': formatted_datasets
    }
    
    return result

def get_resource_allocation_data(organization_id=None, fiscal_year=None):
    """
    Get resource allocation data for visualization
    
    Args:
        organization_id: Optional organization filter
        fiscal_year: Optional fiscal year filter
    
    Returns:
        dict: Processed data for visualization
    """
    # Build query
    query = ResourceAllocation.query
    
    if organization_id:
        query = query.filter_by(organization_id=organization_id)
    
    if fiscal_year:
        query = query.filter_by(fiscal_year=fiscal_year)
    
    allocations = query.all()
    
    # Process data for visualization
    data = {
        'departmentData': {},
        'resourceData': {},
        'totalAllocation': 0
    }
    
    for allocation in allocations:
        dept_name = allocation.department.name if allocation.department else 'Unassigned'
        resource_name = allocation.resource.name
        total_cost = float(allocation.total_cost)
        
        # Aggregate by department
        if dept_name not in data['departmentData']:
            data['departmentData'][dept_name] = 0
        
        data['departmentData'][dept_name] += total_cost
        
        # Aggregate by resource
        if resource_name not in data['resourceData']:
            data['resourceData'][resource_name] = 0
        
        data['resourceData'][resource_name] += total_cost
        
        # Update total
        data['totalAllocation'] += total_cost
    
    # Format data for charts
    department_labels = list(data['departmentData'].keys())
    department_values = [data['departmentData'][dept] for dept in department_labels]
    
    resource_labels = list(data['resourceData'].keys())
    resource_values = [data['resourceData'][res] for res in resource_labels]
    
    # Sort by value (descending)
    dept_data = sorted(zip(department_labels, department_values), key=lambda x: x[1], reverse=True)
    resource_data = sorted(zip(resource_labels, resource_values), key=lambda x: x[1], reverse=True)
    
    # Limit to top 10 for cleaner visualization
    if len(dept_data) > 10:
        dept_data_top = dept_data[:9]
        other_value = sum(value for _, value in dept_data[9:])
        dept_data = dept_data_top + [('Other Departments', other_value)]
    
    if len(resource_data) > 10:
        resource_data_top = resource_data[:9]
        other_value = sum(value for _, value in resource_data[9:])
        resource_data = resource_data_top + [('Other Resources', other_value)]
    
    # Rebuild department data
    department_labels = [label for label, _ in dept_data]
    department_values = [value for _, value in dept_data]
    
    # Rebuild resource data
    resource_labels = [label for label, _ in resource_data]
    resource_values = [value for _, value in resource_data]
    
    result = {
        'departmentChart': {
            'labels': department_labels,
            'values': department_values
        },
        'resourceChart': {
            'labels': resource_labels,
            'values': resource_values
        },
        'totalAllocation': data['totalAllocation']
    }
    
    return result