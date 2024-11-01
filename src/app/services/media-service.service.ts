import { EventEmitter, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class MediaServiceService {
  private socket: Socket;  // Socket.IO client instance for signaling
  private peerConnection!: RTCPeerConnection;  // WebRTC peer connection
  private localStream!: MediaStream;  // Local media stream (audio/video)
  
  public incomingCall = new EventEmitter<void>();  // Notify when there's an incoming call
  public callAccepted = new EventEmitter<MediaStream>();  // Notify when a call is accepted
  public remoteStream = new EventEmitter<MediaStream>();  // Emit the remote video stream
  
  constructor() {
    
    this.socket = io('https://192.168.1.113:3000'); //Socket = IP + Port
    this.initializeSocketEvents();
    
   }

   // Request access to the local media devices (camera and microphone)
  async initializeMedia() {
    try {
      // Request access to video and audio (audio is set to false here)
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      return this.localStream;  // Return the stream for use in the component
    } catch (error) {
      console.error('Error accessing media devices.', error);
      throw error;  // Rethrow to handle the error in the component
    }
  }

 // Setup events listeners for socketio to handle signaling messages

  initializeSocketEvents() {
    
    // Listen for an offer message from the caller
    this.socket.on('offer', async (offer) => {
      console.log("Received offer");  // Log the received offer
      this.incomingCall.emit();  // Notify component of incoming call
      await this.createPeerConnection();  // Set up the peer connection for the callee
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));  // Set the caller's offer as the remote description
    });


    // Listen for an answer message from the callee
    this.socket.on('answer', (answer) => {
      console.log("Received answer");  // Log the received answer
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));  // Set the callee's answer as the remote description
    });

    // Listen for ICE candidate messages
    this.socket.on('candidate', (candidate) => {
      console.log("Received ICE candidate");  // Log the received candidate
      this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));  // Add the received candidate to the peer connection
    });

  }

  createPeerConnection() {
    // Initialize the peer connection with an optional STUN server for NAT traversal
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]  // Public Google STUN server
    });

    // Listen for ICE candidates generated by the peer connection and send them to the other peer
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) this.socket.emit('candidate', event.candidate);  // Send the ICE candidate to the other peer
    };

    // Listen for incoming media (video/audio) tracks from the remote peer
    this.peerConnection.ontrack = (event) => {
      console.log("Setting remote stream");  // Log that the remote stream is being set
      this.remoteStream.emit(event.streams[0]);  // Emit the remote stream to the component for display
    };
  }


  // Starts a call by creating an offer and sending it to the callee
  async startCall() {
    await this.createPeerConnection();  // Initialize the peer connection
    this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));  // Add local video and audio tracks to the connection
    const offer = await this.peerConnection.createOffer();  // Create an SDP offer
    await this.peerConnection.setLocalDescription(offer);  // Set the local description with the created offer
    this.socket.emit('offer', this.peerConnection.localDescription);  // Send the offer to the callee via Socket.IO
  }

// Accepts an incoming call by creating an answer and sending it to the caller
async acceptCall() {
  this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));  // Add local video and audio tracks
  const answer = await this.peerConnection.createAnswer();  // Create an SDP answer
  await this.peerConnection.setLocalDescription(answer);  // Set the local description with the answer
  this.socket.emit('answer', this.peerConnection.localDescription);  // Send the answer to the caller via Socket.IO
}

   rejectCall() {
      this.cleanup();
   }

  // Stops the call by stopping media tracks and cleaning up connections
  stopCall() {
    this.cleanup();  // Close the peer connection and reset

    // Stop all tracks in the local media stream to release the camera and microphone
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Emit a null stream to notify the component to clear the remote video
    this.remoteStream.emit(null as any);
  }


   // Cleans up the peer connection by closing it and releasing resources
   cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close();  // Close the peer connection to end the call
      this.peerConnection = null as any;  // Reset the peer connection object
    }
  }
}