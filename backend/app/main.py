from fastapi import FastAPI, Response, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
from contextlib import asynccontextmanager
import os
import asyncio
import threading
import time
import math
from pydantic import BaseModel

# ROS 2 imports
try:
    import rclpy
    from rclpy.executors import MultiThreadedExecutor
    from rclpy.node import Node
    from sensor_msgs.msg import CompressedImage
    from nav_msgs.msg import Odometry
except Exception as e:  # noqa: BLE001
    rclpy = None  # type: ignore
    Node = object  # type: ignore
    CompressedImage = object  # type: ignore
    Odometry = object  # type: ignore

# ROS2 topics
CAM1_TOPIC = os.getenv("CAM1_TOPIC", "/camera/color/image_raw/compressed")
CAM2_TOPIC = os.getenv("CAM2_TOPIC", "/camera/color/image_raw/compressed")
ODOM_TOPIC = os.getenv("ODOM_TOPIC", "/odom")


class FrameStore:
    """Thread-safe storage for latest JPEG frames per camera id."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._frames = {"cam1": None, "cam2": None}  # type: ignore[var-annotated]
        self._updated_at = {"cam1": 0.0, "cam2": 0.0}  # type: ignore[var-annotated]

    def set_frame(self, camera_id: str, data: bytes) -> None:
        with self._lock:
            self._frames[camera_id] = data
            self._updated_at[camera_id] = time.time()

    def get_frame(self, camera_id: str) -> tuple[bytes | None, float]:
        with self._lock:
            return self._frames.get(camera_id), self._updated_at.get(camera_id, 0.0)


frame_store = FrameStore()

# SECTION - Odometry data
class OdomStore:
    """Thread-safe storage for latest odometry-derived positional data."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._data: dict[str, float] | None = None
        self._updated_at: float = 0.0

    def set_data(self, data: dict[str, float]) -> None:
        with self._lock:
            self._data = data
            self._updated_at = time.time()

    def get_data(self) -> tuple[dict[str, float] | None, float]:
        with self._lock:
            return self._data, self._updated_at


odom_store = OdomStore()


def quaternion_to_yaw_degrees(x: float, y: float, z: float, w: float) -> float:
    # Convert quaternion to yaw (Z axis) in degrees
    # yaw = atan2(2*(w*z + x*y), 1 - 2*(y*y + z*z))
    siny_cosp = 2.0 * (w * z + x * y)
    cosy_cosp = 1.0 - 2.0 * (y * y + z * z)
    yaw_rad = math.atan2(siny_cosp, cosy_cosp)
    return math.degrees(yaw_rad)


class CameraBridgeNode(Node):
    def __init__(self, cam1_topic: str, cam2_topic: str, odom_topic: str) -> None:  # type: ignore[override]
        super().__init__("maree_camera_bridge")
        self.cam1_topic = cam1_topic
        self.cam2_topic = cam2_topic
        self.odom_topic = odom_topic
        self._cam1_sub = None
        self._cam2_sub = None
        # Start active by default so UI shows feeds on load; can be toggled off via control API
        self._cam1_active = True
        self._cam2_active = True
        self._update_subscriptions()
        # Odometry subscription (always on)
        self.create_subscription(Odometry, self.odom_topic, self._on_odom, qos_profile=10)

    def _on_cam1(self, msg: CompressedImage) -> None:
        # msg.data is bytes for CompressedImage
        frame_store.set_frame("cam1", bytes(msg.data))

    def _on_cam2(self, msg: CompressedImage) -> None:
        frame_store.set_frame("cam2", bytes(msg.data))

    def _on_odom(self, msg: Odometry) -> None:
        # Map ROS odom to frontend positional fields
        px = float(msg.pose.pose.position.x)
        py = float(msg.pose.pose.position.y)
        qx = float(msg.pose.pose.orientation.x)
        qy = float(msg.pose.pose.orientation.y)
        qz = float(msg.pose.pose.orientation.z)
        qw = float(msg.pose.pose.orientation.w)
        vx = float(msg.twist.twist.linear.x)
        vy = float(msg.twist.twist.linear.y)
        vz = float(msg.twist.twist.linear.z)
        heading_deg = quaternion_to_yaw_degrees(qx, qy, qz, qw)
        speed = math.sqrt(vx * vx + vy * vy + vz * vz)
        # For lack of geodetic frame, expose x/y as latitude/longitude fields
        odom_store.set_data(
            {
                "latitude": px,
                "longitude": py,
                "heading": heading_deg,
                "speed": speed,
            }
        )

    def _update_subscriptions(self) -> None:
        # Update cam1 subscription
        if self._cam1_active and self._cam1_sub is None:
            self._cam1_sub = self.create_subscription(
                CompressedImage, self.cam1_topic, self._on_cam1, qos_profile=10
            )
        elif not self._cam1_active and self._cam1_sub is not None:
            self.destroy_subscription(self._cam1_sub)
            self._cam1_sub = None

        # Update cam2 subscription
        if self._cam2_active and self._cam2_sub is None:
            self._cam2_sub = self.create_subscription(
                CompressedImage, self.cam2_topic, self._on_cam2, qos_profile=10
            )
        elif not self._cam2_active and self._cam2_sub is not None:
            self.destroy_subscription(self._cam2_sub)
            self._cam2_sub = None

    def set_camera_active(self, camera_id: str, active: bool) -> None:
        if camera_id == "cam1":
            self._cam1_active = active
        elif camera_id == "cam2":
            self._cam2_active = active
        self._update_subscriptions()


class RosRunner:
    def __init__(self, cam1_topic: str, cam2_topic: str, odom_topic: str) -> None:
        self.cam1_topic = cam1_topic
        self.cam2_topic = cam2_topic
        self.odom_topic = odom_topic
        self._executor: MultiThreadedExecutor | None = None
        self._node: CameraBridgeNode | None = None
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if rclpy is None:
            # ROS 2 not available; skip start so the app can still run for non-ROS testing
            return
        if self._thread and self._thread.is_alive():
            return
        rclpy.init(args=None)
        self._node = CameraBridgeNode(self.cam1_topic, self.cam2_topic, self.odom_topic)
        self._executor = MultiThreadedExecutor()
        self._executor.add_node(self._node)

        def _spin() -> None:
            try:
                assert self._executor is not None
                self._executor.spin()
            finally:
                if self._node is not None:
                    self._executor.remove_node(self._node)  # type: ignore[arg-type]
                    self._node.destroy_node()
                rclpy.shutdown()

        self._thread = threading.Thread(target=_spin, name="ros2-executor", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        if self._executor is not None:
            self._executor.shutdown()
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=2.0)


ros_runner = RosRunner(CAM1_TOPIC, CAM2_TOPIC, ODOM_TOPIC)

# Lifespan must be defined before creating the FastAPI app
@asynccontextmanager
async def lifespan(_: FastAPI):
    # Start ROS bridge on app startup
    ros_runner.start()
    try:
        yield
    finally:
        # Stop ROS bridge on shutdown
        ros_runner.stop()

# Create app before route decorators use it
app = FastAPI(title="Maree Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Camera control model and endpoint (placed after app is created)
class CameraControl(BaseModel):
    active: bool


@app.post("/camera/{camera_id}/control")
async def camera_control(camera_id: str, payload: CameraControl):
    if camera_id not in ("cam1", "cam2"):
        raise HTTPException(status_code=404, detail="Unknown camera id")

    if ros_runner._node:
        ros_runner._node.set_camera_active(camera_id, payload.active)

    return {"camera_id": camera_id, "active": payload.active}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "cam1_topic": CAM1_TOPIC,
        "cam2_topic": CAM2_TOPIC,
        "odom_topic": ODOM_TOPIC,
    }


def _mjpeg_frame(frame_bytes: bytes) -> bytes:
    return (
        b"--frame\r\n"
        b"Content-Type: image/jpeg\r\n"
        + f"Content-Length: {len(frame_bytes)}\r\n\r\n".encode()
        + frame_bytes
        + b"\r\n"
    )


async def _stream_generator(camera_id: str):
    if camera_id not in ("cam1", "cam2"):
        raise HTTPException(status_code=404, detail="Unknown camera id")
    # Poll for latest frames and yield as MJPEG
    last_sent_at = 0.0
    while True:
        frame, updated_at = frame_store.get_frame(camera_id)
        if frame is not None and updated_at >= last_sent_at:
            last_sent_at = updated_at
            yield _mjpeg_frame(frame)
        # Limit to ~30 fps max and avoid busy loop
        await asyncio.sleep(0.033)


@app.get("/camera/{camera_id}/mjpeg")
async def camera_mjpeg(camera_id: str):
    return StreamingResponse(
        _stream_generator(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


# WebSocket for positional data (odometry)
@app.websocket("/ws/position")
async def ws_position(websocket: WebSocket):
    await websocket.accept()
    try:
        last_sent_at = 0.0
        while True:
            data, updated_at = odom_store.get_data()
            if data is not None and updated_at > last_sent_at:
                last_sent_at = updated_at
                await websocket.send_json(data)
            # 10 Hz update loop
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        # Client disconnected; simply exit handler
        return
