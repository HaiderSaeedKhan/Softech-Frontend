import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-box-video',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './box-video.html',
  styleUrls: ['./box-video.css']
})
export class BoxVideoComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() tags: string[] = [];
}
