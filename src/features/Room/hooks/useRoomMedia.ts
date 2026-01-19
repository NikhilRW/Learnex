import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {WebRTCService} from 'room/services/WebRTCService';
import {getAuth} from '@react-native-firebase/auth';
import {ExtendedMediaStream} from './useRoomConnection';

export interface UseRoomMediaParams {
  meetingId: string;
  localStream: ExtendedMediaStream | null;
  setLocalStream: React.Dispatch<
    React.SetStateAction<ExtendedMediaStream | null>
  >;
  webRTCService: WebRTCService;
}

export interface UseRoomMediaReturn {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isFrontCamera: boolean;
  handleToggleAudio: () => Promise<void>;
  handleToggleVideo: () => Promise<void>;
  handleFlipCamera: () => Promise<void>;
  handleLocalStreamUpdate: (stream: ExtendedMediaStream | null) => void;
}

export const useRoomMedia = ({
  meetingId,
  localStream,
  setLocalStream,
  webRTCService,
}: UseRoomMediaParams): UseRoomMediaReturn => {
  const currentUser = getAuth().currentUser;

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  // Track camera facing mode for persistence across component re-renders
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const handleToggleAudio = useCallback(async () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);

        // Update participant state in Firestore
        await webRTCService.updateLocalParticipantState(meetingId, {
          isAudioEnabled: audioTrack.enabled,
        });
      }
    }
  }, [localStream, meetingId, webRTCService]);

  const handleToggleVideo = useCallback(async () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);

        // Update participant state in Firestore
        await webRTCService.updateLocalParticipantState(meetingId, {
          isVideoEnabled: videoTrack.enabled,
        });
      }
    }
  }, [localStream, meetingId, webRTCService]);

  // Handle camera flip between front and back
  const handleFlipCamera = useCallback(async () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        try {
          console.log(
            `Flipping camera from ${isFrontCamera ? 'front' : 'back'} to ${isFrontCamera ? 'back' : 'front'}`,
          );

          // Use the native _switchCamera method available in react-native-webrtc
          videoTracks.forEach(track => {
            if (typeof track._switchCamera === 'function') {
              track._switchCamera();
              // Update camera facing mode state
              setIsFrontCamera(!isFrontCamera);
              console.log(
                `Camera flipped successfully to ${!isFrontCamera ? 'front' : 'back'}`,
              );
            } else {
              console.warn('_switchCamera method not available on this track');

              // Fallback approach for browsers or platforms without _switchCamera
              // This would require reinitializing the camera with opposite facing mode
              // but is not implemented in this example as it requires renegotiation
            }
          });
        } catch (error) {
          console.error('Error flipping camera:', error);
        }
      } else {
        console.warn('No video tracks available to flip camera');
        Alert.alert('Camera Error', 'No video available to switch cameras');
      }
    } else {
      console.warn('No local stream available to flip camera');
      Alert.alert('Camera Error', 'Camera not initialized');
    }
  }, [localStream, isFrontCamera]);

  // Add a function to handle local stream updates and renegotiate connections as needed
  const handleLocalStreamUpdate = useCallback(
    (stream: ExtendedMediaStream | null) => {
      if (!stream) return;

      try {
        // Add participant ID if not already set
        if (!stream.participantId) {
          stream.participantId = currentUser?.uid;
        }

        console.log('Updating local stream:', stream.id);
        console.log(
          'Stream tracks:',
          stream
            .getTracks()
            .map(t => `${t.kind}:${t.enabled}`)
            .join(', '),
        );

        // Update the local stream in WebRTCService - this will trigger renegotiation
        webRTCService
          .updateLocalStream(stream, meetingId)
          .then(() => {
            console.log(
              'Local stream updated successfully and connections renegotiated',
            );
          })
          .catch((error: Error) => {
            console.error('Error updating local stream:', error);
          });

        // Update local state
        setLocalStream(stream);
      } catch (error) {
        console.error('Error in handleLocalStreamUpdate:', error);
      }
    },
    [currentUser?.uid, meetingId, setLocalStream, webRTCService],
  );

  return {
    isAudioEnabled,
    isVideoEnabled,
    isFrontCamera,
    handleToggleAudio,
    handleToggleVideo,
    handleFlipCamera,
    handleLocalStreamUpdate,
  };
};
