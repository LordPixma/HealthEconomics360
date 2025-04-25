/**
 * app/static/js/dashboard.js - JavaScript for the main dashboard functionality
 * Handles charts, statistics, and interactive elements on the dashboard
 */

// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard data
    initDashboard();
    
    // Set up event handlers
    setupEventHandlers();
});

/**
 * Initialize the dashboard data and visualizations
 */
function initDashboard() {
    // Load dashboard statistics
    loadDashboardStats();
    
    // Initialize charts
    initCharts();
    
    // Load recent analyses
    loadRecentAnalyses();
    
    // Load recommendations
    loadRecommendations();
}

/**
 * Set up event handlers for dashboard controls
 */
function setupEventHandlers() {
    // Time range filter
    const timeRangeButtons = document.querySelectorAll('.time-range');
    if (timeRangeButtons.length) {
        timeRangeButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const range = this.getAttribute('data-range');
                const buttonText = this.textContent;
                
                // Update dropdown button text
                const dropdown = document.getElementById('timeRangeDropdown');
                if (dropdown) {
                    dropdown.innerHTML = `<i class="fas fa-calendar"></i> ${buttonText}`;
                }
                
                // Update dashboard data based on selected time range
                updateDashboardData(range);
            });
        });
    }
    
    // Refresh button
    const refreshButton = document.getElementById('refresh-dashboard');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            // Show loading indicators
            const charts = document.querySelectorAll('.chart-container');
            const loadingOverlays = [];
            
            charts.forEach(chart => {
                loadingOverlays.push(createLoadingOverlay(chart, 'Refreshing data...'));
            });
            
            // Refresh dashboard data
            setTimeout(() => {
                initDashboard();
                
                // Remove loading overlays
                loadingOverlays.forEach(overlay => {
                    removeLoadingOverlay(overlay);
                });
                
                // Show success toast
                showToast('Dashboard data refreshed successfully', 'success');
            }, 1500);
        });
    }
    
    // Export button
    const exportButton = document.getElementById('export-dashboard');
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            exportDashboardData();
        });
    }
}

/**
 * Load dashboard statistics
 */
function loadDashboardStats() {
    // In a real application, this would be an API call
    // For now, we'll simulate it with a timeout
    fetch('/api/dashboard-summary')
        .then(response => response.json())
        .then(data => {
            // Update dashboard statistics
            updateDashboardStats(data);
        })
        .catch(error => {
            console.error('Error loading dashboard stats:', error);
            showToast('Failed to load dashboard statistics', 'error');
        });
}

/**
 * Update dashboard statistics with the provided data
 * @param {Object} data - Dashboard statistics data
 */
function updateDashboardStats(data) {
    // Update counts
    if (data.counts) {
        const drugCount = document.getElementById('drugCount');
        if (drugCount) drugCount.textContent = data.counts.drugs;
        
        const orgCount = document.getElementById('organizationCount');
        if (orgCount) orgCount.textContent = data.counts.organizations;
        
        const recCount = document.getElementById('recommendationCount');
        if (recCount) recCount.textContent = data.counts.recommendations;
    }
    
    // Update price disparity
    const priceDisparity = document.getElementById('price-disparity');
    if (priceDisparity && data.price_comparisons) {
        const disparities = [];
        
        // Calculate disparities between regions
        if (data.price_comparisons.length > 1) {
            for (let i = 0; i < data.price_comparisons.length; i++) {
                for (let j = i + 1; j < data.price_comparisons.length; j++) {
                    const region1 = data.price_comparisons[i];
                    const region2 = data.price_comparisons[j];
                    
                    if (region1.avg_price > 0 && region2.avg_price > 0) {
                        const disparity = Math.abs(region1.avg_price - region2.avg_price) / Math.min(region1.avg_price, region2.avg_price) * 100;
                        disparities.push(disparity);
                    }
                }
            }
            
            if (disparities.length > 0) {
                const avgDisparity = disparities.reduce((sum, val) => sum + val, 0) / disparities.length;
                priceDisparity.textContent = `${avgDisparity.toFixed(1)}%`;
            } else {
                priceDisparity.textContent = 'N/A';
            }
        } else {
            priceDisparity.textContent = 'N/A';
        }
    }
}

/**
 * Initialize dashboard charts
 */
function initCharts() {
    // Fetch chart data from API
    fetch('/dashboard/dashboard-data')
        .then(response => response.json())
        .then(data => {
            // Initialize price comparison chart
            initPriceComparisonChart(data);
            
            // Initialize resource allocation chart
            initResourceAllocationChart(data);
            
            // Initialize outcome efficiency chart
            initOutcomeEfficiencyChart(data);
        })
        .catch(error => {
            console.error('Error loading chart data:', error);
            showToast('Failed to load chart data', 'error');
        });
}

/**
 * Initialize price comparison chart
 * @param {Object} data - Chart data from API
 */
function initPriceComparisonChart(data) {
    const ctx = document.getElementById('priceComparisonChart');
    if (!ctx) return;
    
    // Transform data for chart
    const chartData = {
        labels: [],
        datasets: []
    };
    
    if (data.price_data && data.price_data.length > 0) {
        // Group by drug and region
        const drugRegionData = {};
        const drugsSet = new Set();
        const regionsSet = new Set();
        
        data.price_data.forEach(item => {
            drugsSet.add(item.drug);
            regionsSet.add(item.region);
            
            const key = item.region;
            if (!drugRegionData[key]) {
                drugRegionData[key] = {};
            }
            
            drugRegionData[key][item.drug] = item.price;
        });
        
        // Convert sets to arrays
        chartData.labels = Array.from(drugsSet);
        const regions = Array.from(regionsSet);
        
        // Create datasets for each region
        const colors = generateChartColors(regions.length);
        
        regions.forEach((region, index) => {
            const dataset = {
                label: region,
                backgroundColor: colors[index],
                borderColor: colors[index].replace('0.7', '1'),
                borderWidth: 1,
                data: []
            };
            
            // Add data for each drug
            chartData.labels.forEach(drug => {
                dataset.data.push(drugRegionData[region][drug] || null);
            });
            
            chartData.datasets.push(dataset);
        });
    }
    
    // Create the chart
    const priceComparisonChart = createResponsiveChart(ctx.id, 'bar', chartData, {
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Price (USD)'
                }
            }
        }
    });
    
    // Store chart reference for later updates
    window.dashboardCharts = window.dashboardCharts || {};
    window.dashboardCharts.priceComparison = priceComparisonChart;
}

/**
 * Initialize resource allocation chart
 * @param {Object} data - Chart data from API
 */
function initResourceAllocationChart(data) {
    const ctx = document.getElementById('resourceAllocationChart');
    if (!ctx) return;
    
    // Sample data for resource allocation (in a real app, this would come from the API)
    const chartData = {
        labels: ['Pharmaceuticals', 'Equipment', 'Staff', 'Facilities', 'Administrative', 'Other'],
        datasets: [{
            data: [30, 25, 20, 15, 7, 3],
            backgroundColor: generateChartColors(6),
            borderWidth: 1
        }]
    };
    
    // Create the chart
    const resourceAllocationChart = createResponsiveChart(ctx.id, 'doughnut', chartData, {
        plugins: {
            legend: {
                position: 'right',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.raw}%`;
                    }
                }
            }
        }
    });
    
    // Store chart reference for later updates
    window.dashboardCharts = window.dashboardCharts || {};
    window.dashboardCharts.resourceAllocation = resourceAllocationChart;
}

/**
 * Initialize outcome efficiency chart
 * @param {Object} data - Chart data from API
 */
function initOutcomeEfficiencyChart(data) {
    const ctx = document.getElementById('outcomeEfficiencyChart');
    if (!ctx) return;
    
    // Sample data for outcome efficiency (in a real app, this would come from the API)
    const chartData = {
        labels: ['Treatment A', 'Treatment B', 'Treatment C', 'Treatment D', 'Treatment E'],
        datasets: [{
            label: 'Cost ($)',
            data: [1200, 800, 1500, 650, 950],
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            yAxisID: 'y'
        }, {
            label: 'Outcome Score',
            data: [75, 65, 90, 50, 85],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            yAxisID: 'y1'
        }]
    };
    
    // Create the chart
    const outcomeEfficiencyChart = createResponsiveChart(ctx.id, 'bar', chartData, {
        plugins: {
            legend: {
                position: 'top',
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Cost ($)'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false
                },
                title: {
                    display: true,
                    text: 'Outcome Score'
                }
            }
        }
    });
    
    // Store chart reference for later updates
    window.dashboardCharts = window.dashboardCharts || {};
    window.dashboardCharts.outcomeEfficiency = outcomeEfficiencyChart;
}

/**
 * Load recent analyses
 */
function loadRecentAnalyses() {
    // Recent analyses are loaded directly in the template for now
    // In a real application, this would be an API call
}

/**
 * Load recommendations
 */
function loadRecommendations() {
    // Recommendations are loaded directly in the template for now
    // In a real application, this would be an API call
}

/**
 * Update dashboard data based on selected time range
 * @param {string} range - Time range to filter by (week, month, quarter, year, custom)
 */
function updateDashboardData(range) {
    // In a real application, this would be an API call with the selected range
    // For now, we'll simulate it with a timeout
    
    // Show loading indicators
    const charts = document.querySelectorAll('.chart-container');
    const loadingOverlays = [];
    
    charts.forEach(chart => {
        loadingOverlays.push(createLoadingOverlay(chart, 'Loading data...'));
    });
    
    // Simulate API call
    setTimeout(() => {
        // Update charts
        if (window.dashboardCharts) {
            // For demo purposes, just update with random data
            if (window.dashboardCharts.priceComparison) {
                window.dashboardCharts.priceComparison.data.datasets.forEach(dataset => {
                    dataset.data = dataset.data.map(() => Math.random() * 1000 + 500);
                });
                window.dashboardCharts.priceComparison.update();
            }
            
            if (window.dashboardCharts.resourceAllocation) {
                window.dashboardCharts.resourceAllocation.data.datasets[0].data = [
                    Math.random() * 30 + 20,
                    Math.random() * 25 + 15,
                    Math.random() * 20 + 10,
                    Math.random() * 15 + 5,
                    Math.random() * 10 + 5,
                    Math.random() * 5 + 1
                ];
                window.dashboardCharts.resourceAllocation.update();
            }
            
            if (window.dashboardCharts.outcomeEfficiency) {
                window.dashboardCharts.outcomeEfficiency.data.datasets[0].data = 
                    window.dashboardCharts.outcomeEfficiency.data.datasets[0].data.map(() => Math.random() * 1000 + 500);
                
                window.dashboardCharts.outcomeEfficiency.data.datasets[1].data = 
                    window.dashboardCharts.outcomeEfficiency.data.datasets[1].data.map(() => Math.random() * 50 + 50);
                
                window.dashboardCharts.outcomeEfficiency.update();
            }
        }
        
        // Update statistics
        document.getElementById('price-disparity').textContent = `${(Math.random() * 50 + 20).toFixed(1)}%`;
        
        // Remove loading overlays
        loadingOverlays.forEach(overlay => {
            removeLoadingOverlay(overlay);
        });
        
        // Show success toast
        showToast(`Dashboard data updated for ${range} view`, 'success');
    }, 1500);
}

/**
 * Export dashboard data
 */
function exportDashboardData() {
    // Create export data
    const data = [
        ['Dashboard Export', '', '', ''],
        ['Generated on', new Date().toLocaleString(), '', ''],
        ['', '', '', ''],
        ['Price Comparison Data', '', '', ''],
        ['Drug', 'Region', 'Price ($)', 'Date']
    ];
    
    // Add random sample data
    const drugs = ['Drug A', 'Drug B', 'Drug C', 'Drug D', 'Drug E'];
    const regions = ['US', 'EU', 'Asia', 'Canada', 'Australia'];
    
    for (let i = 0; i < 20; i++) {
        const drug = drugs[Math.floor(Math.random() * drugs.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const price = (Math.random() * 1000 + 100).toFixed(2);
        const date = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString();
        
        data.push([drug, region, price, date]);
    }
    
    // Add resource allocation data
    data.push(['', '', '', '']);
    data.push(['Resource Allocation', '', '', '']);
    data.push(['Category', 'Percentage (%)', '', '']);
    data.push(['Pharmaceuticals', '30', '', '']);
    data.push(['Equipment', '25', '', '']);
    data.push(['Staff', '20', '', '']);
    data.push(['Facilities', '15', '', '']);
    data.push(['Administrative', '7', '', '']);
    data.push(['Other', '3', '', '']);
    
    // Export to CSV
    exportToCsv(data, 'healtheconomics360_dashboard_export.csv');
    
    // Show success toast
    showToast('Dashboard data exported successfully', 'success');
}
