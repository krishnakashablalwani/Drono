import numpy as np
from scipy.interpolate import griddata
import rasterio
from rasterio.transform import from_origin
import trimesh
import os
import logging

logger = logging.getLogger(__name__)

class DEMGenerator:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir

    def generate(self, glb_path: str, gsd: float = 0.022):
        """Generates a DEM GeoTIFF from the mesh."""
        try:
            mesh = trimesh.load(glb_path, force='mesh')
            vertices = np.asarray(mesh.vertices)
            
            x = vertices[:, 0]
            y = vertices[:, 1]
            z = vertices[:, 2]
            
            # Create grid
            min_x, max_x = np.min(x), np.max(x)
            min_y, max_y = np.min(y), np.max(y)
            
            grid_x, grid_y = np.mgrid[min_x:max_x:gsd, min_y:max_y:gsd]
            
            # Interpolate
            grid_z = griddata((x, y), z, (grid_x, grid_y), method='linear')
            grid_z = np.nan_to_num(grid_z, nan=np.nanmin(z))
            
            # Save GeoTIFF
            transform = from_origin(min_x, max_y, gsd, gsd)
            dem_path = os.path.join(self.output_dir, 'dem.tif')
            
            with rasterio.open(
                dem_path, 'w', driver='GTiff',
                height=grid_z.shape[1], width=grid_z.shape[0],
                count=1, dtype=str(grid_z.dtype),
                crs='+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs', # dummy crs, could parse from telemetry
                transform=transform
            ) as dst:
                # rasterio expects (bands, rows, columns), grid_z is (x, y) so transpose
                dst.write(grid_z.T, 1)
                
            return dem_path
        except Exception as e:
            logger.error(f"DEM generation failed: {e}")
            return None
