import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search';
import { Auth } from '../../services/auth';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-my-videos',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './my-videos.html',
})
export class MyVideosComponent implements OnInit {
  videos: any[] = [];

  constructor(private searchService: SearchService) {}

  ngOnInit(): void {
    this.searchService.getMyVideos().subscribe(videos => {
      this.videos = videos;
    });
  }
}
