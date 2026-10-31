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

import { BlendMode } from "../core/index.js";
import { Mesh } from "ek3d/objects/Mesh";
import { BufferGeometry } from "ek3d/core/BufferGeometry";
import { BufferAttribute } from "ek3d/core/BufferAttribute";
import { InterleavedBuffer } from "ek3d/core/InterleavedBuffer";
import { InterleavedBufferAttribute } from "ek3d/core/InterleavedBufferAttribute";
import { Material } from "ek3d/materials/Material";
import { ShaderMaterial } from "ek3d/materials/ShaderMaterial";
import type { Texture as EkTexture } from "ek3d/textures/Texture";
import { BufferUsage } from "ek3d/constants";
import colorVertex from "ek3d/renderers/shaders/ShaderChunk/color_vertex.glsl";
import colorFragment from "ek3d/renderers/shaders/ShaderChunk/color_fragment.glsl";
import premultipliedAlphaFragment from "ek3d/renderers/shaders/ShaderChunk/premultiplied_alpha_fragment.glsl";
import colorspaceFragment from "ek3d/renderers/shaders/ShaderChunk/colorspace_fragment.glsl";
import { SkeletonMesh } from "./SkeletonMesh.js";
import { Ek3dTexture, type BlendOptions } from "./Ek3dTexture.js";

export type MaterialWithMap = Material & { map: EkTexture | null };
export type MaterialParameters = Pick<Partial<Material>,
	"side" | "depthWrite" | "depthTest" | "transparent" | "alphaTest" | "vertexColors" | "premultipliedAlpha" | "forceSinglePass">;
export class MeshBatcher extends Mesh<MaterialWithMap[]> {
	public static MAX_VERTICES = 10920;

	private vertexSize = 9;
	private vertexBuffer: InterleavedBuffer;
	private vertices: Float32Array;
	private verticesLength = 0;
	private indices: Uint16Array;
	private indicesLength = 0;
	private materialGroups: [number, number, number][] = [];

	constructor (
		maxVertices: number = MeshBatcher.MAX_VERTICES,
		private materialFactory: (parameters: MaterialParameters) => MaterialWithMap,
		private twoColorTint = true,
	) {
		super(new BufferGeometry(), []);
		// Animated vertices invalidate any cached bounding sphere.
		this.frustumCulled = false;

		if (maxVertices > MeshBatcher.MAX_VERTICES) throw new Error("Can't have more than 10920 triangles per batch: " + maxVertices);

		if (twoColorTint) {
			this.vertexSize += 3;
		}

		this.vertices = new Float32Array(maxVertices * this.vertexSize);
		this.indices = new Uint16Array(maxVertices * 3);

		const normals = new Float32Array(maxVertices * 3);
		for (let i = 0; i < maxVertices * 3; i += 3) {
			normals[i] = 0;
			normals[i + 1] = 0;
			normals[i + 2] = -1;
		}

		const vertexBuffer = new InterleavedBuffer(this.vertices, this.vertexSize)
		this.vertexBuffer = vertexBuffer;
		this.vertexBuffer.usage = BufferUsage.DynamicDraw;

		const geo = this.geometry;
		geo.setAttribute("position", new InterleavedBufferAttribute(vertexBuffer, 3, 0, false));
		geo.setAttribute("color", new InterleavedBufferAttribute(vertexBuffer, 4, 3, false));
		geo.setAttribute("uv", new InterleavedBufferAttribute(vertexBuffer, 2, 7, false));
		if (twoColorTint)
			geo.setAttribute("darkcolor", new InterleavedBufferAttribute(vertexBuffer, 3, 9, false));

		const normalBuffer = new BufferAttribute(normals, 3);
		normalBuffer.usage = BufferUsage.StaticDraw;
		geo.setAttribute("normal", normalBuffer);

		const indexBuffer = new BufferAttribute(this.indices, 1);
		indexBuffer.usage = BufferUsage.DynamicDraw;
		geo.setIndex(indexBuffer);

		geo.drawRange.start = 0;
		geo.drawRange.count = 0;
		this.geometry = geo;
		this.material = [];
	}

	dispose () {
		this.geometry.dispose();
		for (const material of this.material) material.dispose();
	}

	clear () {
		this.geometry.drawRange.count = 0;
		this.geometry.clearGroups();
		this.materialGroups = [];
		for (const material of this.material) material.map = null;
		return this;
	}

	begin () {
		this.verticesLength = 0;
		this.indicesLength = 0;
	}

	canBatch (numVertices: number, numIndices: number) {
		if (this.indicesLength + numIndices > this.indices.length) return false;
		if (this.verticesLength / this.vertexSize + numVertices > this.vertices.length / this.vertexSize) return false;
		return true;
	}

	batch (vertices: ArrayLike<number>, verticesLength: number, indices: ArrayLike<number>, indicesLength: number, z: number = 0) {
		let indexStart = this.verticesLength / this.vertexSize;
		let vertexBuffer = this.vertices;
		let i = this.verticesLength;
		let j = 0;
		if (this.twoColorTint) {
			for (; j < verticesLength;) {
				vertexBuffer[i++] = vertices[j++];  // x
				vertexBuffer[i++] = vertices[j++];  // y
				vertexBuffer[i++] = z;				// z

				vertexBuffer[i++] = vertices[j++];  // r
				vertexBuffer[i++] = vertices[j++];  // g
				vertexBuffer[i++] = vertices[j++];  // b
				vertexBuffer[i++] = vertices[j++];  // a

				vertexBuffer[i++] = vertices[j++];  // u
				vertexBuffer[i++] = vertices[j++];  // v

				vertexBuffer[i++] = vertices[j++];  // dark r
				vertexBuffer[i++] = vertices[j++];  // dark g
				vertexBuffer[i++] = vertices[j++];  // dark b
				j++;
			}
		} else {
			for (; j < verticesLength;) {
				vertexBuffer[i++] = vertices[j++];  // x
				vertexBuffer[i++] = vertices[j++];  // y
				vertexBuffer[i++] = z;				// z

				vertexBuffer[i++] = vertices[j++];  // r
				vertexBuffer[i++] = vertices[j++];  // g
				vertexBuffer[i++] = vertices[j++];  // b
				vertexBuffer[i++] = vertices[j++];  // a

				vertexBuffer[i++] = vertices[j++];  // u
				vertexBuffer[i++] = vertices[j++];  // v
			}
		}
		this.verticesLength = i;

		let indicesArray = this.indices;
		for (i = this.indicesLength, j = 0; j < indicesLength; i++, j++)
			indicesArray[i] = indices[j] + indexStart;
		this.indicesLength += indicesLength;
	}

	end () {
		this.vertexBuffer.needsUpdate = this.verticesLength > 0;
		this.vertexBuffer.clearUpdateRanges();
		this.vertexBuffer.addUpdateRange(0, this.verticesLength);
		const geo = (<BufferGeometry>this.geometry);
		this.closeMaterialGroups();
		const index = geo.getIndex();
		if (!index) throw new Error("BufferAttribute must not be null.");
		index.needsUpdate = this.indicesLength > 0;
		index.clearUpdateRanges();
		index.addUpdateRange(0, this.indicesLength);
		geo.drawRange.start = 0;
		geo.drawRange.count = this.indicesLength;
	}

	addMaterialGroup (indicesLength: number, materialGroup: number) {
		const currentGroup = this.materialGroups[this.materialGroups.length - 1];

		if (currentGroup === undefined || currentGroup[2] !== materialGroup) {
			this.materialGroups.push([this.indicesLength, indicesLength, materialGroup]);
		} else {
			currentGroup[1] += indicesLength;
		}
	}

	private closeMaterialGroups () {
		const geometry = this.geometry as BufferGeometry;
		for (let i = 0; i < this.materialGroups.length; i++) {
			const [startIndex, count, materialGroup] = this.materialGroups[i];

			geometry.addGroup(startIndex, count, materialGroup);
		}
	}

	findMaterialGroup (slotTexture: EkTexture, slotBlendMode: BlendMode) {
		const blendingObject = Ek3dTexture.toBlending(slotBlendMode);
		let group = -1;

		if (Array.isArray(this.material)) {
			for (let i = 0; i < this.material.length; i++) {
				const meshMaterial = this.material[i] as MaterialWithMap;

				if (!meshMaterial.map) {
					updateMeshMaterial(meshMaterial, slotTexture, blendingObject);
					return i;
				}

				if (meshMaterial.map === slotTexture
					&& blendingObject.blending === meshMaterial.blending
					&& (blendingObject.blendSrc === undefined || blendingObject.blendSrc === meshMaterial.blendSrc)
					&& (blendingObject.blendDst === undefined || blendingObject.blendDst === meshMaterial.blendDst)
					&& (blendingObject.blendSrcAlpha === undefined || blendingObject.blendSrcAlpha === meshMaterial.blendSrcAlpha)
					&& (blendingObject.blendDstAlpha === undefined || blendingObject.blendDstAlpha === meshMaterial.blendDstAlpha)
				) {
					return i;
				}
			}

			const meshMaterial = this.newMaterial();
			updateMeshMaterial(meshMaterial as MaterialWithMap, slotTexture, blendingObject);
			this.material.push(meshMaterial);
			group = this.material.length - 1;
		} else {
			throw new Error("MeshBatcher.material needs to be an array for geometry groups to work");
		}

		return group;
	}

	private newMaterial (): MaterialWithMap {
		const meshMaterial = this.materialFactory(SkeletonMesh.DEFAULT_MATERIAL_PARAMETERS);

		if (!('map' in meshMaterial)) {
			throw new Error("The material factory must return a material having the map property for the texture.");
		}

		if (meshMaterial instanceof SkeletonMeshMaterial) {
			if (!this.twoColorTint) {
				meshMaterial.vertexShader = meshMaterial.vertexShader.replace("attribute vec3 darkcolor;", "").replace("vDark = darkcolor;", "vDark = vec3(0.0);");
			}
			return meshMaterial;
		}

		meshMaterial.onBeforeCompile = (shader) => {
			// ek3d expands shader chunks before this hook; Three.js #include tokens no longer exist.
			if (this.twoColorTint) {
				shader.vertexShader = "attribute vec3 darkcolor;\nvarying vec3 vSpineDark;\n" +
					shader.vertexShader.replace(colorVertex, colorVertex + "\nvSpineDark = darkcolor;\n");
				shader.fragmentShader = "varying vec3 vSpineDark;\n" + shader.fragmentShader.replace(colorFragment, `
					#ifdef USE_COLOR_ALPHA
						diffuseColor.rgb = (diffuseColor.a - diffuseColor.rgb) * vSpineDark + diffuseColor.rgb * vColor.rgb;
						diffuseColor.a *= vColor.a;
					#endif
				`);
			}
			shader.fragmentShader = shader.fragmentShader
				.replace(premultipliedAlphaFragment, "")
				.replace(colorspaceFragment, "");
		};
		meshMaterial.customProgramCacheKey = () => this.twoColorTint ? "spinek-two-color" : "spinek-one-color";

		return meshMaterial;
	}
}


function updateMeshMaterial (meshMaterial: MaterialWithMap, slotTexture: EkTexture, blending: BlendOptions) {
	meshMaterial.map = slotTexture;
	Object.assign(meshMaterial, blending);
	meshMaterial.needsUpdate = true;
}


export class SkeletonMeshMaterial extends ShaderMaterial {
	get map(): EkTexture | null { return this.uniforms.map.value; }
	set map(value: EkTexture | null) { this.uniforms.map.value = value; }
	constructor(parameters: MaterialParameters = {}) {
		super({ ...parameters, uniforms: { map: { value: null } },
			vertexShader: `attribute vec3 darkcolor; varying vec2 vUv; varying vec4 vColor; varying vec3 vDark; void main() { vUv = uv; vColor = color; vDark = darkcolor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
			fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying vec4 vColor; varying vec3 vDark; void main() { vec4 tex = texture2D(map, vUv); gl_FragColor = vec4((tex.a - tex.rgb) * vDark + tex.rgb * vColor.rgb, tex.a * vColor.a); if (gl_FragColor.a < 0.001) discard; }`
		});
	}
}
