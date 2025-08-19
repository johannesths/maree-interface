import { CameraFeed } from "./CameraFeed";

export function CameraGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CameraFeed 
        cameraId="cam1" 
        title="Camera 1" 
        initialActive={true}
      />
      <CameraFeed 
        cameraId="cam2" 
        title="Camera 2" 
        initialActive={true}
      />
    </div>
  );
}