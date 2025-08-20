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
    from std_msgs.msg import String as RosString
    from rosidl_runtime_py.utilities import get_message as get_ros_message_cls
    from rosidl_runtime_py.convert import message_to_ordereddict
except Exception as e:  # noqa: BLE001
    rclpy = None  # type: ignore
    Node = object  # type: ignore
    CompressedImage = object  # type: ignore
    Odometry = object  # type: ignore
    RosString = object  # type: ignore
    def get_ros_message_cls(_: str):  # type: ignore
        raise RuntimeError("rosidl_runtime_py not available")
    def message_to_ordereddict(_: object):  # type: ignore
        return {}


# ROS2 topics
CAM1_TOPIC = os.getenv("CAM1_TOPIC", "/camera/color/image_raw/compressed")
CAM2_TOPIC = os.getenv("CAM2_TOPIC", "/camera/color/image_raw/compressed")
ODOM_TOPIC = os.getenv("ODOM_TOPIC", "/odom")
OPERATION_MODE_TOPIC = os.getenv("OPERATION_MODE_TOPIC", "/operation_mode")
MESSAGES_TOPIC = os.getenv("MESSAGES_TOPIC", "/messages")


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


# SECTION - Operation mode data
class ModeStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._mode: str = "joystick"
        self._updated_at: float = 0.0

    def set_mode(self, mode: str) -> None:
        with self._lock:
            self._mode = mode
            self._updated_at = time.time()

    def get_mode(self) -> tuple[str, float]:
        with self._lock:
            return self._mode, self._updated_at


mode_store = ModeStore()


# SECTION - Messages data
class MessagesStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._latest: dict | None = None
        self._updated_at: float = 0.0

    def set_latest(self, payload: dict) -> None:
        with self._lock:
            self._latest = payload
            self._updated_at = time.time()

    def get_latest(self) -> tuple[dict | None, float]:
        with self._lock:
            return self._latest, self._updated_at


messages_store = MessagesStore()


def quaternion_to_yaw_degrees(x: float, y: float, z: float, w: float) -> float:
    # Convert quaternion to yaw (Z axis) in degrees
    # yaw = atan2(2*(w*z + x*y), 1 - 2*(y*y + z*z))
    siny_cosp = 2.0 * (w * z + x * y)
    cosy_cosp = 1.0 - 2.0 * (y * y + z * z)
    yaw_rad = math.atan2(siny_cosp, cosy_cosp)
    return math.degrees(yaw_rad)


class CameraBridgeNode(Node):
    def __init__(self, cam1_topic: str, cam2_topic: str, odom_topic: str, op_mode_topic: str, messages_topic: str) -> None:  # type: ignore[override]
        super().__init__("maree_camera_bridge")
        self.cam1_topic = cam1_topic
        self.cam2_topic = cam2_topic
        self.odom_topic = odom_topic
        self.op_mode_topic = op_mode_topic
        self.messages_topic = messages_topic
        self._cam1_sub = None
        self._cam2_sub = None
        self._odom_sub = None
        self._opmode_sub = None
        self._messages_sub = None
        # Start active by default so UI shows feeds on load; can be toggled off via control API
        self._cam1_active = True
        self._cam2_active = True
        self._update_subscriptions()
        # Odometry subscription (always on)
        self._odom_sub = self.create_subscription(Odometry, self.odom_topic, self._on_odom, qos_profile=10)
        # Operation mode (always on)
        self._opmode_sub = self.create_subscription(RosString, self.op_mode_topic, self._on_mode, qos_profile=10)
        # Messages (attempt to subscribe on startup)
        self._create_messages_subscription()

    def _on_cam1(self, msg: CompressedImage) -> None:
        # msg.data is bytes for CompressedImage
        frame_store.set_frame("cam1", bytes(msg.data))

    def _on_cam2(self, msg: CompressedImage) -> None:
        frame_store.set_frame("cam2", bytes(msg.data))

    def _on_odom(self, msg: Odometry) -> None:
        # Extract pose (x, y, yaw_deg)
        px = float(msg.pose.pose.position.x)
        py = float(msg.pose.pose.position.y)
        qx = float(msg.pose.pose.orientation.x)
        qy = float(msg.pose.pose.orientation.y)
        qz = float(msg.pose.pose.orientation.z)
        qw = float(msg.pose.pose.orientation.w)
        yaw_deg = quaternion_to_yaw_degrees(qx, qy, qz, qw)
        # Extract twist (linear x, linear y, angular z)
        vx = float(msg.twist.twist.linear.x)
        vy = float(msg.twist.twist.linear.y)
        wz = float(msg.twist.twist.angular.z)
        odom_store.set_data(
            {
                "x": px,
                "y": py,
                "yaw_deg": yaw_deg,
                "twist_linear_x": vx,
                "twist_linear_y": vy,
                "twist_angular_z": wz,
            }
        )

    def _on_mode(self, msg: RosString) -> None:
        mode_store.set_mode(str(msg.data))

    def _on_messages_any(self, msg: object) -> None:
        try:
            payload = message_to_ordereddict(msg)  # type: ignore
        except Exception:
            payload = {"repr": repr(msg)}
        messages_store.set_latest(payload)  # store latest for WS polling

    def _create_messages_subscription(self) -> None:
        # destroy existing
        if self._messages_sub is not None:
            self.destroy_subscription(self._messages_sub)
            self._messages_sub = None
        # resolve type
        try:
            topic_types = dict(self.get_topic_names_and_types())
            type_names = topic_types.get(self.messages_topic)
            if not type_names:
                self.get_logger().warn(f"No type info for messages topic {self.messages_topic}")
                return
            # choose first type
            type_name = type_names[0]
            msg_cls = get_ros_message_cls(type_name)
            self._messages_sub = self.create_subscription(msg_cls, self.messages_topic, self._on_messages_any, qos_profile=10)
            self.get_logger().info(f"Subscribed to messages topic {self.messages_topic} [{type_name}]")
        except Exception as e:
            self.get_logger().error(f"Failed to subscribe to messages topic {self.messages_topic}: {e}")

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

    def update_topics(self, cam1_topic: str | None, cam2_topic: str | None, odom_topic: str | None, op_mode_topic: str | None, messages_topic: str | None) -> dict[str, str]:
        changed: dict[str, str] = {}
        # Camera 1
        if cam1_topic and cam1_topic != self.cam1_topic:
            # Re-subscribe if active
            if self._cam1_sub is not None:
                self.destroy_subscription(self._cam1_sub)
                self._cam1_sub = None
            self.cam1_topic = cam1_topic
            if self._cam1_active:
                self._cam1_sub = self.create_subscription(CompressedImage, self.cam1_topic, self._on_cam1, qos_profile=10)
            changed["cam1_topic"] = self.cam1_topic
        # Camera 2
        if cam2_topic and cam2_topic != self.cam2_topic:
            if self._cam2_sub is not None:
                self.destroy_subscription(self._cam2_sub)
                self._cam2_sub = None
            self.cam2_topic = cam2_topic
            if self._cam2_active:
                self._cam2_sub = self.create_subscription(CompressedImage, self.cam2_topic, self._on_cam2, qos_profile=10)
            changed["cam2_topic"] = self.cam2_topic
        # Odometry
        if odom_topic and odom_topic != self.odom_topic:
            if self._odom_sub is not None:
                self.destroy_subscription(self._odom_sub)
                self._odom_sub = None
            self.odom_topic = odom_topic
            self._odom_sub = self.create_subscription(Odometry, self.odom_topic, self._on_odom, qos_profile=10)
            changed["odom_topic"] = self.odom_topic
        # Operation mode
        if op_mode_topic and op_mode_topic != self.op_mode_topic:
            if self._opmode_sub is not None:
                self.destroy_subscription(self._opmode_sub)
                self._opmode_sub = None
            self.op_mode_topic = op_mode_topic
            self._opmode_sub = self.create_subscription(RosString, self.op_mode_topic, self._on_mode, qos_profile=10)
            changed["operation_mode_topic"] = self.op_mode_topic
        # Messages
        if messages_topic and messages_topic != self.messages_topic:
            self.messages_topic = messages_topic
            self._create_messages_subscription()
            changed["messages_topic"] = self.messages_topic
        return changed


class RosRunner:
    def __init__(self, cam1_topic: str, cam2_topic: str, odom_topic: str, op_mode_topic: str, messages_topic: str) -> None:
        self.cam1_topic = cam1_topic
        self.cam2_topic = cam2_topic
        self.odom_topic = odom_topic
        self.op_mode_topic = op_mode_topic
        self.messages_topic = messages_topic
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
        self._node = CameraBridgeNode(self.cam1_topic, self.cam2_topic, self.odom_topic, self.op_mode_topic, self.messages_topic)
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

    def update_topics(self, cam1_topic: str | None, cam2_topic: str | None, odom_topic: str | None, op_mode_topic: str | None, messages_topic: str | None) -> dict[str, str]:
        if self._node is None:
            # Not started yet; update initial topics to be used at start
            if cam1_topic:
                self.cam1_topic = cam1_topic
            if cam2_topic:
                self.cam2_topic = cam2_topic
            if odom_topic:
                self.odom_topic = odom_topic
            if op_mode_topic:
                self.op_mode_topic = op_mode_topic
            if messages_topic:
                self.messages_topic = messages_topic
            return {
                "cam1_topic": self.cam1_topic,
                "cam2_topic": self.cam2_topic,
                "odom_topic": self.odom_topic,
                "operation_mode_topic": self.op_mode_topic,
                "messages_topic": self.messages_topic,
            }
        return self._node.update_topics(cam1_topic, cam2_topic, odom_topic, op_mode_topic, messages_topic)


ros_runner = RosRunner(CAM1_TOPIC, CAM2_TOPIC, ODOM_TOPIC, OPERATION_MODE_TOPIC, MESSAGES_TOPIC)

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


class TopicsConfig(BaseModel):
    cam1_topic: str | None = None
    cam2_topic: str | None = None
    odom_topic: str | None = None
    operation_mode_topic: str | None = None
    messages_topic: str | None = None


@app.get("/config/topics")
async def get_topics_config():
    node = ros_runner._node
    return {
        "cam1_topic": node.cam1_topic if node else ros_runner.cam1_topic,
        "cam2_topic": node.cam2_topic if node else ros_runner.cam2_topic,
        "odom_topic": node.odom_topic if node else ros_runner.odom_topic,
        "operation_mode_topic": node.op_mode_topic if node else ros_runner.op_mode_topic,
        "messages_topic": node.messages_topic if node else ros_runner.messages_topic,
    }


@app.put("/config/topics")
async def update_topics_config(cfg: TopicsConfig):
    changed = ros_runner.update_topics(cfg.cam1_topic, cfg.cam2_topic, cfg.odom_topic, cfg.operation_mode_topic, cfg.messages_topic)
    return {"updated": changed}


@app.get("/api/operation-mode")
async def get_operation_mode():
    mode, _ = mode_store.get_mode()
    return {"mode": mode}


@app.get("/health")
async def health():
    node = ros_runner._node
    return {
        "status": "ok",
        "cam1_topic": node.cam1_topic if node else ros_runner.cam1_topic,
        "cam2_topic": node.cam2_topic if node else ros_runner.cam2_topic,
        "odom_topic": node.odom_topic if node else ros_runner.odom_topic,
        "operation_mode_topic": node.op_mode_topic if node else ros_runner.op_mode_topic,
        "messages_topic": node.messages_topic if node else ros_runner.messages_topic,
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


# WebSocket for messages stream (raw JSON)
@app.websocket("/ws/messages")
async def ws_messages(websocket: WebSocket):
    await websocket.accept()
    try:
        last_sent_at = 0.0
        while True:
            data, updated_at = messages_store.get_latest()
            if data is not None and updated_at > last_sent_at:
                last_sent_at = updated_at
                await websocket.send_json(data)
            await asyncio.sleep(0.2)
    except WebSocketDisconnect:
        return
