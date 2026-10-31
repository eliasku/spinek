import { AnimationState } from "spinek/core/AnimationState";
import { AssetManagerBase } from "spinek/core/AssetManagerBase";
import { AtlasAttachmentLoader } from "spinek/core/AtlasAttachmentLoader";
import { SkeletonBinary } from "spinek/core/SkeletonBinary";
import { SkeletonJson } from "spinek/core/SkeletonJson";
import type { SkeletonData } from "spinek/core/SkeletonData";
import type { TextureAtlas } from "spinek/core/TextureAtlas";

export const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const status = document.querySelector<HTMLOutputElement>("#status")!;

export async function loadSkeletonData(assets: AssetManagerBase, binary = false): Promise<SkeletonData> {
  assets.loadTextureAtlas("spineboy.atlas");
  const path = binary ? "spineboy-pro.skel" : "spineboy-pro.json";
  if (binary) assets.loadBinary(path);
  else assets.loadJson(path);
  await assets.loadAll();
  const loader = new AtlasAttachmentLoader(assets.require("spineboy.atlas") as TextureAtlas);
  return binary
    ? new SkeletonBinary(loader).readSkeletonData(assets.require(path) as Uint8Array)
    : new SkeletonJson(loader).readSkeletonData(assets.require(path));
}

export function runExample(state: AnimationState, render: (delta: number) => void, dispose: () => void) {
  const select = document.querySelector<HTMLSelectElement>("#animation")!;
  const pause = document.querySelector<HTMLButtonElement>("#pause")!;
  for (const animation of state.data.skeletonData.animations) {
    select.add(new Option(animation.name, animation.name));
  }
  select.value = "walk";
  state.data.defaultMix = 0.2;
  state.setAnimation(0, select.value, true);
  select.disabled = pause.disabled = false;
  select.onchange = () => state.setAnimation(0, select.value, true);
  let paused = false;
  pause.onclick = () => {
    paused = !paused;
    pause.textContent = paused ? "Resume" : "Pause";
    pause.setAttribute("aria-pressed", String(paused));
  };
  let last = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const delta = paused ? 0 : Math.min((now - last) / 1000, 0.1);
    last = now;
    try {
      render(delta);
      status.value = `Playing ${select.value}${paused ? " (paused)" : ""}`;
      frame = requestAnimationFrame(tick);
    } catch (error) {
      dispose();
      showError(error);
    }
  };
  frame = requestAnimationFrame(tick);
  window.addEventListener(
    "pagehide",
    () => {
      cancelAnimationFrame(frame);
      dispose();
    },
    { once: true },
  );
}

export function showError(error: unknown) {
  status.value = `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
  status.setAttribute("role", "alert");
  console.error(error);
}
