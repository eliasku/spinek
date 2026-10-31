import { expect, it } from "vite-plus/test";
import { Matrix4 } from "spinek/webgl/Matrix4";

it("preserves multiplication order and self-aliasing across matrix instances", () => {
  const a = new Matrix4().set([2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 5, 6, 7, 1]);
  const b = new Matrix4().translate(-1, 2, 3);
  const right = a.copy().multiply(b);
  const left = a.copy().multiplyLeft(b);
  const square = a.copy();
  square.multiply(square);
  const squareLeft = a.copy();
  squareLeft.multiplyLeft(squareLeft);

  expect(right.values).toEqual(new Float32Array([2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 3, 12, 19, 1]));
  expect(left.values).toEqual(new Float32Array([2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 4, 8, 10, 1]));
  const expectedSquare = new Float32Array([4, 0, 0, 0, 0, 9, 0, 0, 0, 0, 16, 0, 15, 24, 35, 1]);
  expect(square.values).toEqual(expectedSquare);
  expect(squareLeft.values).toEqual(expectedSquare);
});

it("keeps transpose and inversion results independent after a singular inversion", () => {
  const transposed = new Matrix4().set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]).transpose();
  const inverse = new Matrix4().set([2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 5, 6, 7, 1]).invert();
  const singular = new Matrix4().set(new Float32Array(16));
  expect(() => singular.invert()).toThrow(Error);

  expect(transposed.values).toEqual(new Float32Array([1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16]));
  transposed.transpose();
  expect(transposed.values).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]));
  expect(inverse.values).toEqual(new Float32Array([0.5, 0, 0, 0, 0, 1 / 3, 0, 0, 0, 0, 0.25, 0, -2.5, -2, -1.75, 1]));
  expect(singular.values).toEqual(new Float32Array(16));
});
