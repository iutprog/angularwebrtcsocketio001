import { Component, OnInit } from '@angular/core';
import { MediaServiceService } from '../services/media-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.css'
})
export class VideoCallComponent implements OnInit {
rejectCall() {
  this.WebrtcService.rejectCall();
  this.incomingCall = false;
  this.callInProgress = false;

  const remoteVideo  = document.getElementById('remoteVideo') as HTMLVideoElement ;
  if(remoteVideo) remoteVideo.srcObject = null;
}
acceptCall() {
   this.WebrtcService.acceptCall();
   this.incomingCall = false;
   this.callInProgress = true;
}
stopCall() {
 this.WebrtcService.startCall();
 this.callInProgress = false;

  const localVideo  = document.getElementById('localVideo') as HTMLVideoElement ;
  if(localVideo) localVideo.srcObject = null;
}
startCall() {
 this.WebrtcService.startCall();
 this.callInProgress = true;
}
  localStream!: MediaStream;  // Holds the local media stream (video/audio)
  incomingCall = false;  // Flag to indicate if there’s an incoming call
  callInProgress = false;  // Flag to track if a call is active

  constructor ( private WebrtcService: MediaServiceService) {

  }

  async ngOnInit(): Promise<void> {
     
   try {

    this.localStream = await this.WebrtcService.initializeMedia();
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
    if(localVideo) localVideo.srcObject = this.localStream;

    this.WebrtcService.incomingCall.subscribe( ()=>this.incomingCall = true);
    this.WebrtcService.remoteStream.subscribe ( (remoteStream) => {
      const remoteVideo  = document.getElementById('remoteVideo') as HTMLVideoElement;
      if(remoteVideo) remoteVideo.srcObject = remoteStream;

    });
   }catch(error){
    console.error('Error initializing media :', error);
   }
      
  }

}
