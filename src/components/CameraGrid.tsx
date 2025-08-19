import { CameraFeed } from "./CameraFeed";

export function CameraGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CameraFeed 
        cameraId="cam1" 
        title="Front Navigation Camera" 
        initialActive={true}
      />
      <CameraFeed 
        cameraId="cam2" 
        title="Rear Hazard Avoidance" 
        initialActive={false}
      />
      <CameraFeed 
        cameraId="cam3" 
        title="Left Mast Camera" 
        initialActive={true}
      />
      <CameraFeed 
        cameraId="cam4" 
        title="Right Mast Camera" 
        initialActive={false}
      />
    </div>
  );
}