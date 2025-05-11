from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        trip_type = request.form.get('trip_type', '').strip().lower()
        miles_str = request.form.get('miles', '').strip()
        
        # Validate trip type
        if trip_type not in ['short', 'long']:
            return jsonify({'error': 'Invalid trip type. Please select "short" or "long".'})
        
        # Validate miles
        try:
            miles = float(miles_str)
            if miles < 0:
                return jsonify({'error': 'Miles cannot be negative.'})
        except ValueError:
            return jsonify({'error': 'Please enter a valid number for miles.'})
        
        # Calculate amount
        amount = 0
        
        if trip_type == "long":
            if miles <= 5:
                amount = 20
            else:
                amount = 20 + (miles - 5) * 1.27
        elif trip_type == "short":
            if miles <= 5:
                amount = 10
            else:
                amount = 10 + (miles - 5) * 1.27
        
        # Format the result
        result = {
            'success': True,
            'trip_type': trip_type,
            'miles': miles,
            'amount': f"${amount:.2f}"
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
