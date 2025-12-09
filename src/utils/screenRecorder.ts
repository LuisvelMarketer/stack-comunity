export class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private maxDuration: number;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(maxDurationSeconds: number = 30) {
    this.maxDuration = maxDurationSeconds * 1000;
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      // Handle stream ending (user clicks "Stop sharing")
      this.stream.getVideoTracks()[0].onended = () => {
        this.stop();
      };

      this.mediaRecorder.start(1000); // Collect data every second

      // Auto-stop after max duration
      this.timeoutId = setTimeout(() => {
        this.stop();
      }, this.maxDuration);
    } catch (error) {
      console.error('Error starting screen recording:', error);
      throw error;
    }
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve(this.chunks.length > 0 ? new Blob(this.chunks, { type: this.getSupportedMimeType() }) : null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.getSupportedMimeType() });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }

  private getSupportedMimeType(): string {
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return 'video/webm';
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }
}
