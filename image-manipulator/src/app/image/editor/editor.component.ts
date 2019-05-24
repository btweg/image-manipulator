import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit, AfterViewInit{

  context: CanvasRenderingContext2D;

  sharpness: number = 0;
  brightness: number = 0;
  contrast: number = 0;
  simpleDiffuse: number = 0;
  noise: number = 0;
  emboss: number = 0;

  originalImage = new Image();

  @ViewChild('canvas') canvas: ElementRef;

  constructor() { }

  ngOnInit() {
  }

  selectFile(fileEvent): void {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // this.canvas.width = img.width;
        // this.canvas.height = img.height;
        this.context.drawImage(img, 0, 0,
                               img.width, img.height, 0, 0,
                               this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      };

      img.src = event.target['result'];
      this.originalImage = img;
    };
    reader.readAsDataURL(fileEvent.target.files[0]);
  }

  ngAfterViewInit() {
    this.context = (<HTMLCanvasElement>this.canvas.nativeElement).getContext('2d');
  }

  applyFilters() {
    this.resetCanvas();
    const width = this.canvas.nativeElement.width * 4;
    const height = this.canvas.nativeElement.height;
    // tslint:disable-next-line: max-line-length
    const imageData = this.context.getImageData(0, 0, width, height);

    let newImageBinaryData = new Uint8ClampedArray(imageData.data);

    // tslint:disable-next-line: max-line-length
    newImageBinaryData = new Uint8ClampedArray(this.sharpenImage(newImageBinaryData, width, this.sharpness));

    // tslint:disable-next-line: max-line-length
    newImageBinaryData = new Uint8ClampedArray(this.brightenImage(newImageBinaryData, this.brightness));

    // tslint:disable-next-line: max-line-length
    newImageBinaryData = new Uint8ClampedArray(this.contrastImage(newImageBinaryData, this.contrast));

    // tslint:disable-next-line: max-line-length
    newImageBinaryData = new Uint8ClampedArray(this.addNoise(newImageBinaryData, this.noise));

    // tslint:disable-next-line: max-line-length
    newImageBinaryData = new Uint8ClampedArray(this.embossImage(newImageBinaryData, width * 4, this.emboss));

    // create new image from manipulated pixel data
    const newImageData = new ImageData(newImageBinaryData, width, height);

    this.context.putImageData(newImageData, 0, 0);
  }

  // tslint:disable-next-line: max-line-length
  sharpenImage(imageData: Uint8ClampedArray, width: number, level: number): Uint8ClampedArray {

    if (level === 0) {
      return imageData;
    }

    const matrix = [0, -1, 0, -1, 4, -1, 0, -1, 0];
    return this.convoluteImage(matrix, imageData, width, level);
  }

  brightenImage(imageData: Uint8ClampedArray, level: number): Uint8ClampedArray {
    const newImage = new Uint8ClampedArray(imageData);
    const offset = 255 * (level / 100);

    for (let i = 0; i < imageData.length; i += 4) {
      // red
      newImage[i] = imageData[i] + offset;
      // green
      newImage[i + 1] = imageData[i + 1] + offset;
      // blue
      newImage[i + 2] = imageData[i + 2] + offset;
    }

    return newImage;

  }

  contrastImage(imageData: Uint8ClampedArray, level: number): Uint8ClampedArray {

    const factor = (259.0 * (level + 255.0)) / (255.0 * (259.0 - level));
    const newImage = new Uint8ClampedArray(imageData);

    for (let i = 0; i < imageData.length; i += 4) {
      newImage[i] = factor * (imageData[i] - 128.0) + 128.0;
      newImage[i + 1] = factor * (imageData[i + 1] - 128.0) + 128.0;
      newImage[i + 2] = factor * (imageData[i + 2] - 128.0) + 128.0;
    }

    return newImage;
  }

  simpleDiffuseImage(imageData: Uint8ClampedArray, level: number): Uint8ClampedArray {
    const newImage = new Uint8ClampedArray(imageData);

    return newImage;
  }

  addNoise(imageData: Uint8ClampedArray, level: number): Uint8ClampedArray {
    const newImage = new Uint8ClampedArray(imageData);

    for (let i = 0; i < imageData.length; i += 4) {
      // generate random scalar for noise
      const noiseLevel = (Math.random() * (0.5 - -0.5) + -0.5) * level;
      newImage[i] = imageData[i] + noiseLevel;
      newImage[i + 1] = imageData[i + 1] + noiseLevel;
      newImage[i + 2] = imageData[i + 2] + noiseLevel;
    }
    return newImage;
  }

  embossImage(imageData: Uint8ClampedArray, width: number, level: number): Uint8ClampedArray {
    if (level === 0) {
      return imageData;
    }

    const matrix = [
      -2, -1, 0,
      -1,  1, 1,
      0, 1,  2];
    return this.convoluteImage(matrix, imageData, width, level);
  }

  /**
   *
   * @param matrix 1D array representing 3x3 matrix of pixels
   * @param imageData pixel data
   * @param width (Pixel width * 4) of image
   * @param level number from 0-100 for strength of convolution
   */
  // tslint:disable-next-line: max-line-length
  convoluteImage(matrix: number[], imageData: Uint8ClampedArray, width: number, level: number): Uint8ClampedArray {

    const newImage = new Uint8ClampedArray(imageData);

    for (let i = 0; i < imageData.length; i += 4) {

      const redPixels = [];
      const greenPixels = [];
      const bluePixels = [];

      redPixels.push(imageData[i - width - 4] * matrix[0]);
      redPixels.push(imageData[i - width] * matrix[1]);
      redPixels.push(imageData[i - width + 4] * matrix[2]);
      redPixels.push(imageData[i - 4] * matrix[3]);
      redPixels.push(imageData[i] * 4 * matrix[4]);
      redPixels.push(imageData[i + 4] * matrix[5]);
      redPixels.push(imageData[i + width - 4] * matrix[6]);
      redPixels.push(imageData[i + width] * -1);
      redPixels.push(imageData[i + width + 4] * matrix[7]);

      greenPixels.push(imageData[i + 1 - width - 4] * matrix[0]);
      greenPixels.push(imageData[i + 1 - width] * matrix[1]);
      greenPixels.push(imageData[i + 1 - width + 4] * matrix[2]);
      greenPixels.push(imageData[i + 1 - 4] * matrix[3]);
      greenPixels.push(imageData[i + 1] * 4 * matrix[4]);
      greenPixels.push(imageData[i + 1 + 4] * matrix[5]);
      greenPixels.push(imageData[i + 1 + width - 4] * matrix[6]);
      greenPixels.push(imageData[i + 1 + width] * -1);
      greenPixels.push(imageData[i + 1 + width + 4] * matrix[7]);

      bluePixels.push(imageData[i + 2 - width - 4] * matrix[0]);
      bluePixels.push(imageData[i + 2 - width] * matrix[1]);
      bluePixels.push(imageData[i + 2 - width + 4] * matrix[2]);
      bluePixels.push(imageData[i + 2 - 4] * matrix[3]);
      bluePixels.push(imageData[i + 2] * 4 * matrix[4]);
      bluePixels.push(imageData[i + 2 + 4] * matrix[5]);
      bluePixels.push(imageData[i + 2 + width - 4] * matrix[6]);
      bluePixels.push(imageData[i + 2 + width] * -1);
      bluePixels.push(imageData[i + 2 + width + 4] * matrix[7]);

      const redSum = redPixels.reduce((prev, current) => {
        return prev + current;
      }, 0);

      const greenSum = greenPixels.reduce((prev, current) => {
        return prev + current;
      }, 0);

      const blueSum = bluePixels.reduce((prev, current) => {
        return prev + current;
      }, 0);

      /*
      newImage[i] = imageData[i] + (redSum * (level / 100));
      newImage[i + 1] = imageData[i + 1] + (greenSum * (level / 100));
      newImage[i + 2] = imageData[i + 2] + (blueSum * (level / 100));
      */

      newImage[i] =  (redSum * (level / 100));
      newImage[i + 1] = (greenSum * (level / 100));
      newImage[i + 2] = (blueSum * (level / 100));

    }

    return newImage;
  }

  resetCanvas() {
    this.context.drawImage(
      this.originalImage, 0, 0,
      this.originalImage.width, this.originalImage.height, 0, 0,
      this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }

}
