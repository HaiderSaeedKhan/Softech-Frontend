// import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';

// @Component({
//   selector: 'app-root',
//   imports: [RouterOutlet],
//   templateUrl: './app.html',
//   styleUrl: './app.css'
// })
// export class App {
//   protected title = 'video-cms-frontend';
// }


// 📍 app.component.ts

import { Component } from '@angular/core';
import { Router, NavigationStart, RouterOutlet } from '@angular/router';

export let browserRefresh = false; // global flag used by other components

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected title = 'video-cms-frontend';

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // 🔐 If Router has not navigated yet, it's a full reload or new tab
        browserRefresh = !router.navigated;
      }
    });
  }
}
