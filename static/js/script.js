document.addEventListener('DOMContentLoaded', function() {
    const calculatorForm = document.getElementById('calculator-form');
    const resultDiv = document.getElementById('result');
    const resultDetails = document.getElementById('result-details');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error-text');
    const roundTripSwitch = document.getElementById('round-trip-switch');
    const milesInput = document.getElementById('miles');
    const milesHelp = document.getElementById('miles-help');
    
    // Store calculation data for cutoff
    let lastCalculation = null;
    
    // Format currency function
    const formatCurrency = (amount) => {
        if (typeof amount === 'string' && amount.startsWith('$')) {
            return amount; // Already formatted
        }
        return `$${parseFloat(amount).toFixed(2)}`;
    };
    
    // Update miles input placeholder based on multi-leg trip selection
    roundTripSwitch.addEventListener('change', function() {
        if (this.checked) {
            milesInput.placeholder = 'Enter in format: a+b+c+... (e.g., 25+30+15)';
            milesHelp.innerHTML = `
                <small>
                    <strong>Format required:</strong> a+b+c+... where each value is a leg distance<br>
                    <strong>Examples:</strong> 
                    <ul class="mb-0">
                        <li>Two legs: 25+30</li>
                        <li>Three legs: 25+30+15</li>
                        <li>Four legs: 10+20+30+15</li>
                    </ul>
                </small>`;
        } else {
            milesInput.placeholder = 'Enter distance (e.g., 25)';
            milesHelp.innerHTML = '<small><strong>Single Trip:</strong> Enter distance as a single number (e.g., 25)</small>';
        }
    });
    
    // Auto-detect round trip format and check the switch
    milesInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value.includes('+')) {
            roundTripSwitch.checked = true;
            // Trigger the change event to update help text
            const event = new Event('change');
            roundTripSwitch.dispatchEvent(event);
        }
    });
    
    // Handle form submission
    calculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Hide previous results/errors
        resultDiv.classList.add('d-none');
        errorDiv.classList.add('d-none');
        
        // Auto-check round trip switch if format contains '+'
        const milesValue = milesInput.value.trim();
        if (milesValue.includes('+')) {
            roundTripSwitch.checked = true;
        }
        
        // Get form data
        const formData = new FormData(calculatorForm);
        
        // Ensure tax switch is properly set
        const taxSwitch = document.getElementById('tax-switch');
        if (taxSwitch.checked) {
            formData.set('include_tax', 'true');
        } else {
            formData.set('include_tax', 'false');
        }
        
        // Send POST request to the server
        fetch('/calculate', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                // Show error message
                errorText.textContent = data.error;
                errorDiv.classList.remove('d-none');
                lastCalculation = null;
            } else {
                // Store the calculation data for cutoff feature
                lastCalculation = data;
                
                // Display result based on whether it's a round trip or single trip
                displayResult(data);
            }
        })
        .catch(error => {
            // Show error for any fetch failures
            errorText.textContent = 'An error occurred while calculating the trip cost. Please try again.';
            errorDiv.classList.remove('d-none');
            console.error('Error:', error);
            lastCalculation = null;
        });
    });
    
    // Function to display result
    function displayResult(data, cutoffPercentage = null, cutoffAmount = null) {
        const tripTypeDisplay = data.trip_type.charAt(0).toUpperCase() + data.trip_type.slice(1);
        let resultHTML = '';
        
        if (data.is_multi_leg) {
            // Multi-leg trip result display
            resultHTML = `
                <h4 class="text-center mb-3">Multi-Leg Trip Cost Summary</h4>
                <div class="table-responsive">
                    <table class="table table-bordered mb-0">
                        <tbody>
                            <tr>
                                <th>Trip Type:</th>
                                <td>${tripTypeDisplay}</td>
                            </tr>
                            <tr>
                                <th>Total Distance:</th>
                                <td>${data.total_miles} miles (${data.leg_count} legs)</td>
                            </tr>`;
            
            // Add each leg detail
            data.legs.forEach(leg => {
                resultHTML += `
                            <tr>
                                <th>Leg ${leg.leg_num} (${leg.distance} miles):</th>
                                <td>${leg.amount_formatted}</td>
                            </tr>`;
            });
            
            resultHTML += `
                            <tr>
                                <th>Subtotal:</th>
                                <td>${data.subtotal}</td>
                            </tr>`;
            
            if (data.include_tax) {
                resultHTML += `
                            <tr>
                                <th>Tax Discount (10%):</th>
                                <td>-${data.tax_amount}</td>
                            </tr>`;
            }
            
            resultHTML += `
                            <tr class="table-primary">
                                <th>Total:</th>
                                <td><strong>${data.total}</strong></td>
                            </tr>`;
            
            // Add cutoff information if provided
            if (cutoffPercentage && cutoffAmount) {
                resultHTML += `
                            <tr class="table-success">
                                <th>Cutoff (${cutoffPercentage}%):</th>
                                <td>-${formatCurrency(cutoffAmount)}</td>
                            </tr>
                            <tr class="table-warning">
                                <th>Final Total:</th>
                                <td><strong>${formatCurrency(data.total_raw - cutoffAmount)}</strong></td>
                            </tr>`;
            }
            
            resultHTML += `
                        </tbody>
                    </table>
                </div>`;
        } else {
            // Single trip result display
            resultHTML = `
                <h4 class="text-center mb-3">Trip Cost Summary</h4>
                <div class="table-responsive">
                    <table class="table table-bordered mb-0">
                        <tbody>
                            <tr>
                                <th>Trip Type:</th>
                                <td>${tripTypeDisplay}</td>
                            </tr>
                            <tr>
                                <th>Distance:</th>
                                <td>${data.miles} miles</td>
                            </tr>
                            <tr>
                                <th>Subtotal:</th>
                                <td>${data.subtotal}</td>
                            </tr>`;
            
            if (data.include_tax) {
                resultHTML += `
                            <tr>
                                <th>Tax Discount (10%):</th>
                                <td>-${data.tax_amount}</td>
                            </tr>`;
            }
            
            resultHTML += `
                            <tr class="table-primary">
                                <th>Total:</th>
                                <td><strong>${data.total}</strong></td>
                            </tr>`;
            
            // Add cutoff information if provided
            if (cutoffPercentage && cutoffAmount) {
                resultHTML += `
                            <tr class="table-success">
                                <th>Cutoff (${cutoffPercentage}%):</th>
                                <td>-${formatCurrency(cutoffAmount)}</td>
                            </tr>
                            <tr class="table-warning">
                                <th>Final Total:</th>
                                <td><strong>${formatCurrency(data.total_raw - cutoffAmount)}</strong></td>
                            </tr>`;
            }
            
            resultHTML += `
                        </tbody>
                    </table>
                </div>`;
        }
        
        // Add cutoff feature only if we have a calculation and no cutoff has been applied yet
        if (!cutoffPercentage) {
            resultHTML += `
                <div class="mt-3">
                    <div class="card">
                        <div class="card-header bg-light">
                            <h5 class="mb-0">Apply Cutoff</h5>
                        </div>
                        <div class="card-body">
                            <div class="input-group">
                                <input type="number" id="cutoff-percentage" class="form-control" placeholder="Enter percentage" min="0" max="100" step="0.1">
                                <span class="input-group-text">%</span>
                                <button class="btn btn-success" type="button" id="apply-cutoff">Apply Cutoff</button>
                            </div>
                            <div class="form-text">Enter a percentage to subtract from the total cost</div>
                        </div>
                    </div>
                </div>`;
        }
        
        resultDetails.innerHTML = resultHTML;
        resultDiv.classList.remove('d-none');
        
        // Add event listener for cutoff button
        const applyButton = document.getElementById('apply-cutoff');
        if (applyButton) {
            applyButton.addEventListener('click', function() {
                const percentageInput = document.getElementById('cutoff-percentage');
                const percentage = parseFloat(percentageInput.value);
                
                if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                    alert('Please enter a valid percentage between 0 and 100');
                    return;
                }
                
                // Calculate cutoff amount
                const cutoffAmount = (lastCalculation.total_raw * percentage) / 100;
                
                // Re-display the result with cutoff applied
                displayResult(lastCalculation, percentage, cutoffAmount);
                
                // Scroll to the result
                resultDiv.scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        // Scroll to the result
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Clear result and error when inputs change
    const inputs = calculatorForm.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            resultDiv.classList.add('d-none');
            errorDiv.classList.add('d-none');
            lastCalculation = null;
        });
    });
    
    // Initialize placeholder for miles input
    milesInput.placeholder = 'Enter distance (e.g., 25)';
});