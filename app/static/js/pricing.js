/**
 * app/static/js/pricing.js - JavaScript functionality for pricing pages
 * Contains functions for price analysis, visualization, and data management
 */

// Initialize pricing functionality on document ready
document.addEventListener('DOMContentLoaded', function() {
    // Load pricing data
    initPricingPage();
    
    // Set up event handlers for price-related components
    setupPricingEventHandlers();
});

/**
 * Initialize pricing page components and data
 */
function initPricingPage() {
    // Check if we're on a pricing page
    const pricingOverviewPage = document.getElementById('pricingOverview');
    const drugManagementPage = document.getElementById('drugManagement');
    const priceDataPage = document.getElementById('priceDataManagement');
    const priceAnalysisPage = document.getElementById('priceAnalysis');
    
    // Initialize the appropriate page
    if (pricingOverviewPage) {
        initPricingOverview();
    } else if (drugManagementPage) {
        initDrugManagement();
    } else if (priceDataPage) {
        initPriceDataManagement();
    } else if (priceAnalysisPage) {
        initPriceAnalysis();
    }
}

/**
 * Set up event handlers for pricing components
 */
function setupPricingEventHandlers() {
    // Add drug form submission
    const addDrugForm = document.getElementById('addDrugForm');
    if (addDrugForm) {
        addDrugForm.addEventListener('submit', handleAddDrugSubmit);
    }
    
    // Add price form submission
    const addPriceForm = document.getElementById('addPriceForm');
    if (addPriceForm) {
        addPriceForm.addEventListener('submit', handleAddPriceSubmit);
    }
    
    // Drug filters
    const drugFilter = document.getElementById('drugFilter');
    if (drugFilter) {
        drugFilter.addEventListener('change', handleDrugFilterChange);
    }
    
    // Region filters
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        regionFilter.addEventListener('change', handleRegionFilterChange);
    }
    
    // Date range filters
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', handleDateRangeFilterChange);
    }
    
    // Price type filters
    const priceTypeFilter = document.getElementById('priceTypeFilter');
    if (priceTypeFilter) {
        priceTypeFilter.addEventListener('change', handlePriceTypeFilterChange);
    }
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('resetFilters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Export buttons
    const exportCsvBtn = document.getElementById('export-csv');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportPricingDataToCsv);
    }
    
    const exportPdfBtn = document.getElementById('export-pdf');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportPricingDataToPdf);
    }
    
    // Drug selection for price trend
    const trendDrugSelect = document.getElementById('trendDrugSelect');
    if (trendDrugSelect) {
        trendDrugSelect.addEventListener('change', handleTrendDrugSelectionChange);
    }
    
    // Time period selection for price trend
    const timePeriodRadios = document.querySelectorAll('input[name="timeperiod"]');
    if (timePeriodRadios.length) {
        timePeriodRadios.forEach(radio => {
            radio.addEventListener('change', handleTimePeriodChange);
        });
    }
}

/**
 * Initialize pricing overview page
 */
function initPricingOverview() {
    // Load pricing summary data
    loadPricingSummary();
    
    // Initialize price comparison chart
    initPriceComparisonChart();
    
    // Load price data table
    loadPriceDataTable();
    
    // Initialize price trend chart (empty at first)
    initPriceTrendChart();
}

/**
 * Load pricing summary data
 */
function loadPricingSummary() {
    // Get summary metric elements
    const avgDisparityElement = document.getElementById('avgDisparity');
    const dataPointsCountElement = document.getElementById('dataPointsCount');
    
    // Show loading state
    if (avgDisparityElement) {
        avgDisparityElement.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    }
    
    if (dataPointsCountElement) {
        dataPointsCountElement.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    }
    
    // Fetch data from API
    fetch('/pricing/price-data')
        .then(response => response.json())
        .then(data => {
            // Update summary metrics
            updatePricingSummaryMetrics(data);
        })
        .catch(error => {
            console.error('Error loading pricing summary:', error);
            
            // Show error state
            if (avgDisparityElement) {
                avgDisparityElement.textContent = 'Error';
            }
            
            if (dataPointsCountElement) {
                dataPointsCountElement.textContent = 'Error';
            }
        });
}

/**
 * Update pricing summary metrics with the provided data
 * @param {Array} data - Pricing data
 */
function updatePricingSummaryMetrics(data) {
    const avgDisparityElement = document.getElementById('avgDisparity');
    const dataPointsCountElement = document.getElementById('dataPointsCount');
    
    // Update data points count
    if (dataPointsCountElement) {
        dataPointsCountElement.textContent = formatNumber(data.length);
    }
    
    // Calculate average price disparity
    if (avgDisparityElement && data.length > 0) {
        // Group by drug
        const drugGroups = {};
        
        data.forEach(item => {
            const drug = item.drug;
            
            if (!drugGroups[drug]) {
                drugGroups[drug] = {
                    prices: [],
                    min: Infinity,
                    max: -Infinity
                };
            }
            
            drugGroups[drug].prices.push(item.price);
            drugGroups[drug].min = Math.min(drugGroups[drug].min, item.price);
            drugGroups[drug].max = Math.max(drugGroups[drug].max, item.price);
        });
        
        // Calculate disparities
        let totalDisparity = 0;
        let count = 0;
        
        for (const drug in drugGroups) {
            if (drugGroups[drug].prices.length > 1 && drugGroups[drug].min > 0) {
                const disparity = (drugGroups[drug].max - drugGroups[drug].min) / drugGroups[drug].min * 100;
                totalDisparity += disparity;
                count++;
            }
        }
        
        // Update average disparity
        const avgDisparity = count > 0 ? (totalDisparity / count).toFixed(1) : '0.0';
        avgDisparityElement.textContent = `${avgDisparity}%`;
    }
}

/**
 * Initialize price comparison chart
 */
function initPriceComparisonChart() {
    const chartContainer = document.getElementById('priceComparisonChart');
    if (!chartContainer) return;
    
    // Show loading state
    const parentContainer = chartContainer.parentElement;
    const loadingOverlay = createLoadingOverlay(parentContainer, 'Loading price comparison data...');
    
    // Fetch data from API
    fetch('/pricing/price-data')
        .then(response => response.json())
        .then(data => {
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Create chart
            createPriceComparisonChart(chartContainer, data);
        })
        .catch(error => {
            console.error('Error loading price comparison data:', error);
            
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Show error message
            parentContainer.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading price comparison data. Please try again.
                </div>
            `;
        });
}

/**
 * Create price comparison chart with the provided data
 * @param {HTMLElement} container - Chart container element
 * @param {Array} data - Pricing data
 */
function createPriceComparisonChart(container, data) {
    if (!data || data.length === 0) {
        container.parentElement.innerHTML = `
            <div class="alert alert-info m-3">
                <i class="fas fa-info-circle me-2"></i> 
                No price data available for comparison.
            </div>
        `;
        return;
    }
    
    // Group by drug and region
    const drugSet = new Set();
    const regionSet = new Set();
    const pricesByDrugAndRegion = {};
    
    data.forEach(item => {
        drugSet.add(item.drug);
        regionSet.add(item.region);
        
        const key = `${item.drug}|${item.region}`;
        if (!pricesByDrugAndRegion[key]) {
            pricesByDrugAndRegion[key] = [];
        }
        
        pricesByDrugAndRegion[key].push(item.price);
    });
    
    // Calculate average price for each drug-region combination
    const chartData = [];
    for (const key in pricesByDrugAndRegion) {
        const [drug, region] = key.split('|');
        const prices = pricesByDrugAndRegion[key];
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        
        chartData.push({
            drug,
            region,
            price: avgPrice
        });
    }
    
    // Prepare data for chart
    const drugs = Array.from(drugSet);
    const regions = Array.from(regionSet);
    
    const datasets = regions.map((region, index) => {
        const color = generateChartColors(1)[0];
        
        return {
            label: region,
            backgroundColor: color,
            borderColor: color.replace('0.7', '1'),
            borderWidth: 1,
            data: drugs.map(drug => {
                const entry = chartData.find(item => item.drug === drug && item.region === region);
                return entry ? entry.price : null;
            })
        };
    });
    
    // Create chart
    const ctx = container.getContext('2d');
    window.priceComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: drugs,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                x: {
                    title: {
                        display: true,
                        text: 'Drugs'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    }
                }
            }
        }
    });
}

/**
 * Load price data table
 */
function loadPriceDataTable() {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;
    
    // Show loading state
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading price data...
            </td>
        </tr>
    `;
    
    // Get current filter values
    const drugId = document.getElementById('drugFilter')?.value || '';
    const regionId = document.getElementById('regionFilter')?.value || '';
    const dateRange = document.getElementById('dateRangeFilter')?.value || 'all';
    const priceType = document.getElementById('priceTypeFilter')?.value || '';
    
    // Build query parameters
    const params = new URLSearchParams();
    if (drugId) params.append('drug_id', drugId);
    if (regionId) params.append('region_id', regionId);
    if (dateRange && dateRange !== 'all') params.append('days', dateRange);
    if (priceType) params.append('price_type', priceType);
    
    // Fetch data from API
    fetch(`/pricing/price-data?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            // Update table with data
            updatePriceDataTable(tableBody, data);
            
            // Update pagination
            updatePricePagination(data.length);
            
            // Update data table info
            updateDataTableInfo(data.length);
        })
        .catch(error => {
            console.error('Error loading price data:', error);
            
            // Show error message
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="fas fa-exclamation-circle me-2"></i> 
                        Error loading price data. Please try again.
                    </td>
                </tr>
            `;
        });
}

/**
 * Update price data table with the provided data
 * @param {HTMLElement} tableBody - Table body element
 * @param {Array} data - Pricing data
 */
function updatePriceDataTable(tableBody, data) {
    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <i class="fas fa-info-circle me-2"></i> 
                    No price data found for the selected filters.
                </td>
            </tr>
        `;
        return;
    }
    
    // Calculate global average price for each drug
    const drugAvgPrices = {};
    data.forEach(item => {
        if (!drugAvgPrices[item.drug]) {
            drugAvgPrices[item.drug] = {
                total: 0,
                count: 0
            };
        }
        drugAvgPrices[item.drug].total += item.price;
        drugAvgPrices[item.drug].count++;
    });
    
    Object.keys(drugAvgPrices).forEach(drug => {
        drugAvgPrices[drug] = drugAvgPrices[drug].total / drugAvgPrices[drug].count;
    });
    
    // Generate table rows
    let html = '';
    data.forEach(item => {
        const avgPrice = drugAvgPrices[item.drug];
        const disparity = ((item.price - avgPrice) / avgPrice * 100).toFixed(1);
        const disparityClass = disparity > 10 ? 'text-danger' : 
                               disparity < -10 ? 'text-success' : 'text-muted';
        
        html += `
        <tr>
            <td>${item.drug}</td>
            <td>${item.region}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td><span class="badge bg-secondary">${item.type || 'N/A'}</span></td>
            <td>${item.date}</td>
            <td class="${disparityClass}">${disparity}%</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-price-details" data-price-id="${item.id}" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-price" data-price-id="${item.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to buttons
    tableBody.querySelectorAll('.view-price-details').forEach(button => {
        button.addEventListener('click', handleViewPriceDetails);
    });
    
    tableBody.querySelectorAll('.delete-price').forEach(button => {
        button.addEventListener('click', handleDeletePrice);
    });
}

/**
 * Update pagination based on data count
 * @param {number} dataCount - Total number of data items
 */
function updatePricePagination(dataCount) {
    const paginationContainer = document.getElementById('tablePagination');
    if (!paginationContainer) return;
    
    // For simplicity, we'll use a fixed page size
    const pageSize = 10;
    const totalPages = Math.ceil(dataCount / pageSize);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Get current page (default to 1)
    const currentPage = parseInt(getQueryParam('page')) || 1;
    
    // Generate pagination HTML
    let html = '';
    
    // Previous button
    html += `
        <li class="page-item${currentPage === 1 ? ' disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" ${currentPage === 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>Previous</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item${i === currentPage ? ' active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Next button
    html += `
        <li class="page-item${currentPage === totalPages ? ' disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'tabindex="-1" aria-disabled="true"' : ''}>Next</a>
        </li>
    `;
    
    paginationContainer.innerHTML = html;
    
    // Add event listeners to page links
    paginationContainer.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', handlePageChange);
    });
}

/**
 * Update data table info text
 * @param {number} dataCount - Total number of data items
 */
function updateDataTableInfo(dataCount) {
    const infoElement = document.getElementById('dataTableInfo');
    if (!infoElement) return;
    
    // For simplicity, we'll use a fixed page size
    const pageSize = 10;
    const totalPages = Math.ceil(dataCount / pageSize);
    
    // Get current page (default to 1)
    const currentPage = parseInt(getQueryParam('page')) || 1;
    
    // Calculate start and end indices
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, dataCount);
    
    if (dataCount === 0) {
        infoElement.textContent = 'Showing 0 to 0 of 0 entries';
    } else {
        infoElement.textContent = `Showing ${start} to ${end} of ${dataCount} entries`;
    }
}

/**
 * Initialize price trend chart
 */
function initPriceTrendChart() {
    const chartContainer = document.getElementById('priceTrendChart');
    if (!chartContainer) return;
    
    // Create empty chart
    const ctx = chartContainer.getContext('2d');
    window.priceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.raw.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM YYYY'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    }
                }
            }
        }
    });
    
    // Show message to select a drug
    document.getElementById('trendNoDataMessage')?.classList.remove('d-none');
}

/**
 * Load price trend data for selected drug and time period
 * @param {string} drugId - Selected drug ID
 * @param {string} timePeriod - Selected time period
 */
function loadPriceTrendData(drugId, timePeriod) {
    if (!drugId) return;
    
    const chartContainer = document.getElementById('priceTrendChart');
    if (!chartContainer) return;
    
    // Hide no data message
    document.getElementById('trendNoDataMessage')?.classList.add('d-none');
    
    // Show loading state
    const parentContainer = chartContainer.parentElement;
    const loadingOverlay = createLoadingOverlay(parentContainer, 'Loading price trend data...');
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('drug_id', drugId);
    if (timePeriod && timePeriod !== 'all') {
        params.append('days', timePeriod);
    }
    
    // Fetch data from API
    fetch(`/pricing/price-data?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Update price trend chart
            updatePriceTrendChart(data);
        })
        .catch(error => {
            console.error('Error loading price trend data:', error);
            
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Show error message
            parentContainer.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading price trend data. Please try again.
                </div>
            `;
        });
}

/**
 * Update price trend chart with the provided data
 * @param {Array} data - Pricing data
 */
function updatePriceTrendChart(data) {
    if (!window.priceTrendChart) return;
    
    if (!data || data.length === 0) {
        // Show no data message
        document.getElementById('trendNoDataMessage')?.classList.remove('d-none');
        
        // Clear chart
        window.priceTrendChart.data.labels = [];
        window.priceTrendChart.data.datasets = [];
        window.priceTrendChart.update();
        return;
    }
    
    // Hide no data message
    document.getElementById('trendNoDataMessage')?.classList.add('d-none');
    
    // Group data by region and sort by date
    const regionData = {};
    
    data.forEach(item => {
        if (!regionData[item.region]) {
            regionData[item.region] = [];
        }
        
        regionData[item.region].push({
            date: new Date(item.date),
            price: item.price
        });
    });
    
    // Sort data by date for each region
    for (const region in regionData) {
        regionData[region].sort((a, b) => a.date - b.date);
    }
    
    // Prepare datasets for chart
    const datasets = [];
    const colors = generateChartColors(Object.keys(regionData).length);
    
    Object.keys(regionData).forEach((region, index) => {
        const color = colors[index];
        const points = regionData[region];
        
        datasets.push({
            label: region,
            backgroundColor: color.replace('0.7', '0.1'),
            borderColor: color.replace('0.7', '1'),
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointRadius: 4,
            tension: 0.3,
            fill: true,
            data: points.map(point => ({
                x: point.date,
                y: point.price
            }))
        });
    });
    
    // Update chart data
    window.priceTrendChart.data.datasets = datasets;
    
    // Update chart
    window.priceTrendChart.update();
}

/**
 * Initialize drug management page
 */
function initDrugManagement() {
    // Load drug data
    loadDrugData();
    
    // Initialize drug category chart
    initDrugCategoryChart();
}

/**
 * Load drug data
 */
function loadDrugData() {
    const tableBody = document.getElementById('drugTableBody');
    if (!tableBody) return;
    
    // Show loading state
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading drug data...
            </td>
        </tr>
    `;
    
    // Fetch data from API
    fetch('/api/drugs')
        .then(response => response.json())
        .then(data => {
            // Update table with data
            updateDrugTable(tableBody, data);
        })
        .catch(error => {
            console.error('Error loading drug data:', error);
            
            // Show error message
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        <i class="fas fa-exclamation-circle me-2"></i> 
                        Error loading drug data. Please try again.
                    </td>
                </tr>
            `;
        });
}

/**
 * Update drug table with the provided data
 * @param {HTMLElement} tableBody - Table body element
 * @param {Array} data - Drug data
 */
function updateDrugTable(tableBody, data) {
    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <i class="fas fa-info-circle me-2"></i> 
                    No drug data found.
                </td>
            </tr>
        `;
        return;
    }
    
    // Generate table rows
    let html = '';
    data.forEach(item => {
        html += `
        <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.generic_name || 'N/A'}</td>
            <td>${item.manufacturer || 'N/A'}</td>
            <td>${item.category || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-drug-details" data-drug-id="${item.id}" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary edit-drug" data-drug-id="${item.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-drug" data-drug-id="${item.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to buttons
    tableBody.querySelectorAll('.view-drug-details').forEach(button => {
        button.addEventListener('click', handleViewDrugDetails);
    });
    
    tableBody.querySelectorAll('.edit-drug').forEach(button => {
        button.addEventListener('click', handleEditDrug);
    });
    
    tableBody.querySelectorAll('.delete-drug').forEach(button => {
        button.addEventListener('click', handleDeleteDrug);
    });
}

/**
 * Initialize drug category chart
 */
function initDrugCategoryChart() {
    const chartContainer = document.getElementById('drugCategoryChart');
    if (!chartContainer) return;
    
    // Show loading state
    const parentContainer = chartContainer.parentElement;
    const loadingOverlay = createLoadingOverlay(parentContainer, 'Loading drug category data...');
    
    // Fetch data from API
    fetch('/api/drugs')
        .then(response => response.json())
        .then(data => {
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Group drugs by category
            const categoryCount = {};
            
            data.forEach(drug => {
                const category = drug.category || 'Uncategorized';
                
                if (!categoryCount[category]) {
                    categoryCount[category] = 0;
                }
                
                categoryCount[category]++;
            });
            
            // Create chart data
            const labels = Object.keys(categoryCount);
            const values = Object.values(categoryCount);
            const colors = generateChartColors(labels.length);
            
            // Create chart
            const ctx = chartContainer.getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const percentage = ((value / data.length) * 100).toFixed(1);
                                    return `${label}: ${value} drugs (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error loading drug category data:', error);
            
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Show error message
            parentContainer.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading drug category data. Please try again.
                </div>
            `;
        });
}

/**
 * Initialize price data management page
 */
function initPriceDataManagement() {
    // Load price data
    loadPriceData();
    
    // Initialize price distribution chart
    initPriceDistributionChart();
}

/**
 * Load price data
 */
function loadPriceData() {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;
    
    // Show loading state
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading price data...
            </td>
        </tr>
    `;
    
    // Fetch data from API
    fetch('/api/drug-prices')
        .then(response => response.json())
        .then(data => {
            // Update table with data
            updatePriceTable(tableBody, data);
        })
        .catch(error => {
            console.error('Error loading price data:', error);
            
            // Show error message
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="fas fa-exclamation-circle me-2"></i> 
                        Error loading price data. Please try again.
                    </td>
                </tr>
            `;
        });
}

/**
 * Update price table with the provided data
 * @param {HTMLElement} tableBody - Table body element
 * @param {Array} data - Price data
 */
function updatePriceTable(tableBody, data) {
    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <i class="fas fa-info-circle me-2"></i> 
                    No price data found.
                </td>
            </tr>
        `;
        return;
    }
    
    // Generate table rows
    let html = '';
    data.forEach(item => {
        html += `
        <tr>
            <td>${item.id}</td>
            <td>${item.drug.name}</td>
            <td>${item.region.name}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.currency}</td>
            <td>${item.date}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-price-details" data-price-id="${item.id}" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary edit-price" data-price-id="${item.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-price" data-price-id="${item.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to buttons
    tableBody.querySelectorAll('.view-price-details').forEach(button => {
        button.addEventListener('click', handleViewPriceDetails);
    });
    
    tableBody.querySelectorAll('.edit-price').forEach(button => {
        button.addEventListener('click', handleEditPrice);
    });
    
    tableBody.querySelectorAll('.delete-price').forEach(button => {
        button.addEventListener('click', handleDeletePrice);
    });
}

/**
 * Initialize price distribution chart
 */
function initPriceDistributionChart() {
    const chartContainer = document.getElementById('priceDistributionChart');
    if (!chartContainer) return;
    
    // Show loading state
    const parentContainer = chartContainer.parentElement;
    const loadingOverlay = createLoadingOverlay(parentContainer, 'Loading price distribution data...');
    
    // Fetch data from API
    fetch('/api/drug-prices')
        .then(response => response.json())
        .then(data => {
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Create price distribution chart
            createPriceDistributionChart(chartContainer, data);
        })
        .catch(error => {
            console.error('Error loading price distribution data:', error);
            
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Show error message
            parentContainer.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading price distribution data. Please try again.
                </div>
            `;
        });
}

/**
 * Create price distribution chart with the provided data
 * @param {HTMLElement} container - Chart container element
 * @param {Array} data - Price data
 */
function createPriceDistributionChart(container, data) {
    if (!data || data.length === 0) {
        container.parentElement.innerHTML = `
            <div class="alert alert-info m-3">
                <i class="fas fa-info-circle me-2"></i> 
                No price data available for distribution analysis.
            </div>
        `;
        return;
    }
    
    // Extract prices
    const prices = data.map(item => item.price);
    
    // Create histogram data
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    const binCount = Math.min(20, Math.ceil(Math.sqrt(prices.length))); // Use square root rule for bin count
    const binWidth = range / binCount;
    
    // Create bins
    const bins = Array(binCount).fill(0);
    const binEdges = Array(binCount + 1).fill(0).map((_, i) => min + i * binWidth);
    
    // Count prices in each bin
    prices.forEach(price => {
        const binIndex = Math.min(Math.floor((price - min) / binWidth), binCount - 1);
        bins[binIndex]++;
    });
    
    // Create labels for x-axis
    const labels = binEdges.slice(0, -1).map((edge, i) => `$${edge.toFixed(2)} - $${binEdges[i + 1].toFixed(2)}`);
    
    // Create chart
    const ctx = container.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price Distribution',
                data: bins,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Price Range'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                }
            }
        }
    });
}

/**
 * Initialize price analysis page
 */
function initPriceAnalysis() {
    // Load price disparity data
    loadPriceDisparityData();
    
    // Initialize price trend analysis chart
    initPriceTrendAnalysisChart();
    
    // Load price analysis recommendations
    loadPriceAnalysisRecommendations();
}

/**
 * Load price disparity data
 */
function loadPriceDisparityData() {
    const chartContainer = document.getElementById('priceDisparityChart');
    if (!chartContainer) return;
    
    // Show loading state
    const parentContainer = chartContainer.parentElement;
    const loadingOverlay = createLoadingOverlay(parentContainer, 'Loading price disparity data...');
    
    // Fetch data from API
    fetch('/api/drug-prices')
        .then(response => response.json())
        .then(data => {
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Create price disparity chart
            createPriceDisparityChart(chartContainer, data);
        })
        .catch(error => {
            console.error('Error loading price disparity data:', error);
            
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Show error message
            parentContainer.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading price disparity data. Please try again.
                </div>
            `;
        });
}

/**
 * Create price disparity chart with the provided data
 * @param {HTMLElement} container - Chart container element
 * @param {Array} data - Price data
 */
function createPriceDisparityChart(container, data) {
    if (!data || data.length === 0) {
        container.parentElement.innerHTML = `
            <div class="alert alert-info m-3">
                <i class="fas fa-info-circle me-2"></i> 
                No price data available for disparity analysis.
            </div>
        `;
        return;
    }
    
    // Group data by drug
    const drugGroups = {};
    data.forEach(item => {
        const drugName = item.drug.name;
        
        if (!drugGroups[drugName]) {
            drugGroups[drugName] = {
                min: Infinity,
                max: -Infinity,
                avg: 0,
                count: 0,
                total: 0,
                prices: []
            };
        }
        
        drugGroups[drugName].min = Math.min(drugGroups[drugName].min, item.price);
        drugGroups[drugName].max = Math.max(drugGroups[drugName].max, item.price);
        drugGroups[drugName].total += item.price;
        drugGroups[drugName].count++;
        drugGroups[drugName].prices.push(item.price);
    });
    
    // Calculate averages and disparities
    Object.keys(drugGroups).forEach(drug => {
        drugGroups[drug].avg = drugGroups[drug].total / drugGroups[drug].count;
        drugGroups[drug].disparity = drugGroups[drug].max - drugGroups[drug].min;
        drugGroups[drug].disparityPct = (drugGroups[drug].disparity / drugGroups[drug].min) * 100;
    });
    
    // Sort drugs by disparity percentage
    const sortedDrugs = Object.keys(drugGroups)
        .filter(drug => drugGroups[drug].count > 1) // Only include drugs with multiple prices
        .sort((a, b) => drugGroups[b].disparityPct - drugGroups[a].disparityPct)
        .slice(0, 10); // Top 10 drugs with highest disparity
    
    // Create chart data
    const labels = sortedDrugs;
    const disparityData = sortedDrugs.map(drug => drugGroups[drug].disparityPct);
    const minPriceData = sortedDrugs.map(drug => drugGroups[drug].min);
    const maxPriceData = sortedDrugs.map(drug => drugGroups[drug].max);
    
    // Create chart
    const ctx = container.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Price Disparity (%)',
                    data: disparityData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Min Price ($)',
                    data: minPriceData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                    type: 'line'
                },
                {
                    label: 'Max Price ($)',
                    data: maxPriceData,
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                    type: 'line'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Drugs'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Price Disparity (%)'
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
                        text: 'Price ($)'
                    }
                }
            }
        }
    });
}

/**
 * Initialize price trend analysis chart
 */
function initPriceTrendAnalysisChart() {
    const drugSelect = document.getElementById('trendAnalysisDrugSelect');
    if (!drugSelect) return;
    
    // Show loading state for drug select
    drugSelect.innerHTML = '<option value="">Loading drugs...</option>';
    
    // Fetch drugs from API
    fetch('/api/drugs')
        .then(response => response.json())
        .then(data => {
            // Update drug select options
            let options = '<option value="">Select a drug...</option>';
            data.forEach(drug => {
                options += `<option value="${drug.id}">${drug.name}</option>`;
            });
            drugSelect.innerHTML = options;
            
            // Add event listener to drug select
            drugSelect.addEventListener('change', handleTrendAnalysisDrugChange);
        })
        .catch(error => {
            console.error('Error loading drugs:', error);
            drugSelect.innerHTML = '<option value="">Error loading drugs</option>';
        });
}

/**
 * Handle trend analysis drug change
 * @param {Event} event - Change event
 */
function handleTrendAnalysisDrugChange(event) {
    const drugId = event.target.value;
    if (!drugId) return;
    
    const chartContainer = document.getElementById('priceTrendAnalysisChart');
    if (!chartContainer) return;
    
    // Show loading state
    const parentContainer = chartContainer.parentElement;
    const loadingOverlay = createLoadingOverlay(parentContainer, 'Loading price trend analysis data...');
    
    // Fetch price data for selected drug
    fetch(`/pricing/price-data?drug_id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Create price trend analysis chart
            createPriceTrendAnalysisChart(chartContainer, data);
            
            // Show trend analysis results
            showTrendAnalysisResults(data);
        })
        .catch(error => {
            console.error('Error loading price trend analysis data:', error);
            
            // Remove loading overlay
            removeLoadingOverlay(loadingOverlay);
            
            // Show error message
            parentContainer.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading price trend analysis data. Please try again.
                </div>
            `;
        });
}

/**
 * Create price trend analysis chart with the provided data
 * @param {HTMLElement} container - Chart container element
 * @param {Array} data - Price data
 */
function createPriceTrendAnalysisChart(container, data) {
    if (!data || data.length === 0) {
        container.parentElement.innerHTML = `
            <div class="alert alert-info m-3">
                <i class="fas fa-info-circle me-2"></i> 
                No price data available for trend analysis.
            </div>
        `;
        return;
    }
    
    // Group data by region
    const regionData = {};
    data.forEach(item => {
        const regionName = item.region;
        
        if (!regionData[regionName]) {
            regionData[regionName] = [];
        }
        
        regionData[regionName].push({
            date: new Date(item.date),
            price: item.price
        });
    });
    
    // Sort data by date for each region
    Object.keys(regionData).forEach(region => {
        regionData[region].sort((a, b) => a.date - b.date);
    });
    
    // Prepare datasets for chart
    const datasets = [];
    const colors = generateChartColors(Object.keys(regionData).length);
    
    Object.keys(regionData).forEach((region, index) => {
        const color = colors[index];
        const points = regionData[region];
        
        // Calculate moving average for trend line
        const windowSize = 3; // 3-point moving average
        const movingAvgPoints = [];
        
        if (points.length >= windowSize) {
            for (let i = 0; i <= points.length - windowSize; i++) {
                const sum = points.slice(i, i + windowSize).reduce((sum, point) => sum + point.price, 0);
                const avg = sum / windowSize;
                
                movingAvgPoints.push({
                    date: points[i + Math.floor(windowSize / 2)].date,
                    price: avg
                });
            }
        }
        
        // Add actual price dataset
        datasets.push({
            label: `${region} (Actual)`,
            backgroundColor: 'transparent',
            borderColor: color.replace('0.7', '1'),
            borderWidth: 1,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointRadius: 4,
            data: points.map(point => ({
                x: point.date,
                y: point.price
            }))
        });
        
        // Add moving average dataset
        if (movingAvgPoints.length > 0) {
            datasets.push({
                label: `${region} (Trend)`,
                backgroundColor: 'transparent',
                borderColor: color.replace('0.7', '0.5'),
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                data: movingAvgPoints.map(point => ({
                    x: point.date,
                    y: point.price
                }))
            });
        }
    });
    
    // Create chart
    const ctx = container.getContext('2d');
    window.priceTrendAnalysisChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM YYYY'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                }
            }
        }
    });
}

/**
 * Show trend analysis results
 * @param {Array} data - Price data
 */
function showTrendAnalysisResults(data) {
    const resultsContainer = document.getElementById('trendAnalysisResults');
    if (!resultsContainer) return;
    
    if (!data || data.length === 0) {
        resultsContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> 
                No price data available for trend analysis.
            </div>
        `;
        return;
    }
    
    // Group data by region
    const regionData = {};
    data.forEach(item => {
        const regionName = item.region;
        
        if (!regionData[regionName]) {
            regionData[regionName] = [];
        }
        
        regionData[regionName].push({
            date: new Date(item.date),
            price: item.price
        });
    });
    
    // Calculate trend statistics for each region
    const trendStats = {};
    Object.keys(regionData).forEach(region => {
        const points = regionData[region];
        
        // Sort by date
        points.sort((a, b) => a.date - b.date);
        
        // Need at least 2 points for trend analysis
        if (points.length < 2) {
            trendStats[region] = {
                startPrice: points[0].price,
                endPrice: points[0].price,
                startDate: points[0].date,
                endDate: points[0].date,
                priceChange: 0,
                percentChange: 0,
                direction: 'stable'
            };
            return;
        }
        
        const startPoint = points[0];
        const endPoint = points[points.length - 1];
        
        const priceChange = endPoint.price - startPoint.price;
        const percentChange = (priceChange / startPoint.price) * 100;
        
        let direction = 'stable';
        if (percentChange > 1) {
            direction = 'increasing';
        } else if (percentChange < -1) {
            direction = 'decreasing';
        }
        
        trendStats[region] = {
            startPrice: startPoint.price,
            endPrice: endPoint.price,
            startDate: startPoint.date,
            endDate: endPoint.date,
            priceChange: priceChange,
            percentChange: percentChange,
            direction: direction
        };
    });
    
    // Generate HTML for results
    let html = '<div class="row">';
    
    Object.keys(trendStats).forEach(region => {
        const stats = trendStats[region];
        const directionClass = stats.direction === 'increasing' ? 'text-danger' : 
                               stats.direction === 'decreasing' ? 'text-success' : 'text-muted';
        const directionIcon = stats.direction === 'increasing' ? 'fa-arrow-up' : 
                             stats.direction === 'decreasing' ? 'fa-arrow-down' : 'fa-arrows-h';
        
        html += `
        <div class="col-md-6 mb-4">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">${region}</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <h3 class="${directionClass}">
                            <i class="fas ${directionIcon} me-2"></i>
                            ${stats.percentChange.toFixed(1)}%
                        </h3>
                        <p class="text-muted">Price change over time</p>
                    </div>
                    <div class="row">
                        <div class="col-6">
                            <div class="mb-3">
                                <h5>$${stats.startPrice.toFixed(2)}</h5>
                                <p class="text-muted">Starting price<br>
                                ${stats.startDate.toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="mb-3">
                                <h5>$${stats.endPrice.toFixed(2)}</h5>
                                <p class="text-muted">Current price<br>
                                ${stats.endDate.toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <p class="mb-0">
                            <strong>Trend Analysis:</strong> 
                            Price is <span class="${directionClass}">${stats.direction}</span> 
                            by $${Math.abs(stats.priceChange).toFixed(2)} 
                            (${Math.abs(stats.percentChange).toFixed(1)}%)
                            over a period of 
                            ${Math.round((stats.endDate - stats.startDate) / (1000 * 60 * 60 * 24))} days.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
}

/**
 * Load price analysis recommendations
 */
function loadPriceAnalysisRecommendations() {
    const container = document.getElementById('priceRecommendations');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="text-center py-4">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading recommendations...
        </div>
    `;
    
    // Fetch recommendations from API
    fetch('/api/recommendations?type=Price%20Optimization')
        .then(response => response.json())
        .then(data => {
            // Update container with recommendations
            updatePriceRecommendations(container, data);
        })
        .catch(error => {
            console.error('Error loading price recommendations:', error);
            
            // Show error message
            container.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading recommendations. Please try again.
                </div>
            `;
        });
}

/**
 * Update price recommendations with the provided data
 * @param {HTMLElement} container - Recommendations container element
 * @param {Array} data - Recommendations data
 */
function updatePriceRecommendations(container, data) {
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info m-3">
                <i class="fas fa-info-circle me-2"></i> 
                No price optimization recommendations available.
            </div>
        `;
        return;
    }
    
    // Generate HTML for recommendations
    let html = '';
    data.forEach(item => {
        const impactClass = parseFloat(item.estimated_impact) > 1000 ? 'high-impact' : 
                          parseFloat(item.estimated_impact) > 500 ? 'medium-impact' : 'low-impact';
        
        html += `
        <div class="recommendation-card ${impactClass} mb-4">
            <div class="recommendation-title">${item.title}</div>
            <div class="recommendation-impact">$${formatNumber(item.estimated_impact)}</div>
            <p class="recommendation-description">${item.description}</p>
            <div class="recommendation-meta">
                <div><i class="fas fa-chart-line"></i> ${item.confidence_level} Confidence</div>
                <div><i class="fas fa-tasks"></i> ${item.implementation_difficulty} Difficulty</div>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Handle add drug form submission
 * @param {Event} event - Submit event
 */
function handleAddDrugSubmit(event) {
    // Validation is handled by the server
}

/**
 * Handle add price form submission
 * @param {Event} event - Submit event
 */
function handleAddPriceSubmit(event) {
    // Validation is handled by the server
}

/**
 * Handle drug filter change
 * @param {Event} event - Change event
 */
function handleDrugFilterChange(event) {
    // This is handled by the applyFilters function when the Apply button is clicked
}

/**
 * Handle region filter change
 * @param {Event} event - Change event
 */
function handleRegionFilterChange(event) {
    // This is handled by the applyFilters function when the Apply button is clicked
}

/**
 * Handle date range filter change
 * @param {Event} event - Change event
 */
function handleDateRangeFilterChange(event) {
    // This is handled by the applyFilters function when the Apply button is clicked
}

/**
 * Handle price type filter change
 * @param {Event} event - Change event
 */
function handlePriceTypeFilterChange(event) {
    // This is handled by the applyFilters function when the Apply button is clicked
}

/**
 * Apply filters
 */
function applyFilters() {
    // Reload price data with filters
    loadPriceDataTable();
}

/**
 * Reset filters
 */
function resetFilters() {
    // Reset filter elements
    const drugFilter = document.getElementById('drugFilter');
    if (drugFilter) {
        drugFilter.value = '';
    }
    
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        regionFilter.value = '';
    }
    
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
        dateRangeFilter.value = 'all';
    }
    
    const priceTypeFilter = document.getElementById('priceTypeFilter');
    if (priceTypeFilter) {
        priceTypeFilter.value = '';
    }
    
    // Reload price data without filters
    loadPriceDataTable();
}

/**
 * Handle trend drug selection change
 * @param {Event} event - Change event
 */
function handleTrendDrugSelectionChange(event) {
    const drugId = event.target.value;
    if (!drugId) {
        // Show no data message
        document.getElementById('trendNoDataMessage')?.classList.remove('d-none');
        
        // Clear chart if it exists
        if (window.priceTrendChart) {
            window.priceTrendChart.data.datasets = [];
            window.priceTrendChart.update();
        }
        return;
    }
    
    // Get selected time period
    const timePeriodElement = document.querySelector('input[name="timeperiod"]:checked');
    const timePeriod = timePeriodElement ? timePeriodElement.value : 'all';
    
    // Load trend data for selected drug and time period
    loadPriceTrendData(drugId, timePeriod);
}

/**
 * Handle time period change
 * @param {Event} event - Change event
 */
function handleTimePeriodChange(event) {
    const timePeriod = event.target.value;
    
    // Get selected drug
    const drugSelect = document.getElementById('trendDrugSelect');
    const drugId = drugSelect ? drugSelect.value : '';
    
    if (drugId) {
        // Load trend data for selected drug and time period
        loadPriceTrendData(drugId, timePeriod);
    }
}

/**
 * Handle page change
 * @param {Event} event - Click event
 */
function handlePageChange(event) {
    event.preventDefault();
    
    const page = event.target.getAttribute('data-page');
    if (!page) return;
    
    // Update URL with new page
    setQueryParam('page', page);
    
    // Reload price data table
    loadPriceDataTable();
}

/**
 * Handle view price details
 * @param {Event} event - Click event
 */
function handleViewPriceDetails(event) {
    const priceId = event.currentTarget.getAttribute('data-price-id');
    if (!priceId) return;
    
    // Show loading state
    document.body.style.cursor = 'wait';
    event.currentTarget.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
    // Fetch price details from API
    fetch(`/api/drug-prices/${priceId}`)
        .then(response => response.json())
        .then(data => {
            // Reset button state
            document.body.style.cursor = 'default';
            event.currentTarget.innerHTML = '<i class="fas fa-eye"></i>';
            
            // Show price details modal
            showPriceDetailsModal(data);
        })
        .catch(error => {
            console.error('Error fetching price details:', error);
            
            // Reset button state
            document.body.style.cursor = 'default';
            event.currentTarget.innerHTML = '<i class="fas fa-eye"></i>';
            
            // Show error notification
            showNotification('Error fetching price details. Please try again.', 'error');
        });
}

/**
 * Show price details modal
 * @param {Object} priceData - Price data
 */
function showPriceDetailsModal(priceData) {
    // Create modal element
    const modalId = 'priceDetailsModal';
    let modal = document.getElementById(modalId);
    
    // Remove existing modal if it exists
    if (modal) {
        document.body.removeChild(modal);
    }
    
    // Create new modal
    modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = modalId;
    modal.tabIndex = -1;
    modal.setAttribute('aria-labelledby', `${modalId}Label`);
    modal.setAttribute('aria-hidden', 'true');
    
    // Format price date
    const priceDate = new Date(priceData.date);
    const formattedDate = priceDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${modalId}Label">Price Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Drug Information</h6>
                            <table class="table table-bordered">
                                <tr>
                                    <th>Name</th>
                                    <td>${priceData.drug.name}</td>
                                </tr>
                                <tr>
                                    <th>Generic Name</th>
                                    <td>${priceData.drug.generic_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Manufacturer</th>
                                    <td>${priceData.drug.manufacturer || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Category</th>
                                    <td>${priceData.drug.category || 'N/A'}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <h6>Price Information</h6>
                            <table class="table table-bordered">
                                <tr>
                                    <th>Region</th>
                                    <td>${priceData.region.name}, ${priceData.region.country}</td>
                                </tr>
                                <tr>
                                    <th>Price</th>
                                    <td>${priceData.currency} ${priceData.price.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <th>Date</th>
                                    <td>${formattedDate}</td>
                                </tr>
                                <tr>
                                    <th>Price Type</th>
                                    <td>${priceData.price_type || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Source</th>
                                    <td>${priceData.source || 'N/A'}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <h6 class="mt-4">Price Comparison</h6>
                    <div id="priceComparisonBarChart" style="height: 300px;">
                        <canvas id="modalPriceChart"></canvas>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Initialize Bootstrap modal
    const modalInstance = new bootstrap.Modal(modal);
    
    // Show modal
    modalInstance.show();
    
    // Fetch comparison data
    fetchPriceComparisonData(priceData);
}

/**
 * Fetch price comparison data
 * @param {Object} priceData - Price data
 */
function fetchPriceComparisonData(priceData) {
    // Fetch prices for the same drug
    fetch(`/api/drug-prices?drug_id=${priceData.drug.id}`)
        .then(response => response.json())
        .then(data => {
            // Create price comparison chart
            createPriceComparisonBarChart(data, priceData);
        })
        .catch(error => {
            console.error('Error fetching price comparison data:', error);
            document.getElementById('priceComparisonBarChart').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading price comparison data.
                </div>
            `;
        });
}

/**
 * Create price comparison bar chart
 * @param {Array} data - Price comparison data
 * @param {Object} selectedPrice - Selected price data
 */
function createPriceComparisonBarChart(data, selectedPrice) {
    const chartContainer = document.getElementById('modalPriceChart');
    if (!chartContainer) return;
    
    if (!data || data.length === 0) {
        document.getElementById('priceComparisonBarChart').innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> 
                No comparison data available.
            </div>
        `;
        return;
    }
    
    // Group prices by region
    const regionPrices = {};
    data.forEach(item => {
        const regionName = item.region.name;
        
        if (!regionPrices[regionName]) {
            regionPrices[regionName] = [];
        }
        
        regionPrices[regionName].push(item.price);
    });
    
    // Calculate average price for each region
    const regions = [];
    const prices = [];
    const backgroundColor = [];
    const borderColor = [];
    
    Object.keys(regionPrices).forEach(region => {
        const avgPrice = regionPrices[region].reduce((sum, price) => sum + price, 0) / regionPrices[region].length;
        
        regions.push(region);
        prices.push(avgPrice);
        
        // Highlight the selected price's region
        if (region === selectedPrice.region.name) {
            backgroundColor.push('rgba(255, 99, 132, 0.7)');
            borderColor.push('rgba(255, 99, 132, 1)');
        } else {
            backgroundColor.push('rgba(54, 162, 235, 0.7)');
            borderColor.push('rgba(54, 162, 235, 1)');
        }
    });
    
    // Create chart
    const ctx = chartContainer.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: regions,
            datasets: [{
                label: 'Average Price',
                data: prices,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: `Price (${selectedPrice.currency})`
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Average Price: ${selectedPrice.currency} ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Handle edit price
 * @param {Event} event - Click event
 */
function handleEditPrice(event) {
    const priceId = event.currentTarget.getAttribute('data-price-id');
    if (!priceId) return;
    
    // Navigate to edit price page
    window.location.href = `/pricing/edit-price/${priceId}`;
}

/**
 * Handle delete price
 * @param {Event} event - Click event
 */
function handleDeletePrice(event) {
    const priceId = event.currentTarget.getAttribute('data-price-id');
    if (!priceId) return;
    
    // Show confirmation dialog
    showConfirmDialog(
        'Are you sure you want to delete this price data? This action cannot be undone.',
        function() {
            // Proceed with deletion
            deletePrice(priceId);
        }
    );
}

/**
 * Delete price
 * @param {string} priceId - Price ID
 */
function deletePrice(priceId) {
    // Show loading state
    document.body.style.cursor = 'wait';
    
    // Delete price via API
    fetch(`/api/drug-prices/${priceId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Success
            document.body.style.cursor = 'default';
            showNotification('Price data deleted successfully.', 'success');
            
            // Reload price data
            loadPriceDataTable();
        } else {
            // Error
            throw new Error('Failed to delete price data');
        }
    })
    .catch(error => {
        console.error('Error deleting price:', error);
        document.body.style.cursor = 'default';
        showNotification('Error deleting price data. Please try again.', 'error');
    });
}

/**
 * Handle view drug details
 * @param {Event} event - Click event
 */
function handleViewDrugDetails(event) {
    const drugId = event.currentTarget.getAttribute('data-drug-id');
    if (!drugId) return;
    
    // Show loading state
    document.body.style.cursor = 'wait';
    event.currentTarget.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
    // Fetch drug details from API
    fetch(`/api/drug/${drugId}`)
        .then(response => response.json())
        .then(data => {
            // Reset button state
            document.body.style.cursor = 'default';
            event.currentTarget.innerHTML = '<i class="fas fa-eye"></i>';
            
            // Show drug details modal
            showDrugDetailsModal(data);
        })
        .catch(error => {
            console.error('Error fetching drug details:', error);
            
            // Reset button state
            document.body.style.cursor = 'default';
            event.currentTarget.innerHTML = '<i class="fas fa-eye"></i>';
            
            // Show error notification
            showNotification('Error fetching drug details. Please try again.', 'error');
        });
}

/**
 * Show drug details modal
 * @param {Object} drugData - Drug data
 */
function showDrugDetailsModal(drugData) {
    // Create modal element
    const modalId = 'drugDetailsModal';
    let modal = document.getElementById(modalId);
    
    // Remove existing modal if it exists
    if (modal) {
        document.body.removeChild(modal);
    }
    
    // Create new modal
    modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = modalId;
    modal.tabIndex = -1;
    modal.setAttribute('aria-labelledby', `${modalId}Label`);
    modal.setAttribute('aria-hidden', 'true');
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${modalId}Label">Drug Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <table class="table table-bordered">
                                <tr>
                                    <th>Name</th>
                                    <td>${drugData.name}</td>
                                </tr>
                                <tr>
                                    <th>Generic Name</th>
                                    <td>${drugData.generic_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Manufacturer</th>
                                    <td>${drugData.manufacturer || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Category</th>
                                    <td>${drugData.category || 'N/A'}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-header">
                                    <h6 class="mb-0">Description</h6>
                                </div>
                                <div class="card-body">
                                    ${drugData.description || 'No description available.'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h6>Price History</h6>
                    <div id="drugPriceHistoryChart" style="height: 300px;">
                        <div class="text-center py-4">
                            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Loading price history...
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" id="viewDrugPricesBtn" data-drug-id="${drugData.id}">
                        View All Prices
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Initialize Bootstrap modal
    const modalInstance = new bootstrap.Modal(modal);
    
    // Show modal
    modalInstance.show();
    
    // Add event listener to "View All Prices" button
    document.getElementById('viewDrugPricesBtn').addEventListener('click', function() {
        const drugId = this.getAttribute('data-drug-id');
        window.location.href = `/pricing/prices?drug_id=${drugId}`;
    });
    
    // Fetch price history data
    loadDrugPriceHistory(drugData.id);
}

/**
 * Load drug price history
 * @param {string} drugId - Drug ID
 */
function loadDrugPriceHistory(drugId) {
    fetch(`/api/drug-prices?drug_id=${drugId}`)
        .then(response => response.json())
        .then(data => {
            // Create price history chart
            createDrugPriceHistoryChart(data);
        })
        .catch(error => {
            console.error('Error loading drug price history:', error);
            document.getElementById('drugPriceHistoryChart').innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Error loading price history. Please try again.
                </div>
            `;
        });
}

/**
 * Create drug price history chart
 * @param {Array} data - Price data
 */
function createDrugPriceHistoryChart(data) {
    const chartContainer = document.getElementById('drugPriceHistoryChart');
    if (!chartContainer) return;
    
    if (!data || data.length === 0) {
        chartContainer.innerHTML = `
            <div class="alert alert-info m-3">
                <i class="fas fa-info-circle me-2"></i> 
                No price history available for this drug.
            </div>
        `;
        return;
    }
    
    // Group data by region
    const regionData = {};
    data.forEach(item => {
        const regionName = item.region.name;
        
        if (!regionData[regionName]) {
            regionData[regionName] = [];
        }
        
        regionData[regionName].push({
            date: new Date(item.date),
            price: item.price
        });
    });
    
    // Sort data by date for each region
    Object.keys(regionData).forEach(region => {
        regionData[region].sort((a, b) => a.date - b.date);
    });
    
    // Create canvas element
    chartContainer.innerHTML = '<canvas id="priceHistoryCanvas"></canvas>';
    const canvas = document.getElementById('priceHistoryCanvas');
    
    // Prepare datasets for chart
    const datasets = [];
    const colors = generateChartColors(Object.keys(regionData).length);
    
    Object.keys(regionData).forEach((region, index) => {
        const color = colors[index];
        const points = regionData[region];
        
        datasets.push({
            label: region,
            backgroundColor: color.replace('0.7', '0.1'),
            borderColor: color.replace('0.7', '1'),
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointRadius: 4,
            fill: false,
            data: points.map(point => ({
                x: point.date,
                y: point.price
            }))
        });
    });
    
    // Create chart
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM YYYY'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                }
            }
        }
    });
}

/**
 * Handle edit drug
 * @param {Event} event - Click event
 */
function handleEditDrug(event) {
    const drugId = event.currentTarget.getAttribute('data-drug-id');
    if (!drugId) return;
    
    // Navigate to edit drug page
    window.location.href = `/pricing/edit-drug/${drugId}`;
}

/**
 * Handle delete drug
 * @param {Event} event - Click event
 */
function handleDeleteDrug(event) {
    const drugId = event.currentTarget.getAttribute('data-drug-id');
    if (!drugId) return;
    
    // Show confirmation dialog
    showConfirmDialog(
        'Are you sure you want to delete this drug? This will also delete all price data associated with this drug. This action cannot be undone.',
        function() {
            // Proceed with deletion
            deleteDrug(drugId);
        }
    );
}

/**
 * Delete drug
 * @param {string} drugId - Drug ID
 */
function deleteDrug(drugId) {
    // Show loading state
    document.body.style.cursor = 'wait';
    
    // Delete drug via API
    fetch(`/api/drug/${drugId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Success
            document.body.style.cursor = 'default';
            showNotification('Drug deleted successfully.', 'success');
            
            // Reload drug data
            loadDrugData();
        } else {
            // Error
            throw new Error('Failed to delete drug');
        }
    })
    .catch(error => {
        console.error('Error deleting drug:', error);
        document.body.style.cursor = 'default';
        showNotification('Error deleting drug. Please try again.', 'error');
    });
}

/**
 * Export pricing data to CSV
 */
function exportPricingDataToCsv() {
    // Get table element
    const table = document.getElementById('priceDataTable');
    if (!table) {
        showNotification('No data available to export.', 'warning');
        return;
    }
    
    // Export table data
    exportTableToCSV(table, 'pricing_data.csv');
    
    // Show success notification
    showNotification('Price data exported successfully.', 'success');
}

/**
 * Export pricing data to PDF
 */
function exportPricingDataToPdf() {
    // Placeholder for PDF export functionality
    showNotification('PDF export functionality will be implemented in a future update.', 'info');
}

// Initialize pricing functionality when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initPricingPage();
});