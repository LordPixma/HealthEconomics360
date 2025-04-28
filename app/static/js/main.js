/**
 * app/static/js/main.js - Main JavaScript functions for the HealthEconomics360 application
 * Contains shared functionality used across the application
 */

// Document ready handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    initTooltips();
    
    // Initialize popovers
    initPopovers();
    
    // Set up global event handlers
    setupEventHandlers();
    
    // Initialize common UI components
    initUIComponents();
});

/**
 * Initialize Bootstrap tooltips
 */
function initTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (tooltipTriggerList.length) {
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
}

/**
 * Initialize Bootstrap popovers
 */
function initPopovers() {
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    if (popoverTriggerList.length) {
        [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }
}

/**
 * Set up global event handlers
 */
function setupEventHandlers() {
    // Toggle sidebar on mobile
    const sidebarToggle = document.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('sidebar-toggled');
            document.querySelector('.sidebar').classList.toggle('toggled');
        });
    }
    
    // Close any open menu on body click
    document.addEventListener('click', function(e) {
        if (
            document.querySelector('.sidebar.toggled') && 
            !e.target.closest('.sidebar') && 
            !e.target.closest('#sidebarToggle')
        ) {
            document.body.classList.remove('sidebar-toggled');
            document.querySelector('.sidebar').classList.remove('toggled');
        }
    });
    
    // Prevent dropdown menu from closing when clicking inside
    document.querySelectorAll('.dropdown-menu.keep-open').forEach(function(element) {
        element.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Scroll to top button
    const scrollToTopBtn = document.querySelector('#scrollToTop');
    if (scrollToTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                scrollToTopBtn.style.display = 'block';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        });
        
        // Scroll to top on click
        scrollToTopBtn.addEventListener('click', function() {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        });
    }
}

/**
 * Initialize common UI components
 */
function initUIComponents() {
    // Initialize any date pickers
    initDatePickers();
    
    // Initialize select2 dropdowns if available
    initSelectDropdowns();
    
    // Initialize collapsible cards
    initCollapsibleCards();
}

/**
 * Initialize date pickers
 */
function initDatePickers() {
    const datepickers = document.querySelectorAll('.datepicker');
    if (datepickers.length && typeof flatpickr !== 'undefined') {
        datepickers.forEach(function(element) {
            flatpickr(element, {
                dateFormat: 'Y-m-d',
                allowInput: true
            });
        });
    }
}

/**
 * Initialize enhanced select dropdowns
 */
function initSelectDropdowns() {
    const selects = document.querySelectorAll('.select2');
    if (selects.length && typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 !== 'undefined') {
        jQuery(selects).select2({
            width: '100%'
        });
    }
}

/**
 * Initialize collapsible cards
 */
function initCollapsibleCards() {
    document.querySelectorAll('.card-header-action .collapse-toggle').forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.card');
            const cardBody = card.querySelector('.card-body');
            const icon = this.querySelector('i');
            
            // Toggle collapse
            const collapse = new bootstrap.Collapse(cardBody, {
                toggle: true
            });
            
            // Toggle icon
            if (icon) {
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            }
        });
    });
}

/**
 * Format number with commas
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
function formatNumber(number, decimals = 0) {
    return number.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency
 */
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
function formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (default: MM/DD/YYYY)
 * @returns {string} Formatted date
 */
function formatDate(date, format = 'MM/DD/YYYY') {
    if (!date) return '';
    
    // If date is string, convert to Date object
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let result = format.replace('DD', day);
    result = result.replace('MM', month);
    result = result.replace('YYYY', year);
    
    return result;
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, info, warning, error)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + new Date().getTime();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.setAttribute('id', toastId);
    
    // Create toast body
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const toastElement = new bootstrap.Toast(toast, {
        autohide: true,
        delay: duration
    });
    toastElement.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

/**
 * Create loading overlay
 * @param {HTMLElement} parent - Parent element to append overlay to
 * @param {string} message - Loading message
 * @returns {HTMLElement} Loading overlay element
 */
function createLoadingOverlay(parent, message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">${message}</p>
    `;
    
    // Set parent to position relative if not already
    if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
    }
    
    parent.appendChild(overlay);
    return overlay;
}

/**
 * Remove loading overlay
 * @param {HTMLElement} overlay - Loading overlay element to remove
 */
function removeLoadingOverlay(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} confirmCallback - Function to call when confirmed
 * @param {Function} cancelCallback - Function to call when canceled
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 */
function showConfirmDialog(
    message, 
    confirmCallback, 
    cancelCallback = null, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel'
) {
    // Create modal element
    const modalId = 'confirmModal-' + new Date().getTime();
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('id', modalId);
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', `${modalId}-label`);
    modal.setAttribute('aria-hidden', 'true');
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${modalId}-label">Confirmation</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    ${message}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                    <button type="button" class="btn btn-primary" id="${modalId}-confirm">${confirmText}</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Initialize Bootstrap modal
    const modalElement = new bootstrap.Modal(modal);
    
    // Add event handlers
    const confirmButton = document.getElementById(`${modalId}-confirm`);
    confirmButton.addEventListener('click', function() {
        modalElement.hide();
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
    });
    
    modal.addEventListener('hidden.bs.modal', function() {
        // Remove modal from DOM after it's hidden
        document.body.removeChild(modal);
        
        // Call cancel callback if modal was dismissed
        if (!confirmButton.classList.contains('clicked') && typeof cancelCallback === 'function') {
            cancelCallback();
        }
    });
    
    // Mark confirm button as clicked when it's clicked
    confirmButton.addEventListener('click', function() {
        this.classList.add('clicked');
    });
    
    // Show modal
    modalElement.show();
}

/**
 * Generate chart colors
 * @param {number} count - Number of colors to generate
 * @returns {Array} Array of colors
 */
function generateChartColors(count) {
    const colors = [
        'rgba(54, 162, 235, 0.7)',   // Blue
        'rgba(255, 99, 132, 0.7)',   // Red
        'rgba(255, 206, 86, 0.7)',   // Yellow
        'rgba(75, 192, 192, 0.7)',   // Green
        'rgba(153, 102, 255, 0.7)',  // Purple
        'rgba(255, 159, 64, 0.7)',   // Orange
        'rgba(201, 203, 207, 0.7)',  // Grey
        'rgba(0, 204, 150, 0.7)',    // Teal
        'rgba(255, 99, 255, 0.7)',   // Pink
        'rgba(99, 255, 132, 0.7)'    // Light green
    ];
    
    // If we need more colors than in our predefined array, generate them
    if (count > colors.length) {
        for (let i = colors.length; i < count; i++) {
            // Generate random RGB values
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
        }
    }
    
    return colors.slice(0, count);
}

/**
 * Create responsive Chart.js chart
 * @param {string} elementId - ID of canvas element
 * @param {string} type - Chart type (line, bar, pie, etc.)
 * @param {Object} data - Chart data
 * @param {Object} options - Chart options
 * @returns {Object} Chart instance
 */
function createResponsiveChart(elementId, type, data, options = {}) {
    const ctx = document.getElementById(elementId).getContext('2d');
    
    // Default responsive options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false
            }
        }
    };
    
    // Merge options
    const mergedOptions = {...defaultOptions, ...options};
    
    // Create and return chart
    return new Chart(ctx, {
        type: type,
        data: data,
        options: mergedOptions
    });
}

/**
 * Export table to CSV
 * @param {HTMLElement} table - Table element
 * @param {string} filename - Output filename
 */
function exportTableToCSV(table, filename) {
    const rows = table.querySelectorAll('tr');
    const csv = [];
    
    for (let i = 0; i < rows.length; i++) {
        const row = [], cols = rows[i].querySelectorAll('td, th');
        
        for (let j = 0; j < cols.length; j++) {
            // Get text content
            let data = cols[j].textContent.trim();
            
            // Clean the data
            data = data.replace(/(\r\n|\n|\r)/gm, ' '); // Remove line breaks
            data = data.replace(/(\s\s)/gm, ' '); // Remove extra spaces
            data = data.replace(/"/g, '""'); // Escape quotes
            
            // Add to row
            row.push('"' + data + '"');
        }
        
        csv.push(row.join(','));
    }
    
    // Download CSV
    downloadCSV(csv.join('\n'), filename);
}

/**
 * Download CSV file
 * @param {string} csv - CSV content
 * @param {string} filename - Output filename
 */
function downloadCSV(csv, filename) {
    const csvFile = new Blob([csv], {type: 'text/csv'});
    const downloadLink = document.createElement('a');
    
    // Create download link
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';
    
    // Add to document, trigger click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

/**
 * Handle form validation
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} Whether form is valid
 */
function validateForm(form) {
    // Check if native form validation is available
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        // Add was-validated class to display validation feedback
        form.classList.add('was-validated');
        return false;
    }
    
    // Fallback custom validation
    let isValid = true;
    
    // Check required fields
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(function(field) {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    // Check email fields
    const emailFields = form.querySelectorAll('input[type="email"]');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    emailFields.forEach(function(field) {
        if (field.value && !emailRegex.test(field.value)) {
            isValid = false;
            field.classList.add('is-invalid');
        }
    });
    
    return isValid;
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get contrast color (black or white) based on background color
 * @param {string} hexColor - Hex color code
 * @returns {string} Contrast color (#000000 or #FFFFFF)
 */
function getContrastColor(hexColor) {
    // Remove # if present
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Whether element is in viewport
 */
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Animate number counting
 * @param {HTMLElement} element - Element to update
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Animation duration in milliseconds
 * @param {string} prefix - Prefix to add before number
 * @param {string} suffix - Suffix to add after number
 * @param {number} decimals - Number of decimal places
 */
function animateNumber(element, start, end, duration = 1000, prefix = '', suffix = '', decimals = 0) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        
        element.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise} Promise that resolves when text is copied
 */
function copyToClipboard(text) {
    // Use Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    
    // Fallback method
    return new Promise((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Make the textarea out of viewport
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                resolve();
            } else {
                reject(new Error('Unable to copy text'));
            }
        } catch (err) {
            document.body.removeChild(textArea);
            reject(err);
        }
    });
}

/**
 * Get query parameter from URL
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value
 */
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Set query parameter in URL without page reload
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
function setQueryParam(name, value) {
    const url = new URL(window.location.href);
    
    if (value === null || value === '') {
        url.searchParams.delete(name);
    } else {
        url.searchParams.set(name, value);
    }
    
    window.history.pushState({}, '', url.toString());
}