from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

def calculate_leg_amount(miles, trip_type):
    if trip_type == "long":
        if miles <= 5:
            return 20
        else:
            return 20 + (miles - 5) * 1.27
    elif trip_type == "short":
        if miles <= 5:
            return 10
        else:
            return 10 + (miles - 5) * 1.27
    return 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        trip_type = request.form.get('trip_type', '').strip().lower()
        miles_str = request.form.get('miles', '').strip()
        is_round_trip = request.form.get('is_round_trip') == 'true'
        include_tax = request.form.get('include_tax') == 'true'
        
        # Validate trip type
        if trip_type not in ['short', 'long']:
            return jsonify({'error': 'Invalid trip type. Please select "short" or "long".'})
        
        # Auto-detect round trip if '+' is in the miles string
        if '+' in miles_str and not is_round_trip:
            is_round_trip = True
        
        # Check if we have a round trip with legs
        if is_round_trip:
            # Validate miles format for round trip (a+b format)
            if '+' not in miles_str:
                return jsonify({'error': 'For round trips, enter distances in format a+b (e.g., 25+25).'})
            
            try:
                parts = miles_str.split('+')
                if len(parts) != 2:
                    return jsonify({'error': 'Invalid format. Use a+b (e.g., 25+25) for round trips.'})
                
                a_leg = float(parts[0].strip())
                b_leg = float(parts[1].strip())
                
                if a_leg < 0 or b_leg < 0:
                    return jsonify({'error': 'Miles cannot be negative.'})
                
                # Calculate amount for each leg
                a_amount = calculate_leg_amount(a_leg, trip_type)
                b_amount = calculate_leg_amount(b_leg, trip_type)
                subtotal = a_amount + b_amount
                
                # Calculate tax if requested
                tax = 0
                if include_tax:
                    tax = subtotal * 0.10
                
                total = subtotal + tax
                
                # Format the result
                result = {
                    'success': True,
                    'trip_type': trip_type,
                    'is_round_trip': True,
                    'a_leg': a_leg,
                    'b_leg': b_leg,
                    'a_amount': f"${a_amount:.2f}",
                    'b_amount': f"${b_amount:.2f}",
                    'subtotal': f"${subtotal:.2f}",
                    'include_tax': include_tax,
                    'tax_amount': f"${tax:.2f}",
                    'total': f"${total:.2f}"
                }
                
            except ValueError:
                return jsonify({'error': 'Please enter valid numbers for miles in format a+b.'})
        else:
            # Single trip calculation
            try:
                miles = float(miles_str)
                if miles < 0:
                    return jsonify({'error': 'Miles cannot be negative.'})
                
                # Calculate amount
                amount = calculate_leg_amount(miles, trip_type)
                
                # Calculate tax if requested
                tax = 0
                if include_tax:
                    tax = amount * 0.10
                
                total = amount + tax
                
                # Format the result
                result = {
                    'success': True,
                    'trip_type': trip_type,
                    'miles': miles,
                    'subtotal': f"${amount:.2f}",
                    'include_tax': include_tax,
                    'tax_amount': f"${tax:.2f}",
                    'total': f"${total:.2f}"
                }
                
            except ValueError:
                return jsonify({'error': 'Please enter a valid number for miles.'})
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
