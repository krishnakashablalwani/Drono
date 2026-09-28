import re
import datetime
import pyproj
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class SRTParser:
    def __init__(self, srt_content: str):
        self.srt_content = srt_content
        self.telemetry_data = []

    def parse(self) -> List[Dict]:
        """Parses DJI format SRT and returns a list of telemetry dicts."""
        # Simple regex based parser for DJI SRT format
        # Format often includes [latitude: 34.1234] [longitude: -118.1234] [rel_alt: 50.0]
        blocks = self.srt_content.strip().split('\n\n')
        
        lat_pattern = re.compile(r'latitude[:\s]+([-0-9.]+)')
        lon_pattern = re.compile(r'longitude[:\s]+([-0-9.]+)')
        rel_alt_pattern = re.compile(r'rel_alt[:\s]+([-0-9.]+)')
        abs_alt_pattern = re.compile(r'abs_alt[:\s]+([-0-9.]+)')
        
        # Some DJI formats have pitch, roll, yaw in degrees
        pitch_pattern = re.compile(r'pitch[:\s]+([-0-9.]+)')
        roll_pattern = re.compile(r'roll[:\s]+([-0-9.]+)')
        yaw_pattern = re.compile(r'yaw[:\s]+([-0-9.]+)')

        for idx, block in enumerate(blocks):
            lat_match = lat_pattern.search(block)
            lon_match = lon_pattern.search(block)
            rel_alt_match = rel_alt_pattern.search(block)
            abs_alt_match = abs_alt_pattern.search(block)
            
            pitch_match = pitch_pattern.search(block)
            roll_match = roll_pattern.search(block)
            yaw_match = yaw_pattern.search(block)
            
            if lat_match and lon_match:
                lat = float(lat_match.group(1))
                lon = float(lon_match.group(1))
                
                # Use rel_alt if available, otherwise 0
                rel_alt = float(rel_alt_match.group(1)) if rel_alt_match else 0.0
                abs_alt = float(abs_alt_match.group(1)) if abs_alt_match else 0.0
                
                pitch = float(pitch_match.group(1)) if pitch_match else 0.0
                roll = float(roll_match.group(1)) if roll_match else 0.0
                yaw = float(yaw_match.group(1)) if yaw_match else 0.0
                
                self.telemetry_data.append({
                    'index': idx,
                    'lat': lat,
                    'lon': lon,
                    'rel_alt': rel_alt,
                    'abs_alt': abs_alt,
                    'pitch': pitch,
                    'roll': roll,
                    'yaw': yaw
                })
        
        # Process Cartesian coordinates
        self._project_to_cartesian()
        return self.telemetry_data

    def _project_to_cartesian(self):
        """Projects WGS84 GPS to local Cartesian metric coordinates relative to Frame 0 origin (0, 0, 0)."""
        if not self.telemetry_data:
            return
            
        # Determine UTM zone from first point
        first_point = self.telemetry_data[0]
        lat0, lon0 = first_point['lat'], first_point['lon']
        
        # Calculate UTM zone
        zone_number = int((lon0 + 180) / 6) + 1
        hemisphere = 'north' if lat0 >= 0 else 'south'
        
        # Define projection
        proj_utm = pyproj.Proj(proj='utm', zone=zone_number, ellps='WGS84', datum='WGS84')
        
        # Get origin in UTM
        x0, y0 = proj_utm(lon0, lat0)
        z0 = first_point['rel_alt']
        
        for pt in self.telemetry_data:
            x, y = proj_utm(pt['lon'], pt['lat'])
            pt['x'] = x - x0
            pt['y'] = y - y0
            pt['z'] = pt['rel_alt'] - z0
