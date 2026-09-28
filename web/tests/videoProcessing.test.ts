import { computeLaplacianVariance } from '../src/lib/videoProcessing';

describe('Laplacian Variance', () => {
  it('should compute zero variance for a solid color image', () => {
    const width = 100;
    const height = 100;
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 128; // R
      pixels[i + 1] = 128; // G
      pixels[i + 2] = 128; // B
      pixels[i + 3] = 255; // A
    }

    const variance = computeLaplacianVariance(pixels, width, height, 1);
    expect(variance).toBe(0);
  });

  it('should compute high variance for a noisy image', () => {
    const width = 100;
    const height = 100;
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.random() * 255;
      pixels[i + 1] = Math.random() * 255;
      pixels[i + 2] = Math.random() * 255;
      pixels[i + 3] = 255;
    }

    const variance = computeLaplacianVariance(pixels, width, height, 1);
    expect(variance).toBeGreaterThan(1000);
  });
});
