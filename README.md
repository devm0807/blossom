# 3D Model Viewer & Generator

A web application that allows users to generate 3D models from text descriptions using AI. The application features a simple interface for text prompts, a chat interface for interactive design, and a 3D viewer for visualizing the generated models.

## Features

- **Text-to-3D Generation**: Create 3D models from text descriptions
- **Real-time 3D Viewing**: Examine generated models in an interactive 3D viewer
- **Design Chat Interface**: Refine designs through conversational AI
- **Progress Tracking**: Monitor model generation progress in real-time
- **Multiple View Modes**: View models in different presentation formats

## Requirements

### Frontend
- Node.js 16+ and npm/yarn
- Next.js 14+
- Three.js (via @react-three/fiber and @react-three/drei)
- TypeScript 5+

### Backend
- Python 3.8+
- Flask
- Meshy API account and API key

## Project Structure

```
├── backend/               # Flask backend server
│   ├── app.py             # Main server file
│   └── generated_models/  # Storage for generated models
├── components/            # React components
│   ├── model-viewer.tsx   # 3D model viewer component
│   ├── t-shirt-customizer.tsx # Main application component
│   └── ...
├── lib/                   # Utility functions and services
│   └── api-service.ts     # API communication service
├── public/                # Static assets
│   └── assets/3d/         # Default 3D models
└── ...
```

## Setup Instructions

### Frontend Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd 3d-model-viewer-indeed
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create a .env.local file** (optional for customization):
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The frontend should now be running on http://localhost:3000

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

   Alternatively, you can install the dependencies manually:
   ```bash
   pip install flask requests python-dotenv flask-cors gunicorn
   ```

4. **Create a .env file with your Meshy API key**:
   ```
   MESHY_API_KEY=your_meshy_api_key_here
   ```

5. **Create a directory for generated models**:
   ```bash
   mkdir generated_models
   ```

6. **Start the Flask server**:
   ```bash
   python app.py
   ```

   The backend should now be running on http://localhost:4000

## How to Use

### Generating a 3D Model

1. Open the application in your browser at http://localhost:3000
2. In the "Direct Input" tab, enter a description of the 3D model you want to generate
   - For example: "A red sports car with chrome wheels"
3. Click the "Generate 3D Model" button
4. The application will show the generation progress and status
5. Once complete, the model will automatically load in the 3D viewer

### Using the Chat Interface

1. Click on the "Design Chat" tab in the sidebar
2. Have a conversation with the AI about your design needs
3. The AI will suggest design ideas
4. Click the "Implement Design" button to generate a 3D model based on the conversation

### Interacting with the 3D Model

- **Rotate**: Click and drag on the model
- **Zoom**: Use the mouse wheel or the zoom buttons
- **Pan**: Hold Shift while dragging or use the pan button
- **Reset View**: Click the reset button (three dots)

## Troubleshooting

### Model Not Loading

If a model fails to load:

1. Check the browser console for error messages
2. Use the "Retry Loading Model" button in the status panel
3. Ensure both frontend and backend servers are running
4. Verify that the model file exists in the backend's generated_models directory

### API Connection Issues

If you experience issues connecting to the backend:

1. Ensure the Flask server is running on port 4000
2. Check that CORS is properly configured
3. Verify that the .env.local file has the correct API base URL

### Model Generation Errors

If model generation fails:

1. Check that your Meshy API key is valid
2. Ensure there's sufficient storage space for the generated models
3. Try a different prompt that may be easier for the AI to interpret

## License

[Include your license information here]

## Credits

- 3D model generation powered by [Meshy AI](https://meshy.ai/)
- Built with [Next.js](https://nextjs.org/) and [React Three Fiber](https://github.com/pmndrs/react-three-fiber) 
