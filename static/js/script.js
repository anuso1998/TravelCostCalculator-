document.addEventListener('DOMContentLoaded', function() {
    const calculatorForm = document.getElementById('calculator-form');
    const resultDiv = document.getElementById('result');
    const resultDetails = document.getElementById('result-details');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error-text');
    const roundTripSwitch = document.getElementById('round-trip-switch');
    const milesInput = document.getElementById('miles');
    const milesHelp = document.getElementById('miles-help');
    
    // Format currency function
    const formatCurrency = (amount) => {
        return typeof amount === 'string' ? amount : `$${amount.toFixed(2)}`;
    };
    
    // Update miles input placeholder based on round trip selection
    roundTripSwitch.addEventListener('change', function() {
        if (this.checked) {
            milesInput.placeholder = 'Enter in format: a+b (e.g., 25+30)';
            milesHelp.innerHTML = '<strong>Format required:</strong> a+b (e.g., 25+30) where a is the first leg distance and b is the return leg distance';
        } else {
            milesInput.placeholder = 'Enter distance (e.g., 25)';
            milesHelp.innerHTML = 'Enter distance as a single number (e.g., 25)';
        }
    });
    
    // Handle form submission
    calculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Hide previous results/errors
        resultDiv.classList.add('d-none');
        errorDiv.classList.add('d-none');
        
        // Get form data
        const formData = new FormData(calculatorForm);
        
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
            } else {
                // Display result based on whether it's a round trip or single trip
                const tripTypeDisplay = data.trip_type.charAt(0).toUpperCase() + data.trip_type.slice(1);
                
                let resultHTML = '';
                
                if (data.is_round_trip) {
                    // Round trip result display
                    resultHTML = `
                        <h4 class="text-center mb-3">Round Trip Cost Summary</h4>
                        <div class="table-responsive">
                            <table class="table table-bordered mb-0">
                                <tbody>
                                    <tr>
                                        <th>Trip Type:</th>
                                        <td>${tripTypeDisplay}</td>
                                    </tr>
                                    <tr>
                                        <th>First Leg (${data.a_leg} miles):</th>
                                        <td>${data.a_amount}</td>
                                    </tr>
                                    <tr>
                                        <th>Return Leg (${data.b_leg} miles):</th>
                                        <td>${data.b_amount}</td>
                                    </tr>
                                    <tr>
                                        <th>Subtotal:</th>
                                        <td>${data.subtotal}</td>
                                    </tr>`;
                    
                    if (data.include_tax) {
                        resultHTML += `
                                    <tr>
                                        <th>Tax (10%):</th>
                                        <td>${data.tax_amount}</td>
                                    </tr>`;
                    }
                    
                    resultHTML += `
                                    <tr class="table-primary">
                                        <th>Total:</th>
                                        <td><strong>${data.total}</strong></td>
                                    </tr>
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
                                        <th>Tax (10%):</th>
                                        <td>${data.tax_amount}</td>
                                    </tr>`;
                    }
                    
                    resultHTML += `
                                    <tr class="table-primary">
                                        <th>Total:</th>
                                        <td><strong>${data.total}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>`;
                }
                
                resultDetails.innerHTML = resultHTML;
                resultDiv.classList.remove('d-none');
                
                // Scroll to the result
                resultDiv.scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(error => {
            // Show error for any fetch failures
            errorText.textContent = 'An error occurred while calculating the trip cost. Please try again.';
            errorDiv.classList.remove('d-none');
            console.error('Error:', error);
        });
    });
    
    // Clear result and error when inputs change
    const inputs = calculatorForm.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            resultDiv.classList.add('d-none');
            errorDiv.classList.add('d-none');
        });
    });
    
    // Initialize placeholder for miles input
    milesInput.placeholder = 'Enter distance (e.g., 25)';
});
