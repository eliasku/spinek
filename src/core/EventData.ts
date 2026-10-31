import { Event } from "./Event.js";

/** Stores the setup pose values for an {@link Event}.
 *
 * See [Events](http://esotericsoftware.com/spine-events) in the Spine User Guide. */
export class EventData {
  /** The name of the event, unique across all events in the skeleton.
   *
   * See {@link SkeletonData.findEvent}. */
  name: string;

  _audioPath: string | null = null;
  /** Path to an audio file relative to the audio folder as defined in Spine. */
  get audioPath(): string {
    return this._audioPath!;
  }

  set audioPath(audioPath: string | null) {
    if (audioPath == null) throw new Error("audioPath cannot be null.");
    this._audioPath = audioPath;
  }

  /** The setup values that are shared by all events with this data. */
  readonly setupPose = new Event(-1, this);

  constructor(name: string) {
    this.name = name;
  }
}
