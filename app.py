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
        
        # Get tax inclusion parameter and ensure it's properly processed
        include_tax_param = request.form.get('include_tax', 'false').lower()
        include_tax = include_tax_param in ['true', 'on', '1', 'yes']
        print(f"Tax parameter received: {include_tax_param}, Processed as: {include_tax}")
        
        # Validate trip type
        if trip_type not in ['short', 'long']:
            return jsonify({'error': 'Invalid trip type. Please select "short" or "long".'})
        
        # Auto-detect multi-leg trip if '+' is in the miles string
        if '+' in miles_str and not is_round_trip:
            is_round_trip = True
        
        # Check if we have a multi-leg trip
        if is_round_trip:
            # Validate miles format for multi-leg trip (a+b+c+...+n format)
            if '+' not in miles_str:
                return jsonify({'error': 'For multi-leg trips, enter distances in format a+b+c+... (e.g., 25+30+15).'})
            
            try:
                # Split the string by '+' and process each leg
                leg_parts = miles_str.split('+')
                
                # Make sure we have at least one leg
                if len(leg_parts) < 1:
                    return jsonify({'error': 'Please enter at least one leg distance.'})
                
                # Process each leg
                legs = []
                leg_amounts = []
                total_miles = 0
                subtotal = 0
                
                for i, leg_str in enumerate(leg_parts):
                    leg_distance = float(leg_str.strip())
                    
                    if leg_distance < 0:
                        return jsonify({'error': 'Leg distances cannot be negative.'})
                    
                    # Calculate amount for this leg
                    leg_amount = calculate_leg_amount(leg_distance, trip_type)
                    
                    # Add to totals
                    total_miles += leg_distance
                    subtotal += leg_amount
                    
                    # Store leg info
                    legs.append({
                        'leg_num': i + 1,
                        'distance': leg_distance,
                        'amount': leg_amount,
                        'amount_formatted': f"${leg_amount:.2f}"
                    })
                    leg_amounts.append(leg_amount)
                
                # Calculate tax deduction if requested
                tax = 0
                if include_tax:
                    tax = subtotal * 0.10
                
                total = subtotal - tax  # Subtract tax instead of adding
                total_raw = total  # Store raw numeric value for cutoff calculations
                
                # Format the result
                result = {
                    'success': True,
                    'trip_type': trip_type,
                    'is_multi_leg': True,
                    'legs': legs,
                    'total_miles': total_miles,
                    'leg_count': len(legs),
                    'subtotal': f"${subtotal:.2f}",
                    'include_tax': include_tax,
                    'tax_amount': f"${tax:.2f}",
                    'total': f"${total:.2f}",
                    'total_raw': total_raw  # Include raw value for JavaScript
                }
                
            except ValueError:
                return jsonify({'error': 'Please enter valid numbers for all leg distances separated by + signs.'})
        else:
            # Single trip calculation
            try:
                miles = float(miles_str)
                if miles < 0:
                    return jsonify({'error': 'Miles cannot be negative.'})
                
                # Calculate amount
                amount = calculate_leg_amount(miles, trip_type)
                
                # Calculate tax deduction if requested
                tax = 0
                if include_tax:
                    tax = amount * 0.10
                
                total = amount - tax  # Subtract tax instead of adding
                total_raw = total  # Store raw numeric value for cutoff calculations
                
                # Format the result
                result = {
                    'success': True,
                    'trip_type': trip_type,
                    'miles': miles,
                    'subtotal': f"${amount:.2f}",
                    'include_tax': include_tax,
                    'tax_amount': f"${tax:.2f}",
                    'total': f"${total:.2f}",
                    'total_raw': total_raw  # Include raw value for JavaScript
                }
                
            except ValueError:
                return jsonify({'error': 'Please enter a valid number for miles.'})
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
