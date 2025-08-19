## Maree Interface

React + FastAPI interface

### Backend (FastAPI + ROS2)

Prerequisites:

- ROS 2 installed
- Python 3.10+

Environment variables to set (optional):

- `CAM1_TOPIC` default: `/camera/color/image_raw/compressed`
- `CAM2_TOPIC` default: `/camera/color/image_raw/compressed`

Run the backend:

```bash
cd backend/
chmod +x run.sh
./run.sh
```

This starts FastAPI on `http://0.0.0.0:8000` with endpoints:

- `/health`
- `/camera/cam1/mjpeg`
- `/camera/cam2/mjpeg`

### Frontend (Vite + React)

Prerequisites:

- Node.js and npm (recommend installing via nvm)

Install and run:

```bash
npm install

# Configure backend URL (optional)
echo "VITE_BACKEND_URL=http://localhost:8000" > .env

npm run dev
```

If you run the backend on a different host/port, set `VITE_BACKEND_URL` accordingly in `.env`.

### Notes

- The backend subscribes to ROS 2 `sensor_msgs/msg/CompressedImage` topics and forwards the latest frames via MJPEG. High-frequency topics are sampled as the latest available frame.
- CORS is enabled in the backend to allow the Vite dev server to fetch the streams.
