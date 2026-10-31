(() => {
	if (typeof Math.fround === "undefined") {
		Math.fround = ((array) => (x: number) => {
			array[0] = x;
			return array[0];
		})(new Float32Array(1));
	}
})();

export { }
