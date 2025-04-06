import os
import time
import requests
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from chat_service import get_chat_response, generate_design_summary


# Set up Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for testing

# Config - Use absolute path for UPLOAD_FOLDER
UPLOAD_FOLDER = os.path.abspath('generated_models')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

print(f"Models will be saved to: {UPLOAD_FOLDER}")

# Meshy API configuration
API_KEY = os.environ.get("MESHY_API_KEY", "msy_IHy9KNV9NQUASnFQyuuCjIwcux9R5zwK7SFX")
HEADERS = {
    "Authorization": f"Bearer {API_KEY}"
}

# In-memory store for tracking job status
jobs = {}

def process_meshy_job(prompt, job_id):
    """Background processing of Meshy job"""
    try:
        # Update job status
        jobs[job_id] = {
            "status": "PROCESSING",
            "progress": 0,
            "prompt": prompt,
            "model_urls": None,
            "error": None
        }
        
        # 1. Generate preview model
        generate_preview_request = {
            "mode": "preview",
            "prompt": prompt,
            "negative_prompt": "low quality, low resolution, low poly, ugly",
            "art_style": "realistic",
            "should_remesh": True,
        }
        
        generate_preview_response = requests.post(
            "https://api.meshy.ai/openapi/v2/text-to-3d",
            headers=HEADERS,
            json=generate_preview_request,
        )
        
        generate_preview_response.raise_for_status()
        preview_task_id = generate_preview_response.json()["result"]
        
        # 2. Poll preview task
        while True:
            preview_task_response = requests.get(
                f"https://api.meshy.ai/openapi/v2/text-to-3d/{preview_task_id}",
                headers=HEADERS,
            )
            
            preview_task_response.raise_for_status()
            preview_task = preview_task_response.json()
            
            # Update job status
            jobs[job_id]["status"] = preview_task["status"]
            jobs[job_id]["progress"] = preview_task["progress"] * 0.5  # First half of the process
            
            if preview_task["status"] == "SUCCEEDED":
                break
                
            time.sleep(5)
        
        # 3. Download preview model
        preview_model_url = preview_task["model_urls"]["glb"]
        preview_file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_preview.glb")
        
        preview_model_response = requests.get(preview_model_url)
        preview_model_response.raise_for_status()
        
        with open(preview_file_path, "wb") as f:
            f.write(preview_model_response.content)
        
        print(f"Preview model saved to: {preview_file_path}")
        
        # 4. Generate refined model
        generate_refined_request = {
            "mode": "refine",
            "preview_task_id": preview_task_id,
        }
        
        generate_refined_response = requests.post(
            "https://api.meshy.ai/openapi/v2/text-to-3d",
            headers=HEADERS,
            json=generate_refined_request,
        )
        
        generate_refined_response.raise_for_status()
        refined_task_id = generate_refined_response.json()["result"]
        
        # 5. Poll refined task
        while True:
            refined_task_response = requests.get(
                f"https://api.meshy.ai/openapi/v2/text-to-3d/{refined_task_id}",
                headers=HEADERS,
            )
            
            refined_task_response.raise_for_status()
            refined_task = refined_task_response.json()
            
            # Update job status
            jobs[job_id]["status"] = refined_task["status"]
            jobs[job_id]["progress"] = 0.5 + (refined_task["progress"] * 0.5)  # Second half of the process
            
            if refined_task["status"] == "SUCCEEDED":
                break
                
            time.sleep(5)
        
        # 6. Download refined model
        refined_model_url = refined_task["model_urls"]["glb"]
        refined_file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_refined.glb")
        
        refined_model_response = requests.get(refined_model_url)
        refined_model_response.raise_for_status()
        
        with open(refined_file_path, "wb") as f:
            f.write(refined_model_response.content)
        
        print(f"Refined model saved to: {refined_file_path}")
        
        # Update job with success - now with proper URLs for frontend access
        jobs[job_id]["status"] = "COMPLETED"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["model_urls"] = {
            "preview": {
                "remote": preview_model_url,
                "local": f"{job_id}_preview.glb",
                "url": f"http://localhost:4000/generated_models/{job_id}_preview.glb"
            },
            "refined": {
                "remote": refined_model_url,
                "local": f"{job_id}_refined.glb",
                "url": f"http://localhost:4000/generated_models/{job_id}_refined.glb"
            }
        }
            
    except Exception as e:
        # Update job with error
        jobs[job_id]["status"] = "FAILED"
        jobs[job_id]["error"] = str(e)

@app.route('/api/generate', methods=['POST'])
def generate_model():
    """API endpoint to generate a 3D model from a prompt"""
    data = request.json
    
    if not data or 'prompt' not in data:
        return jsonify({
            "error": "Missing prompt in request body"
        }), 400
    
    prompt = data['prompt']
    
    # Generate a unique job ID
    job_id = f"job_{int(time.time())}"
    
    # Start processing in background
    thread = threading.Thread(
        target=process_meshy_job,
        args=(prompt, job_id)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "job_id": job_id,
        "status": "PROCESSING",
        "message": "Your 3D model generation has started"
    })

@app.route('/api/status/<job_id>', methods=['GET'])
def job_status(job_id):
    """API endpoint to check job status"""
    if job_id not in jobs:
        return jsonify({
            "error": "Job not found"
        }), 404
    
    return jsonify(jobs[job_id])

@app.route('/generated_models/<path:filename>', methods=['GET'])
def serve_model(filename):
    """Serve generated model files"""
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Log the request for debugging
        print(f"Received request for model file: {filename}")
        print(f"Looking for file at: {file_path}")
        
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return jsonify({"error": "File not found"}), 404
        
        # Get file size for logging
        file_size = os.path.getsize(file_path)
        print(f"Serving file: {file_path} ({file_size} bytes)")
        
        # Add cache control and CORS headers
        response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        response.headers['Access-Control-Allow-Origin'] = '*'
        
        return response
    except Exception as e:
        error_message = str(e)
        print(f"Error serving file {filename}: {error_message}")
        return jsonify({"error": error_message}), 500
    
# Add chat endpoints
@app.route('/api/chat', methods=['POST'])
def chat():
    """Get a response from the AI chat assistant"""
    try:
        data = request.json
        
        if not data or 'messages' not in data:
            return jsonify({"error": "Messages are required"}), 400
        
        # Validate messages format
        messages = data['messages']
        if not isinstance(messages, list):
            return jsonify({"error": "Messages must be a list"}), 400
        
        print(f"Processing chat request with {len(messages)} messages")
        
        # Get response from chat service
        response = get_chat_response(messages)
        
        if "error" in response:
            print(f"Chat service error: {response['error']}")
            return jsonify({"error": response["error"]}), 500
        
        print(f"Successful chat response generated. Length: {len(response.get('content', ''))}")
        return jsonify(response)
    except Exception as e:
        print(f"Unexpected error in /api/chat: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/generate-summary', methods=['POST'])
def generate_summary():
    """Generate a design summary from conversation history"""
    try:
        data = request.json
        
        if not data or 'conversation' not in data:
            return jsonify({"error": "Conversation history is required"}), 400
        
        # Validate conversation format
        conversation = data['conversation']
        if not isinstance(conversation, list):
            return jsonify({"error": "Conversation must be a list"}), 400
        
        print(f"Processing summary request with {len(conversation)} messages")
        
        # Get summary from chat service
        response = generate_design_summary(conversation)
        
        if "error" in response:
            print(f"Summary generation error: {response['error']}")
            return jsonify({"error": response["error"]}), 500
        
        print(f"Successful summary generated. Length: {len(response.get('summary', ''))}")
        return jsonify(response)
    except Exception as e:
        print(f"Unexpected error in /api/generate-summary: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000)