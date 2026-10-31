import type { EventData } from "./EventData.js";

/** Fired by {@link EventTimeline} when specific animation times are reached.
 *
 * See Timeline {@link Timeline.apply},
 * AnimationStateListener {@link AnimationStateListener.event}, and
 * [Events](http://esotericsoftware.com/spine-events) in the Spine User Guide. */
export class Event {
  /** The animation time this event was keyed, or -1 for the setup pose. */
  time: number = 0;

  readonly data: EventData;

  /** The integer payload for this event. */
  intValue: number = 0;

  /** The float payload for this event. */
  floatValue: number = 0;

  stringValue: string | null = null;

  /** If an audio path is set, the volume for the audio. */
  volume: number = 0;

  /** If an audio path is set, the left/right balance for the audio. */
  balance: number = 0;

  constructor(time: number, data: EventData) {
    if (!data) throw new Error("data cannot be null.");
    this.time = time;
    this.data = data;
  }
}
