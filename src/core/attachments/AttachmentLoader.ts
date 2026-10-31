import type { Skin } from "../Skin.js";
import type { BoundingBoxAttachment } from "./BoundingBoxAttachment.js";
import type { ClippingAttachment } from "./ClippingAttachment.js";
import type { MeshAttachment } from "./MeshAttachment.js";
import type { PathAttachment } from "./PathAttachment.js";
import type { PointAttachment } from "./PointAttachment.js";
import type { RegionAttachment } from "./RegionAttachment.js";
import type { Sequence } from "./Sequence.js";

/** The interface which can be implemented to customize creating and populating attachments.
 *
 * See [Loading skeleton data](http://esotericsoftware.com/spine-loading-skeleton-data#AttachmentLoader) in the Spine
 * Runtimes Guide. */
export interface AttachmentLoader {
	/** @return May be null to not load an attachment. */
	newRegionAttachment (skin: Skin, placeholder: string, name: string, path: string, sequence: Sequence): RegionAttachment;

	/** @return May be null to not load an attachment. */
	newMeshAttachment (skin: Skin, placeholder: string, name: string, path: string, sequence: Sequence): MeshAttachment;

	/** @return May be null to not load an attachment. */
	newBoundingBoxAttachment (skin: Skin, placeholder: string, name: string): BoundingBoxAttachment;

	/** @return May be null to not load an attachment */
	newPathAttachment (skin: Skin, placeholder: string, name: string): PathAttachment;

	/** @return May be null to not load an attachment */
	newPointAttachment (skin: Skin, placeholder: string, name: string): PointAttachment;

	/** @return May be null to not load an attachment */
	newClippingAttachment (skin: Skin, placeholder: string, name: string): ClippingAttachment;
}
