import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit, AfterViewInit{

  context: CanvasRenderingContext2D;

  sharpness = 0;

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
    const width = this.canvas.nativeElement.width;
    const height = this.canvas.nativeElement.height;
    // tslint:disable-next-line: max-line-length
    const imageData = this.context.getImageData(0, 0, width, height);

    let newImageData: ImageData;

    // tslint:disable-next-line: max-line-length
    newImageData = new ImageData(this.sharpenImage(imageData.data, width, height, this.sharpness), width, height);

    this.context.putImageData(newImageData, 0, 0);
  }

  // tslint:disable-next-line: max-line-length
  sharpenImage(imageData: Uint8ClampedArray, width: number, height: number, level: number): Uint8ClampedArray {
    // get chunks of 3 rows
    if (level < 5) {
      return imageData;
    }
    const newImage = new Uint8ClampedArray(imageData);
    const pixels = width * height;
    for (let i = 0; i < imageData.length; i += 4) {

      const redPixels = [];
      // const greenPixels = [];
      // const bluePixels = [];

      // red pixels
      // sharpen [-1,-1,-1,-1, level / 4 , -1 ,-1, -1, -1]
      redPixels.push(imageData[i - height - 4] * -1);
      redPixels.push(imageData[i - height] * -1);
      redPixels.push(imageData[i - height + 4] * -1);
      redPixels.push(imageData[i - 4] * -1);
      redPixels.push(imageData[i] * level / 4);
      redPixels.push(imageData[i + 4] * -1);
      redPixels.push(imageData[i + height - 4] * -1);
      redPixels.push(imageData[i + height] * -1);
      redPixels.push(imageData[i + height + 4] * -1);

      // when pixel is out of bounds, use starting value
      let redSum = 0;
      redPixels.forEach((pixel) => {
        if (pixel) {
          redSum += pixel;
        }
      });
      newImage[i] = redSum;
    }

    return newImage;
  }

  resetCanvas() {
    this.context.drawImage(this.originalImage, 0, 0,
                           this.originalImage.width, this.originalImage.height, 0, 0,
                           this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }

}
