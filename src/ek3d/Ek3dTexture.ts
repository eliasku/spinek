/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated April 5, 2025. Replaces all prior versions.
 *
 * Copyright (c) 2013-2025, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/

import { BlendMode, Texture, TextureFilter, TextureWrap } from "../core/index.js";
import { Texture as RenderTexture } from "ek3d/textures/Texture";
import { Blending, Factor, TextureFilter as RenderFilter, Wrapping } from "ek3d/constants";

export class Ek3dTexture extends Texture {
	texture: RenderTexture;

	constructor (image: HTMLImageElement | ImageBitmap, pma = false) {
		super(image);
		this.texture = new RenderTexture(image);
		// Spine's renderer uses premultiplied alpha blending.
		this.texture.premultiplyAlpha = !pma;
		this.texture.flipY = false;

		this.texture.needsUpdate = true;
	}

	setFilters (minFilter: TextureFilter, magFilter: TextureFilter) {
		this.texture.minFilter = Ek3dTexture.toMinificationFilter(minFilter);
		this.texture.magFilter = Ek3dTexture.toMagnificationFilter(magFilter);
	}

	setWraps (uWrap: TextureWrap, vWrap: TextureWrap) {
		this.texture.wrapS = Ek3dTexture.toEk3dTextureWrap(uWrap);
		this.texture.wrapT = Ek3dTexture.toEk3dTextureWrap(vWrap);
	}

	dispose () {
		this.texture.dispose();
	}

	static toMinificationFilter (filter: TextureFilter): RenderFilter {
		if (filter === TextureFilter.Linear) return RenderFilter.Linear;
		else if (filter === TextureFilter.MipMap) return RenderFilter.LinearMipmapLinear; // also includes TextureFilter.MipMapLinearLinear
		else if (filter === TextureFilter.MipMapLinearNearest) return RenderFilter.LinearMipmapNearest;
		else if (filter === TextureFilter.MipMapNearestLinear) return RenderFilter.NearestMipmapLinear;
		else if (filter === TextureFilter.MipMapNearestNearest) return RenderFilter.NearestMipmapNearest;
		else if (filter === TextureFilter.Nearest) return RenderFilter.Nearest;
		else throw new Error("Unknown texture filter: " + filter);
	}

	static toMagnificationFilter (filter: TextureFilter): RenderFilter {
		if (filter === TextureFilter.Linear) return RenderFilter.Linear;
		else if (filter === TextureFilter.MipMap) return RenderFilter.Linear;
		else if (filter === TextureFilter.MipMapLinearNearest) return RenderFilter.Nearest;
		else if (filter === TextureFilter.MipMapNearestLinear) return RenderFilter.Linear;
		else if (filter === TextureFilter.MipMapNearestNearest) return RenderFilter.Nearest;
		else if (filter === TextureFilter.Nearest) return RenderFilter.Nearest;
		else throw new Error("Unknown texture filter: " + filter);
	}

	static toEk3dTextureWrap (wrap: TextureWrap) {
		if (wrap === TextureWrap.ClampToEdge) return Wrapping.ClampToEdge;
		else if (wrap === TextureWrap.MirroredRepeat) return Wrapping.MirroredRepeat;
		else if (wrap === TextureWrap.Repeat) return Wrapping.Repeat;
		else throw new Error("Unknown texture wrap: " + wrap);
	}

	static toBlending (blend: BlendMode): BlendOptions {
		if (blend === BlendMode.Normal) return { blending: Blending.Normal };
		else if (blend === BlendMode.Additive) return { blending: Blending.Additive };
		else if (blend === BlendMode.Multiply) return {
			blending: Blending.Custom,
			blendSrc: Factor.DstColor,
			blendDst: Factor.OneMinusSrcAlpha,
			blendSrcAlpha: Factor.One,
			blendDstAlpha: Factor.OneMinusSrcAlpha,
		}
		else if (blend === BlendMode.Screen) return {
			blending: Blending.Custom,
			blendSrc: Factor.One,
			blendDst: Factor.OneMinusSrcColor,
			blendSrcAlpha: Factor.One,
			blendDstAlpha: Factor.OneMinusSrcColor,
		}
		else throw new Error("Unknown blendMode: " + blend);
	}
}

export type BlendOptions = {
	blending: Blending,
	blendSrc?: Factor,
	blendDst?: Factor,
	blendSrcAlpha?: Factor,
	blendDstAlpha?: Factor,
}
