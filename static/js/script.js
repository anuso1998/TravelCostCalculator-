document.addEventListener('DOMContentLoaded', function() {
    const calculatorForm = document.getElementById('calculator-form');
    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('result-text');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error-text');
    
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
                // Show success result
                const tripTypeDisplay = data.trip_type.charAt(0).toUpperCase() + data.trip_type.slice(1);
                resultText.innerHTML = `The total cost for your <strong>${tripTypeDisplay} Trip</strong> of <strong>${data.miles}</strong> miles is: <strong>${data.amount}</strong>`;
                resultDiv.classList.remove('d-none');
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
});
