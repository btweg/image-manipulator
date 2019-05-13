import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit, AfterViewInit{

  context: CanvasRenderingContext2D;

  sharpness = 0;

  originalImage: CanvasImageSource;

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
    // tslint:disable-next-line: max-line-length
    const imageData = this.context.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    let newImageData: ImageData;

    // tslint:disable-next-line: max-line-length
    newImageData = new ImageData(this.sharpenImage(imageData.data, this.sharpness), this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    this.context.putImageData(newImageData, 0, 0);
  }

  sharpenImage(imageData: Uint8ClampedArray, level: number): Uint8ClampedArray {
    for (let i = 0; i < imageData.length; i += 1) {
      imageData[i] = Math.floor(imageData[i] * 1.2);
      if (imageData[i] > 255) {
        imageData[i] = 255;
      }
    }
    return imageData;
  }

}
