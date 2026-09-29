import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.sfm_engine import SfMReconstructionEngine

def test_sfm_initialization():
    sfm = SfMReconstructionEngine()
    assert sfm.net is not None, "Model failed to load"
    assert os.path.exists(sfm.model_path), "Model file not found"

if __name__ == "__main__":
    test_sfm_initialization()
