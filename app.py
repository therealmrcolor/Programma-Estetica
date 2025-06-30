from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime
from waitress import serve
import os

app = Flask(__name__)

def adapt_datetime(ts):
    return ts.isoformat()

def item_row_to_dict(item_row):
    # Account for the new 'reintegro' column before 'timestamp'
    return {
        'id': item_row[0],
        'colore': item_row[1],
        'sequenza': item_row[2],
        'pronto': item_row[3],
        'reintegro': item_row[4], # New field
        'note': item_row[5],
        'carretti_vert': [item_row[6], item_row[7], item_row[8], item_row[9], item_row[10]],
        'tavoli': [item_row[11], item_row[12], item_row[13], item_row[14], item_row[15]],
        'pedane': [item_row[16], item_row[17], item_row[18], item_row[19], item_row[20]],
        'contenitori': [item_row[21], item_row[22], item_row[23], item_row[24], item_row[25]],
        'spalle': [item_row[26], item_row[27], item_row[28], item_row[29], item_row[30]],
        'timestamp': item_row[31] # Index shifted
    }

def init_db():
    db_dir = 'database'
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    db_path = os.path.join(db_dir, 'sequences.db')
    
    sqlite3.register_adapter(datetime, adapt_datetime)
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    for i in range(1, 8):
        c.execute(f'''
        CREATE TABLE IF NOT EXISTS sequence_{i} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            colore TEXT,
            sequenza TEXT,
            pronto TEXT,
            reintegro TEXT, -- Added reintegro field
            note TEXT,
            carretti_vert_1 TEXT, 
            carretti_vert_2 TEXT,
            carretti_vert_3 TEXT,
            carretti_vert_4 TEXT,
            carretti_vert_5 TEXT,
            tavoli_1 TEXT,
            tavoli_2 TEXT,
            tavoli_3 TEXT,
            tavoli_4 TEXT,
            tavoli_5 TEXT,
            pedane_1 TEXT,
            pedane_2 TEXT,
            pedane_3 TEXT,
            pedane_4 TEXT,
            pedane_5 TEXT,
            contenitori_1 TEXT,
            contenitori_2 TEXT,
            contenitori_3 TEXT,
            contenitori_4 TEXT,
            contenitori_5 TEXT,
            spalle_1 TEXT,
            spalle_2 TEXT,
            spalle_3 TEXT,
            spalle_4 TEXT,
            spalle_5 TEXT,
            timestamp DATETIME
        )
        ''')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/sequence/<int:seq_num>')
@app.route('/<int:seq_num>')
def sequence_page(seq_num):
    if 1 <= seq_num <= 7:
        return render_template('sequence.html', seq_num=seq_num)
    return "Sequence not found", 404

@app.route('/api/add_item', methods=['POST'])
def add_item():
    data = request.json
    sequence_str = data.get('sequenza') 
    
    if not sequence_str:
        return jsonify({"success": False, "error": "Missing sequence number ('sequenza')"}), 400
        
    try:
        sequence_num = int(sequence_str)
        if not (1 <= sequence_num <= 7):
            return jsonify({"success": False, "error": "Invalid sequence number range (1-7)"}), 400
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Sequence number must be a valid integer string"}), 400

    required_fields = ['colore', 'pronto'] # reintegro will be handled as boolean
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
    
    expected_arrays = ['carretti_vert', 'tavoli', 'pedane', 'contenitori', 'spalle']
    for arr_field in expected_arrays:
        if arr_field not in data or not isinstance(data[arr_field], list) or len(data[arr_field]) != 5:
             return jsonify({"success": False, "error": f"Invalid or missing array data for {arr_field} (must be 5 elements)"}), 400
    
    conn = sqlite3.connect('database/sequences.db')
    c = conn.cursor()
    
    reintegro_val = "Si" if data.get('reintegro', False) else "No" # Handles boolean from checkbox

    columns = ['colore', 'sequenza', 'pronto', 'reintegro', 'note']
    values = [data['colore'], data['sequenza'], data['pronto'], reintegro_val, data.get('note', '')]
    
    for item_type in expected_arrays:
        for i in range(5):
            columns.append(f'{item_type}_{i+1}')
            value_to_add = data[item_type][i] if i < len(data[item_type]) and data[item_type][i] is not None else ''
            values.append(value_to_add)
    
    columns.append('timestamp')
    values.append(datetime.now())
    
    columns_str = ', '.join(columns)
    placeholders = ', '.join(['?' for _ in values])
    
    try:
        c.execute(f'''INSERT INTO sequence_{sequence_num} 
                    ({columns_str})
                    VALUES ({placeholders})''',
                    values)
        conn.commit()
        item_id = c.lastrowid
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Database error on insert: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
    
    return jsonify({"success": True, "id": item_id})

@app.route('/api/get_items/<int:sequence>')
def get_items(sequence):
    if not 1 <= sequence <= 7:
        return jsonify({"success": False, "error": "Invalid sequence number"}), 400
    
    conn = sqlite3.connect('database/sequences.db')
    c = conn.cursor()
    # Sort by timestamp descending (most recent first) - consistent with homepage
    c.execute(f'''SELECT * FROM sequence_{sequence} 
                  ORDER BY timestamp DESC''')
    items_rows = c.fetchall()
    conn.close()
    
    result = [item_row_to_dict(item_row) for item_row in items_rows]
    return jsonify(result)

@app.route('/api/get_recent_items_all')
def get_recent_items_all():
    all_items_list = []
    conn = sqlite3.connect('database/sequences.db')
    c = conn.cursor()
    
    for i in range(1, 8):
        try:
            # Fetch all columns including the new 'reintegro'
            c.execute(f'SELECT * FROM sequence_{i}')
            items_from_sequence = c.fetchall()
            for item_row in items_from_sequence:
                all_items_list.append(item_row_to_dict(item_row))
        except sqlite3.Error as e:
            print(f"Error fetching from sequence_{i}: {e}")
            
    conn.close()
    
    # Sort all fetched items by timestamp for the main page's recent items list
    all_items_list.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify(all_items_list[:5])


@app.route('/api/get_item/<int:sequence>/<int:item_id>')
def get_item(sequence, item_id):
    if not 1 <= sequence <= 7:
        return jsonify({"success": False, "error": "Invalid sequence number"}), 400
    
    conn = sqlite3.connect('database/sequences.db')
    c = conn.cursor()
    c.execute(f'SELECT * FROM sequence_{sequence} WHERE id = ?', (item_id,))
    item_row = c.fetchone()
    conn.close()
    
    if not item_row:
        return jsonify({"success": False, "error": "Item not found"}), 404
    
    return jsonify(item_row_to_dict(item_row))

@app.route('/api/update_item/<int:sequence>/<int:item_id>', methods=['PUT'])
def update_item(sequence, item_id):
    if not 1 <= sequence <= 7:
        return jsonify({"success": False, "error": "Invalid sequence number"}), 400
    
    data = request.json
    # 'reintegro' is now expected from the form
    required_fields = ['colore', 'pronto'] 
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
    
    expected_arrays = ['carretti_vert', 'tavoli', 'pedane', 'contenitori', 'spalle']
    for arr_field in expected_arrays:
        if arr_field not in data or not isinstance(data[arr_field], list) or len(data[arr_field]) != 5:
             return jsonify({"success": False, "error": f"Invalid or missing array data for {arr_field} (must be 5 elements)"}), 400

    conn = sqlite3.connect('database/sequences.db')
    c = conn.cursor()
    
    reintegro_val = "Si" if data.get('reintegro', False) else "No"

    columns_to_update = ['colore', 'pronto', 'reintegro', 'note']
    update_values = [data['colore'], data['pronto'], reintegro_val, data.get('note','')]
    
    for item_type in expected_arrays:
        for i in range(5):
            columns_to_update.append(f'{item_type}_{i+1}')
            value_to_add = data[item_type][i] if i < len(data[item_type]) and data[item_type][i] is not None else ''
            update_values.append(value_to_add)
    
    set_clause = ', '.join([f'{col} = ?' for col in columns_to_update])
    update_values.append(item_id) # For WHERE id = ?
    
    try:
        c.execute(f'''UPDATE sequence_{sequence} 
                    SET {set_clause}
                    WHERE id = ?''', update_values)
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Database error on update: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
            
    return jsonify({"success": True})

@app.route('/api/delete_item/<int:sequence>/<int:item_id>', methods=['DELETE'])
def delete_item(sequence, item_id):
    if not 1 <= sequence <= 7:
        return jsonify({"success": False, "error": "Invalid sequence number"}), 400
    
    conn = sqlite3.connect('database/sequences.db')
    c = conn.cursor()
    try:
        c.execute(f'DELETE FROM sequence_{sequence} WHERE id = ?', (item_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Database error on delete: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
            
    return jsonify({"success": True})

@app.route('/api/clear_sequence/<int:sequence>', methods=['DELETE'])
def clear_sequence(sequence):
    if not 1 <= sequence <= 7:
        return jsonify({"success": False, "error": "Invalid sequence number"}), 400
    
    conn = sqlite3.connect('database/sequences.db')
    c = conn.cursor()
    try:
        c.execute(f'DELETE FROM sequence_{sequence}')
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Database error on clear: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
            
    return jsonify({"success": True})

@app.route('/api/get_global_colors_recap')
def get_global_colors_recap():
    """Get a recap of all colors across all sequences"""
    all_items_list = []
    conn = sqlite3.connect('database/sequences.db')
    c = conn.cursor()
    
    for i in range(1, 8):
        try:
            c.execute(f'SELECT * FROM sequence_{i}')
            items_from_sequence = c.fetchall()
            for item_row in items_from_sequence:
                all_items_list.append(item_row_to_dict(item_row))
        except sqlite3.Error as e:
            print(f"Error fetching from sequence_{i}: {e}")
            
    conn.close()
    
    # Group by sequence and color, counting occupied cells
    color_recap = {}
    for item in all_items_list:
        if item['colore'] and item['colore'].strip():
            seq = item['sequenza']
            color = item['colore'].strip().upper()
            key = f"{seq}_{color}"
            
            # Count occupied cells for this item
            occupied_cells = 0
            cell_types = ['carretti_vert', 'tavoli', 'pedane', 'contenitori', 'spalle']
            
            for cell_type in cell_types:
                if cell_type in item and item[cell_type]:
                    for cell_value in item[cell_type]:
                        if cell_value and str(cell_value).strip():  # Cell is occupied if it has a non-empty value
                            occupied_cells += 1
            
            if key not in color_recap:
                color_recap[key] = {
                    'sequenza': seq,
                    'colore': color,
                    'count': occupied_cells,
                    'latest_timestamp': item['timestamp']
                }
            else:
                # Add cells from this item and update timestamp if more recent
                color_recap[key]['count'] += occupied_cells
                if item['timestamp'] > color_recap[key]['latest_timestamp']:
                    color_recap[key]['latest_timestamp'] = item['timestamp']
    
    # Convert to list and sort by latest timestamp (most recent first)
    result = list(color_recap.values())
    result.sort(key=lambda x: x['latest_timestamp'], reverse=True)
    
    return jsonify(result)

if __name__ == '__main__':
    init_db() # Initialize/update DB schema
    print("Avvio del server Waitress su http://0.0.0.0:5123")
    serve(app, host='0.0.0.0', port=5123)