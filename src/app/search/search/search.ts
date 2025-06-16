import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { ExploreComponent } from '../explore/explore';
import { MyVideosComponent } from '../my-videos/my-videos';
import { Header } from '../../shared/header/header';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, MatTabsModule, ExploreComponent, MyVideosComponent, Header],
  templateUrl: './search.html',
})
export class SearchComponent {}
