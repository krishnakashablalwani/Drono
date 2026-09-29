import os
import re
from models.schemas import TelemetryData

class TelemetryService:
    @staticmethod
    def parse_srt_telemetry(srt_path: str, target_frame: int) -> TelemetryData:
        """Extracts telemetry from the DJI SRT sidecar for a specific frame."""
        if not srt_path or not os.path.exists(srt_path):
            print(f"[Telemetry] SRT file not found: {srt_path}")
            return TelemetryData()
            
        try:
            with open(srt_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            blocks = content.strip().split('\n\n')
            
            # Subtitles are usually 1-indexed, but video frames are 0-indexed
            target_idx = max(0, min(target_frame, len(blocks) - 1))
            block = blocks[target_idx]
            
            telemetry = TelemetryData()
            
            # Extract Latitude
            lat_m = re.search(r'\[latitude:\s*([^\]]+)\]', block)
            if lat_m: telemetry.latitude = float(lat_m.group(1))
            
            # Extract Longitude
            lon_m = re.search(r'\[longitude:\s*([^\]]+)\]', block)
            if lon_m: telemetry.longitude = float(lon_m.group(1))
            
            # Extract Altitude (AGL)
            alt_m = re.search(r'\[rel_alt:\s*([^\]\s]+)\]', block)
            if not alt_m:
                alt_m = re.search(r'\[altitude:\s*([^\]\s]+)\]', block)
            if alt_m: telemetry.altitude_m = float(alt_m.group(1))
                
            # Extract Gimbal Pitch
            pitch_m = re.search(r'\[gimbal_pitch:\s*([^\]\s]+)\]', block)
            if pitch_m: telemetry.gimbal_pitch_deg = float(pitch_m.group(1))
                
            # Extract Gimbal Roll
            roll_m = re.search(r'\[gimbal_roll:\s*([^\]\s]+)\]', block)
            if roll_m: telemetry.gimbal_roll_deg = float(roll_m.group(1))
                
            # Extract Gimbal Yaw
            yaw_m = re.search(r'\[gimbal_yaw:\s*([^\]\s]+)\]', block)
            if yaw_m: telemetry.gimbal_yaw_deg = float(yaw_m.group(1))
                
            return telemetry
        except Exception as e:
            print(f"[Telemetry] Failed to parse SRT telemetry: {e}")
            return TelemetryData()
