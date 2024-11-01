import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VideoCallComponent } from "./video-call/video-call.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, VideoCallComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angularwebrtcsocketio001';
}
